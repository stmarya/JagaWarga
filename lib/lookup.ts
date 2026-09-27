import { aggregateEvidence } from './evidence';
import { ExistingLookupOnlyAdapter, ProviderAdapter } from './providers/types';
import { canonicalizeIndicator } from './security/canonicalize';

export async function performLookup(
  raw: string,
  adapters: ProviderAdapter[] = [new ExistingLookupOnlyAdapter()],
) {
  const indicator = canonicalizeIndicator(raw);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const evidence = await Promise.all(
      adapters
        .filter((adapter) => adapter.supports(indicator.type))
        .map((adapter) => adapter.lookup(indicator, controller.signal)),
    );
    return {
      indicator: { type: indicator.type, displayValue: indicator.displayValue },
      ...aggregateEvidence(evidence),
      evidence,
      policy: { existingLookupOnly: true, submissionOccurred: false },
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}