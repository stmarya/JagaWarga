import type { Evidence } from './types';

const PROVIDER_MAX_AGE_MS: Record<string, number> = {
  virustotal: 7 * 24 * 60 * 60_000,
  'cloudflare-dns': 10 * 60_000,
  'google-dns': 10 * 60_000,
};
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60_000;

export type EvidenceFreshness = 'fresh' | 'stale' | 'unknown';

export function evidenceFreshness(evidence: Evidence, now = Date.now()) {
  const sourceTimestamp = evidence.observedAt ?? evidence.fetchedAt;
  const observed = Date.parse(sourceTimestamp);
  const maxAgeMs = PROVIDER_MAX_AGE_MS[evidence.provider] ?? DEFAULT_MAX_AGE_MS;
  if (!Number.isFinite(observed) || observed > now + 5 * 60_000) {
    return { freshness: 'unknown' as const, ageSeconds: null, maxAgeSeconds: Math.round(maxAgeMs / 1_000) };
  }
  const ageMs = Math.max(0, now - observed);
  return {
    freshness: (ageMs <= maxAgeMs ? 'fresh' : 'stale') as EvidenceFreshness,
    ageSeconds: Math.round(ageMs / 1_000),
    maxAgeSeconds: Math.round(maxAgeMs / 1_000),
  };
}

export function applyFreshnessPolicy(evidence: Evidence, now = Date.now()) {
  const freshness = evidenceFreshness(evidence, now);
  if (freshness.freshness === 'stale' && evidence.verdict === 'benign') {
    return {
      ...evidence,
      verdict: 'unknown' as const,
      confidence: 0,
      reasonCodes: [...new Set([...evidence.reasonCodes, 'STALE_BENIGN_EVIDENCE'])],
      ...freshness,
    };
  }
  return { ...evidence, ...freshness };
}