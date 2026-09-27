import { describe, expect, it } from 'vitest';
import { aggregateEvidence } from './evidence';
import type { Evidence } from './providers/types';

const evidence = (provider: string, verdict: Evidence['verdict'], confidence = 1): Evidence => ({
  provider,
  verdict,
  confidence,
  observedAt: null,
  fetchedAt: new Date(0).toISOString(),
  reasonCodes: [verdict.toUpperCase()],
  submissionOccurred: false,
});

describe('aggregateEvidence', () => {
  it('does not turn missing data into a safe verdict', () => {
    expect(aggregateEvidence([evidence('a', 'unknown')]).verdict).toBe('insufficient-data');
  });
  it('marks strong malicious evidence as high risk', () => {
    expect(aggregateEvidence([evidence('a', 'malicious', 0.95)])).toMatchObject({
      verdict: 'high-risk',
      confidence: 'high',
    });
  });
});