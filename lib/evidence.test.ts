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
  it('retains a suspicious provider verdict at confidence 0.6', () => {
    expect(aggregateEvidence([evidence('virustotal', 'suspicious', 0.6)])).toMatchObject({
      risk: 60, verdict: 'suspicious', confidence: 'medium', scoringVersion: 'severity-independent-v1',
    });
  });
  it('does not lower malicious severity when confidence is weaker', () => {
    expect(aggregateEvidence([evidence('a', 'malicious', 0.2)])).toMatchObject({ risk: 95, verdict: 'high-risk', confidence: 'low' });
  });
  it('exposes conflicts instead of averaging away the warning', () => {
    expect(aggregateEvidence([evidence('a', 'benign'), evidence('b', 'suspicious', 0.6)]))
      .toMatchObject({ verdict: 'suspicious', conflictingEvidence: true });
  });
  it('does not count DNS as assessed reputation or corroboration', () => {
    expect(aggregateEvidence([evidence('dns', 'unknown', 0.4), evidence('vt', 'benign', 0.55)]))
      .toMatchObject({ confidence: 'medium', coverage: { requested: 2, assessed: 1, failed: 0 } });
  });
  it('counts failed sources and excludes invalid confidence values', () => {
    const failed = { ...evidence('failed', 'unknown', 0), reasonCodes: ['PROVIDER_ERROR'] };
    expect(aggregateEvidence([failed, evidence('bad', 'malicious', NaN), evidence('zero', 'malicious', 0)]))
      .toMatchObject({ verdict: 'insufficient-data', coverage: { requested: 3, assessed: 0, failed: 1 } });
  });
  it('never upgrades confidence just by repeating the same provider', () => {
    expect(aggregateEvidence([evidence('same', 'suspicious', 0.6), evidence('same', 'suspicious', 0.6)]))
      .toMatchObject({ confidence: 'medium', coverage: { assessed: 1, requested: 1 } });
  });
});