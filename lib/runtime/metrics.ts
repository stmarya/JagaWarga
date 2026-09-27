type Metric = { count: number; errors: number; totalMs: number };
const metrics = new Map<string, Metric>();

export function recordMetric(name: string, durationMs: number, error = false) {
  const metric = metrics.get(name) ?? { count: 0, errors: 0, totalMs: 0 };
  metric.count += 1;
  metric.totalMs += Math.max(0, durationMs);
  if (error) metric.errors += 1;
  metrics.set(name, metric);
}

export function metricsSnapshot() {
  return Object.fromEntries([...metrics.entries()].map(([name, metric]) => [name, {
    ...metric,
    averageMs: metric.count ? Math.round(metric.totalMs / metric.count) : 0,
  }]));
}

export async function withMetric<T>(name: string, work: () => Promise<T>) {
  const started = performance.now();
  try {
    const result = await work();
    recordMetric(name, performance.now() - started);
    return result;
  } catch (error) {
    recordMetric(name, performance.now() - started, true);
    throw error;
  }
}