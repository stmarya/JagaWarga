import { runtimeRedis } from './redis';

const LATENCY_BUCKETS_MS = [100, 500, 1_500, 5_000, 10_000] as const;
type Metric = { count: number; errors: number; totalMs: number; buckets: Record<string, number> };
type Gauge = { value: number; updatedAt: string };
const metrics = new Map<string, Metric>();
const gauges = new Map<string, Gauge>();
const METRICS_RETENTION_SECONDS = 30 * 24 * 60 * 60;

export async function recordMetric(name: string, durationMs: number, error = false) {
  const safeDuration = Math.round(Math.max(0, durationMs));
  const bucket = LATENCY_BUCKETS_MS.find((boundary) => safeDuration <= boundary) ?? Infinity;
  const bucketField = bucket === Infinity ? 'bucket_overflow' : `bucket_${bucket}`;
  const redis = await runtimeRedis();
  if (redis) {
    const key = `jagawarga:metric:${name}`;
    await redis.multi()
      .sAdd('jagawarga:metric:names', name)
      .hSet(key, 'kind', 'counter')
      .hIncrBy(key, 'count', 1)
      .hIncrBy(key, 'errors', error ? 1 : 0)
      .hIncrBy(key, 'totalMs', safeDuration)
      .hIncrBy(key, bucketField, 1)
      .expire(key, METRICS_RETENTION_SECONDS)
      .expire('jagawarga:metric:names', METRICS_RETENTION_SECONDS)
      .exec();
    return;
  }
  const metric = metrics.get(name) ?? { count: 0, errors: 0, totalMs: 0, buckets: {} };
  metric.count += 1;
  metric.totalMs += safeDuration;
  if (error) metric.errors += 1;
  metric.buckets[bucketField] = (metric.buckets[bucketField] ?? 0) + 1;
  metrics.set(name, metric);
}

export async function recordGauge(name: string, value: number) {
  const gauge = { value, updatedAt: new Date().toISOString() };
  const redis = await runtimeRedis();
  if (redis) {
    const key = `jagawarga:metric:${name}`;
    await redis.multi()
      .sAdd('jagawarga:metric:names', name)
      .hSet(key, { kind: 'gauge', value: String(value), updatedAt: gauge.updatedAt })
      .expire(key, METRICS_RETENTION_SECONDS)
      .expire('jagawarga:metric:names', METRICS_RETENTION_SECONDS)
      .exec();
    return;
  }
  gauges.set(name, gauge);
}

export async function metricsSnapshot() {
  function summarize(metric: Metric) {
    const target = Math.max(1, Math.ceil(metric.count * 0.95));
    let cumulative = 0;
    let p95UpperBoundMs: number | null = null;
    for (const boundary of LATENCY_BUCKETS_MS) {
      cumulative += metric.buckets[`bucket_${boundary}`] ?? 0;
      if (cumulative >= target) {
        p95UpperBoundMs = boundary;
        break;
      }
    }
    if (p95UpperBoundMs === null && (metric.buckets.bucket_overflow ?? 0) > 0) p95UpperBoundMs = 10_001;
    return {
      count: metric.count,
      errors: metric.errors,
      totalMs: metric.totalMs,
      averageMs: metric.count ? Math.round(metric.totalMs / metric.count) : 0,
      p95UpperBoundMs,
    };
  }
  const redis = await runtimeRedis();
  if (redis) {
    const names = await redis.sMembers('jagawarga:metric:names');
    const entries = await Promise.all(names.map(async (name) => {
      const raw = await redis.hGetAll(`jagawarga:metric:${name}`);
      if (raw.kind === 'gauge') {
        return [name, { value: Number(raw.value ?? 0), updatedAt: raw.updatedAt }] as const;
      }
      const metric = {
        count: Number(raw.count ?? 0),
        errors: Number(raw.errors ?? 0),
        totalMs: Number(raw.totalMs ?? 0),
        buckets: Object.fromEntries(Object.entries(raw)
          .filter(([field]) => field.startsWith('bucket_'))
          .map(([field, value]) => [field, Number(value)])),
      };
      return [name, summarize(metric)] as const;
    }));
    return Object.fromEntries(entries);
  }
  return Object.fromEntries([
    ...[...metrics.entries()].map(([name, metric]) => [name, summarize(metric)] as const),
    ...gauges.entries(),
  ]);
}

export async function withMetric<T>(name: string, work: () => Promise<T>) {
  const started = performance.now();
  try {
    const result = await work();
    await recordMetric(name, performance.now() - started);
    return result;
  } catch (error) {
    await recordMetric(name, performance.now() - started, true);
    throw error;
  }
}