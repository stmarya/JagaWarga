export type CounterMetric = {
  count: number;
  errors: number;
  averageMs: number;
  p95UpperBoundMs: number | null;
};

type Snapshot = Record<string, unknown>;

const TARGETS = [
  { metric: 'lookup.cached', label: 'Cached lookup P95', maxP95Ms: 1_500, maxErrorRate: 0.005 },
  { metric: 'lookup.uncached', label: 'Uncached lookup P95', maxP95Ms: 5_000, maxErrorRate: 0.005 },
] as const;

function counter(value: unknown): CounterMetric | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<CounterMetric>;
  if (typeof candidate.count !== 'number' || typeof candidate.errors !== 'number') return null;
  return {
    count: candidate.count,
    errors: candidate.errors,
    averageMs: typeof candidate.averageMs === 'number' ? candidate.averageMs : 0,
    p95UpperBoundMs: typeof candidate.p95UpperBoundMs === 'number' ? candidate.p95UpperBoundMs : null,
  };
}

export function evaluateSlo(snapshot: Snapshot, minimumSamples = 20) {
  const objectives = TARGETS.map((target) => {
    const metric = counter(snapshot[target.metric]);
    if (!metric || metric.count < minimumSamples || metric.p95UpperBoundMs === null) {
      return { ...target, status: 'insufficient-data' as const, samples: metric?.count ?? 0 };
    }
    const errorRate = metric.count ? metric.errors / metric.count : 0;
    const breaches = [
      ...(metric.p95UpperBoundMs > target.maxP95Ms ? [`p95>${target.maxP95Ms}ms`] : []),
      ...(errorRate > target.maxErrorRate ? [`error-rate>${target.maxErrorRate * 100}%`] : []),
    ];
    return {
      ...target,
      status: breaches.length ? 'breached' as const : 'healthy' as const,
      samples: metric.count,
      p95UpperBoundMs: metric.p95UpperBoundMs,
      errorRate,
      breaches,
    };
  });
  const alerts = objectives
    .filter((objective) => objective.status === 'breached')
    .map((objective) => ({
      severity: 'high' as const,
      code: `SLO_${objective.metric.replaceAll('.', '_').toUpperCase()}_BREACH`,
      message: `${objective.label} breached: ${'breaches' in objective ? objective.breaches.join(', ') : ''}`,
    }));
  const evaluated = objectives.filter((objective) => objective.status !== 'insufficient-data');
  const status = alerts.length ? 'breached' : evaluated.length === objectives.length ? 'healthy' : 'warming';
  return { status, evaluatedAt: new Date().toISOString(), minimumSamples, objectives, alerts };
}