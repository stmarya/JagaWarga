import { describe, expect, it } from 'vitest';
import { evaluateSlo } from './slo';

describe('SLO evaluation', () => {
  it('reports healthy lookup objectives', () => {
    expect(evaluateSlo({
      'lookup.cached': { count: 100, errors: 0, averageMs: 20, p95UpperBoundMs: 100 },
      'lookup.uncached': { count: 100, errors: 0, averageMs: 400, p95UpperBoundMs: 1_500 },
    })).toMatchObject({ status: 'healthy', alerts: [] });
  });

  it('raises an alert for staged latency and error failure', () => {
    const result = evaluateSlo({
      'lookup.cached': { count: 100, errors: 2, averageMs: 2_000, p95UpperBoundMs: 5_000 },
      'lookup.uncached': { count: 100, errors: 0, averageMs: 400, p95UpperBoundMs: 1_500 },
    });
    expect(result.status).toBe('breached');
    expect(result.alerts[0]).toMatchObject({ severity: 'high', code: 'SLO_LOOKUP_CACHED_BREACH' });
  });

  it('does not claim health before enough samples exist', () => {
    expect(evaluateSlo({})).toMatchObject({ status: 'warming', alerts: [] });
  });
});