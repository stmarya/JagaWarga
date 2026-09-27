import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performLookup } from '../lib/lookup';
import type { Evidence, ProviderAdapter } from '../lib/providers/types';
import { CAPACITY_LIMITS } from '../lib/runtime/capacity';
import { CircuitBreaker } from '../lib/runtime/circuit';
import { metricsSnapshot } from '../lib/runtime/metrics';
import { BoundedQueue } from '../lib/runtime/queue';
import { rateLimit } from '../lib/runtime/rate-limit';
import { evaluateSlo } from '../lib/runtime/slo';

process.env.RUNTIME_TOPOLOGY = 'single';
process.env.LOG_LEVEL = 'silent';

const sleep = (milliseconds: number) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
const percentile = (values: number[], fraction: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))] * 100) / 100;
};

class ApprovedMockAdapter implements ProviderAdapter {
  readonly name = `approved-performance-mock-${crypto.randomUUID()}`;
  calls = 0;
  supports() { return true; }
  async lookup(): Promise<Evidence> {
    this.calls += 1;
    await sleep(2);
    const now = new Date().toISOString();
    return {
      provider: this.name,
      verdict: 'benign',
      confidence: 0.55,
      observedAt: now,
      fetchedAt: now,
      reasonCodes: ['APPROVED_MOCK_BENIGN'],
      submissionOccurred: false,
    };
  }
}

async function timed(work: () => Promise<unknown>) {
  const started = performance.now();
  await work();
  return performance.now() - started;
}

async function main() {
  const adapter = new ApprovedMockAdapter();
  const uncachedDurations: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    uncachedDurations.push(await timed(() => performLookup(`proof-${crypto.randomUUID()}.example`, [adapter])));
  }

  const cachedIndicator = `cached-${crypto.randomUUID()}.example`;
  await performLookup(cachedIndicator, [adapter]);
  const cachedCallsBefore = adapter.calls;
  const cachedDurations: number[] = [];
  for (let index = 0; index < 100; index += 1) {
    cachedDurations.push(await timed(() => performLookup(cachedIndicator, [adapter])));
  }

  const queue = new BoundedQueue(2, 3);
  let release!: () => void;
  const blocker = new Promise<void>((resolveWait) => { release = resolveWait; });
  const active = [queue.run(() => blocker), queue.run(() => blocker)];
  await sleep(0);
  const pending = [queue.run(async () => undefined), queue.run(async () => undefined), queue.run(async () => undefined)];
  let queueFullRejected = false;
  try {
    await queue.run(async () => undefined);
  } catch (error) {
    queueFullRejected = error instanceof Error && error.message === 'QUEUE_FULL';
  }
  release();
  await Promise.all([...active, ...pending]);

  const rateKey = `proof-${crypto.randomUUID()}`;
  const rateDecisions = [];
  for (let index = 0; index < 6; index += 1) rateDecisions.push(await rateLimit(rateKey, 5));

  const circuit = new CircuitBreaker(2, 5);
  circuit.failure();
  circuit.failure();
  const circuitOpened = !circuit.canRun();
  await sleep(6);
  const circuitRecovered = circuit.canRun();

  let timeoutAttempts = 0;
  const timeoutAdapter: ProviderAdapter = {
    name: `timeout-${crypto.randomUUID()}`,
    supports: () => true,
    lookup: async () => {
      timeoutAttempts += 1;
      throw new Error('PROVIDER_TIMEOUT');
    },
  };
  const timeoutResult = await performLookup(`timeout-${crypto.randomUUID()}.example`, [timeoutAdapter]);
  const slo = evaluateSlo(await metricsSnapshot(), 20);

  const report = {
    decision: 'PASSED',
    generatedAt: new Date().toISOString(),
    mode: 'approved-provider-mocks',
    capacityLimits: CAPACITY_LIMITS,
    lookup: {
      uncached: { samples: uncachedDurations.length, p95Ms: percentile(uncachedDurations, 0.95), targetP95Ms: 5_000 },
      cached: { samples: cachedDurations.length, p95Ms: percentile(cachedDurations, 0.95), targetP95Ms: 1_500, providerCalls: adapter.calls - cachedCallsBefore },
    },
    controls: {
      queueFullRejected,
      rateLimitBlockedSixthRequest: !rateDecisions.at(-1)?.allowed,
      circuitOpened,
      circuitRecovered,
      providerTimeoutAttempts: timeoutAttempts,
      providerTimeoutDegradedSafely: timeoutResult.partial && timeoutResult.verdict === 'insufficient-data',
    },
    slo,
  };

  const failures = [
    report.lookup.uncached.p95Ms >= report.lookup.uncached.targetP95Ms && 'uncached lookup SLO',
    report.lookup.cached.p95Ms >= report.lookup.cached.targetP95Ms && 'cached lookup SLO',
    report.lookup.cached.providerCalls !== 0 && 'cache provider isolation',
    ...Object.entries(report.controls).filter(([, value]) => value === false).map(([name]) => name),
  ].filter(Boolean);
  if (failures.length) {
    report.decision = 'FAILED';
    throw new Error(`Performance proof failed: ${failures.join(', ')}`);
  }

  await mkdir(resolve('artifacts'), { recursive: true });
  await writeFile(resolve('artifacts/performance-proof-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});