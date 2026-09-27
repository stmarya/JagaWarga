import { describe, expect, it } from 'vitest';
import { TtlCache } from './cache';
import { CircuitBreaker } from './circuit';
import { BoundedQueue } from './queue';

describe('runtime controls', () => {
  it('caches a value', () => {
    const cache = new TtlCache<string>(1_000);
    cache.set('a', 'value');
    expect(cache.get('a')).toBe('value');
  });

  it('opens a circuit after repeated failures', () => {
    const circuit = new CircuitBreaker(2, 60_000);
    circuit.failure();
    expect(circuit.canRun()).toBe(true);
    circuit.failure();
    expect(circuit.canRun()).toBe(false);
  });

  it('bounds pending work', async () => {
    const queue = new BoundedQueue(1, 0);
    let release!: () => void;
    const first = queue.run(() => new Promise<void>((resolve) => { release = resolve; }));
    await expect(queue.run(async () => undefined)).rejects.toThrow('QUEUE_FULL');
    release();
    await first;
  });
});