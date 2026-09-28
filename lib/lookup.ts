import { aggregateEvidence } from './evidence';
import { CloudflareDnsAdapter, GoogleDnsAdapter } from './providers/dns';
import { VirusTotalAdapter } from './providers/virustotal';
import { applyFreshnessPolicy } from './providers/freshness';
import { ExistingLookupOnlyAdapter, ProviderAdapter, Evidence } from './providers/types';
import { safeLog } from './observability';
import { RuntimeCache } from './runtime/cache';
import { RuntimeCircuitBreaker } from './runtime/circuit';
import { BoundedQueue } from './runtime/queue';
import { consumeBudget } from './runtime/budget';
import { enabledProviderNames, virusTotalApiKeys } from './runtime/features';
import { recordGauge, recordMetric, withMetric } from './runtime/metrics';
import { canonicalizeIndicator } from './security/canonicalize';
import { CAPACITY_LIMITS } from './runtime/capacity';

const cache = new RuntimeCache<Awaited<ReturnType<typeof buildLookupResult>>>('lookup');
const queue = new BoundedQueue(CAPACITY_LIMITS.lookupConcurrencyPerReplica, CAPACITY_LIMITS.lookupMaxPendingPerReplica);
const circuits = new Map<string, RuntimeCircuitBreaker>();
type LookupResponse = Awaited<ReturnType<typeof buildLookupResult>> & { cached: boolean; coalesced: boolean };
const inFlight = new Map<string, Promise<LookupResponse>>();

function retryableProviderError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  return ['PROVIDER_TIMEOUT', 'PROVIDER_DNS_EMPTY', 'ECONNRESET', 'EAI_AGAIN'].includes(code)
    || /^PROVIDER_HTTP_(429|5\d\d)$/.test(code);
}

async function lookupWithRetry(adapter: ProviderAdapter, indicator: ReturnType<typeof canonicalizeIndicator>, signal: AbortSignal) {
  for (let attempt = 0; attempt < CAPACITY_LIMITS.providerRetryAttempts; attempt += 1) {
    try {
      return await adapter.lookup(indicator, signal);
    } catch (error) {
      if (attempt === CAPACITY_LIMITS.providerRetryAttempts - 1 || signal.aborted || !retryableProviderError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 + Math.floor(Math.random() * 50)));
    }
  }
  throw new Error('PROVIDER_RETRY_EXHAUSTED');
}
function productionAdapters(env: NodeJS.ProcessEnv = process.env): ProviderAdapter[] {
  const adapters: ProviderAdapter[] = [new CloudflareDnsAdapter(), new GoogleDnsAdapter()];
  const apiKeys = virusTotalApiKeys(env);
  if (enabledProviderNames(env).includes('virustotal') && apiKeys.length) {
    adapters.push(new VirusTotalAdapter(apiKeys));
  }
  return adapters;
}

async function buildLookupResult(raw: string, adapters: ProviderAdapter[]) {
  const indicator = canonicalizeIndicator(raw);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CAPACITY_LIMITS.providerTimeoutMs);
  try {
    const evidence = await Promise.all(
      adapters.filter((adapter) => adapter.supports(indicator.type)).map(async (adapter): Promise<Evidence> => {
        const circuit = circuits.get(adapter.name) ?? new RuntimeCircuitBreaker(adapter.name);
        circuits.set(adapter.name, circuit);
        if (!(await circuit.canRun())) {
          await recordMetric(`provider.${adapter.name}.circuit_open`, 0);
          return {
            provider: adapter.name, verdict: 'unknown', confidence: 0, observedAt: null,
            fetchedAt: new Date().toISOString(), reasonCodes: ['PROVIDER_CIRCUIT_OPEN'], submissionOccurred: false,
          };
        }
        if (!(await consumeBudget(adapter.name))) {
          await recordMetric(`provider.${adapter.name}.budget_exhausted`, 0);
          return {
            provider: adapter.name, verdict: 'unknown', confidence: 0, observedAt: null,
            fetchedAt: new Date().toISOString(), reasonCodes: ['PROVIDER_BUDGET_EXHAUSTED'], submissionOccurred: false,
          };
        }
        try {
          const result = await withMetric(
            `provider.${adapter.name}.lookup`,
            () => lookupWithRetry(adapter, indicator, controller.signal),
          );
          await circuit.success();
          return result;
        } catch (error) {
          await circuit.failure();
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
    const policyEvidence = evidence.map((item) => applyFreshnessPolicy(item));
    return {
      indicator: { type: indicator.type, displayValue: indicator.displayValue },
      ...aggregateEvidence(policyEvidence),
      evidence: policyEvidence,
      providers: {
        requested: policyEvidence.map((item) => item.provider),
        succeeded: policyEvidence.filter((item) => !item.reasonCodes.some((code) => ['PROVIDER_ERROR', 'PROVIDER_CIRCUIT_OPEN', 'PROVIDER_BUDGET_EXHAUSTED'].includes(code))).map((item) => item.provider),
        failed: policyEvidence.filter((item) => item.reasonCodes.some((code) => ['PROVIDER_ERROR', 'PROVIDER_CIRCUIT_OPEN', 'PROVIDER_BUDGET_EXHAUSTED'].includes(code))).map((item) => item.provider),
      },
      partial: policyEvidence.some((item) => item.reasonCodes.some((code) => ['PROVIDER_ERROR', 'PROVIDER_CIRCUIT_OPEN', 'PROVIDER_BUDGET_EXHAUSTED'].includes(code))),
      policy: { existingLookupOnly: true, submissionOccurred: false },
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function performLookup(
  raw: string,
  adapters: ProviderAdapter[] = productionAdapters().filter((adapter) => enabledProviderNames().includes(adapter.name)),
) {
  const lookupStarted = performance.now();
  const indicator = canonicalizeIndicator(raw);
  const adapterNames = adapters.map((adapter) => adapter.name).sort().join(',');
  const key = `${indicator.type}:${indicator.value}:providers=${adapterNames}`;
  const existing = inFlight.get(key);
  if (existing) {
    await recordMetric('lookup.coalesced', 0);
    return { ...(await existing), cached: false, coalesced: true };
  }
  const execution = (async (): Promise<LookupResponse> => {
    const cached = await cache.get(key);
    if (cached) {
      await recordMetric('lookup.cache_hit', 0);
      await recordMetric('lookup.cached', performance.now() - lookupStarted);
      return { ...cached, cached: true, coalesced: false };
    }
    await recordMetric('lookup.cache_miss', 0);
    const queueState = queue.snapshot();
    await recordGauge('lookup.queue.active', queueState.active);
    await recordGauge('lookup.queue.pending', queueState.pending);
    const result = await queue.run(async () => {
      const built = await buildLookupResult(raw, adapters);
      await cache.set(key, built);
      safeLog('lookup_complete', { type: indicator.type, verdict: built.verdict, partial: built.partial });
      return built;
    });
    await recordMetric('lookup.uncached', performance.now() - lookupStarted);
    return { ...result, cached: false, coalesced: false };
  })();
  inFlight.set(key, execution);
  try {
    return await execution;
  } finally {
    inFlight.delete(key);
  }
}