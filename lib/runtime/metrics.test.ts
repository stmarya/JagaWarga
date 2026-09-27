import { describe, expect, it } from 'vitest';
import { metricsSnapshot, recordGauge, recordMetric } from './metrics';

describe('metrics', () => {
  it('aggregates counts without raw user data', async () => {
    const name = `test_${crypto.randomUUID()}`;
    await recordMetric(name, 10);
    await recordMetric(name, 20, true);
    expect((await metricsSnapshot())[name]).toMatchObject({ count: 2, errors: 1, averageMs: 15 });
  });

  it('records the latest operational gauge', async () => {
    const name = `gauge_${crypto.randomUUID()}`;
    await recordGauge(name, 7);
    expect((await metricsSnapshot())[name]).toMatchObject({ value: 7 });
  });
});