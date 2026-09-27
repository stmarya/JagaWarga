import { aggregateEvidence } from './evidence';
import { CloudflareDnsAdapter, GoogleDnsAdapter } from './providers/dns';
import { ExistingLookupOnlyAdapter, ProviderAdapter, Evidence } from './providers/types';
import { safeLog } from './observability';
import { TtlCache } from './runtime/cache';
import { CircuitBreaker } from './runtime/circuit';
import { BoundedQueue } from './runtime/queue';
import { consumeBudget } from './runtime/budget';
import { enabledProviderNames } from './runtime/features';
import { canonicalizeIndicator } from './security/canonicalize';

const cache = new TtlCache<Awaited<ReturnType<typeof buildLookupResult>>>();
const queue = new BoundedQueue(4, 100);
const circuits = new Map<string, CircuitBreaker>();
const allProductionAdapters: ProviderAdapter[] = [new CloudflareDnsAdapter(), new GoogleDnsAdapter()];

async function buildLookupResult(raw: string, adapters: ProviderAdapter[]) {
  const indicator = canonicalizeIndicator(raw);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const evidence = await Promise.all(
      adapters.filter((adapter) => adapter.supports(indicator.type)).map(async (adapter): Promise<Evidence> => {
        const circuit = circuits.get(adapter.name) ?? new CircuitBreaker();
        circuits.set(adapter.name, circuit);
        if (!circuit.canRun()) {
          return {
            provider: adapter.name, verdict: 'unknown', confidence: 0, observedAt: null,
            fetchedAt: new Date().toISOString(), reasonCodes: ['PROVIDER_CIRCUIT_OPEN'], submissionOccurred: false,
          };
        }
        if (!consumeBudget(adapter.name)) {
          return {
            provider: adapter.name, verdict: 'unknown', confidence: 0, observedAt: null,
            fetchedAt: new Date().toISOString(), reasonCodes: ['PROVIDER_BUDGET_EXHAUSTED'], submissionOccurred: false,
          };
        }
        try {
          const result = await adapter.lookup(indicator, controller.signal);
          circuit.success();
          return result;
        } catch (error) {
          circuit.failure();
          safeLog('provider_error', { provider: adapter.name, error: error instanceof Error ? error.message : 'unknown' });
          return {
            provider: adapter.name, verdict: 'unknown', confidence: 0, observedAt: null,
            fetchedAt: new Date().toISOString(), reasonCodes: ['PROVIDER_ERROR'], submissionOccurred: false,
          };
        }
      }),
    );
    if (!evidence.length) {
      evidence.push(await new ExistingLookupOnlyAdapter().lookup());
    }
    return {
      indicator: { type: indicator.type, displayValue: indicator.displayValue },
      ...aggregateEvidence(evidence),
      evidence,
      partial: evidence.some((item) => item.reasonCodes.includes('PROVIDER_ERROR')),
      policy: { existingLookupOnly: true, submissionOccurred: false },
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function performLookup(
  raw: string,
  adapters: ProviderAdapter[] = allProductionAdapters.filter((adapter) => enabledProviderNames().includes(adapter.name)),
) {
  const indicator = canonicalizeIndicator(raw);
  const key = `${indicator.type}:${indicator.value}`;
  const cached = cache.get(key);
  if (cached) return { ...cached, cached: true };
  return queue.run(async () => {
    const result = await buildLookupResult(raw, adapters);
    cache.set(key, result);
    safeLog('lookup_complete', { type: indicator.type, verdict: result.verdict, partial: result.partial });
    return { ...result, cached: false };
  });
}