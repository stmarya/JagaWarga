import { describe, expect, it } from 'vitest';
import { metricsSnapshot, recordMetric } from './metrics';

describe('metrics', () => {
  it('aggregates counts without raw user data', () => {
    const name = `test_${crypto.randomUUID()}`;
    recordMetric(name, 10);
    recordMetric(name, 20, true);
    expect(metricsSnapshot()[name]).toMatchObject({ count: 2, errors: 1, averageMs: 15 });
  });
});