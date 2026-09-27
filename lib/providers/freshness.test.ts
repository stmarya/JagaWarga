import { describe, expect, it } from 'vitest';
import { applyFreshnessPolicy, evidenceFreshness } from './freshness';
import type { Evidence } from './types';

const base: Evidence = {
  provider: 'virustotal',
  verdict: 'benign',
  confidence: 0.55,
  observedAt: '2026-01-01T00:00:00.000Z',
  fetchedAt: '2026-01-01T00:00:00.000Z',
  reasonCodes: ['VT_NO_NEGATIVE_DETECTIONS'],
  submissionOccurred: false,
};

describe('provider freshness policy', () => {
  it('marks recent provider evidence as fresh', () => {
    expect(evidenceFreshness(base, Date.parse('2026-01-02T00:00:00.000Z')).freshness).toBe('fresh');
  });

  it('does not let stale benign evidence become a safe verdict', () => {
    expect(applyFreshnessPolicy(base, Date.parse('2026-02-01T00:00:00.000Z'))).toMatchObject({
      verdict: 'unknown',
      confidence: 0,
      freshness: 'stale',
      reasonCodes: expect.arrayContaining(['STALE_BENIGN_EVIDENCE']),
    });
  });

  it('retains stale malicious evidence as a warning signal', () => {
    expect(applyFreshnessPolicy(
      { ...base, verdict: 'malicious', reasonCodes: ['KNOWN_MALICIOUS'] },
      Date.parse('2026-02-01T00:00:00.000Z'),
    )).toMatchObject({ verdict: 'malicious', freshness: 'stale' });
  });
});