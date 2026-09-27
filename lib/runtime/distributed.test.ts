import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./redis', () => ({ runtimeRedis: vi.fn() }));

import { consumeBudget } from './budget';
import { RuntimeCache } from './cache';
import { RuntimeCircuitBreaker } from './circuit';
import { metricsSnapshot, recordGauge, recordMetric } from './metrics';
import { rateLimit } from './rate-limit';
import { runtimeRedis } from './redis';

class FakeRedis {
  strings = new Map<string, string>();
  hashes = new Map<string, Record<string, string>>();
  sets = new Map<string, Set<string>>();
  ttls = new Map<string, number>();

  async get(key: string) { return this.strings.get(key) ?? null; }
  async set(key: string, value: string, options?: { PX?: number }) {
    this.strings.set(key, value);
    if (options?.PX) this.ttls.set(key, options.PX);
    return 'OK';
  }
  async incr(key: string) {
    const value = Number(this.strings.get(key) ?? 0) + 1;
    this.strings.set(key, String(value));
    return value;
  }
  async expire(key: string, seconds: number) { this.ttls.set(key, seconds * 1_000); return 1; }
  async pExpire(key: string, milliseconds: number) { this.ttls.set(key, milliseconds); return 1; }
  async pTTL(key: string) { return this.ttls.get(key) ?? -1; }
  async exists(key: string) { return this.strings.has(key) ? 1 : 0; }
  async del(keys: string | string[]) {
    const values = Array.isArray(keys) ? keys : [keys];
    values.forEach((key) => {
      this.strings.delete(key);
      this.hashes.delete(key);
    });
    return values.length;
  }
  async sMembers(key: string) { return [...(this.sets.get(key) ?? new Set())]; }
  async hGetAll(key: string) { return this.hashes.get(key) ?? {}; }
  async eval(script: string, options: { keys: string[]; arguments: string[] }) {
    const [key, secondKey] = options.keys;
    if (script.includes('return {current, ttl}')) {
      const current = await this.incr(key);
      if (current === 1) await this.pExpire(key, Number(options.arguments[0]));
      return [current, await this.pTTL(key)];
    }
    if (script.includes("redis.call('EXPIRE'")) {
      const current = await this.incr(key);
      if (current === 1) await this.expire(key, Number(options.arguments[0]));
      return current;
    }
    if (script.includes('failures >= tonumber')) {
      const failures = await this.incr(key);
      const threshold = Number(options.arguments[0]);
      const resetMs = Number(options.arguments[1]);
      if (failures === 1) await this.pExpire(key, resetMs);
      if (failures >= threshold) {
        await this.set(secondKey, '1', { PX: resetMs });
        await this.del(key);
      }
      return failures;
    }
    throw new Error('UNSUPPORTED_SCRIPT');
  }

  multi() {
    const operations: Array<() => Promise<unknown> | unknown> = [];
    const chain = {
      set: (key: string, value: string, options?: { PX?: number }) => {
        operations.push(() => this.set(key, value, options));
        return chain;
      },
      del: (key: string | string[]) => {
        operations.push(() => this.del(key));
        return chain;
      },
      sAdd: (key: string, value: string) => {
        operations.push(() => {
          const values = this.sets.get(key) ?? new Set<string>();
          values.add(value);
          this.sets.set(key, values);
        });
        return chain;
      },
      hSet: (key: string, field: string | Record<string, string>, value?: string) => {
        operations.push(() => {
          const hash = this.hashes.get(key) ?? {};
          if (typeof field === 'string') hash[field] = value ?? '';
          else Object.assign(hash, field);
          this.hashes.set(key, hash);
        });
        return chain;
      },
      hIncrBy: (key: string, field: string, amount: number) => {
        operations.push(() => {
          const hash = this.hashes.get(key) ?? {};
          hash[field] = String(Number(hash[field] ?? 0) + amount);
          this.hashes.set(key, hash);
        });
        return chain;
      },
      expire: (key: string, seconds: number) => {
        operations.push(() => this.expire(key, seconds));
        return chain;
      },
      exec: async () => {
        for (const operation of operations) await operation();
        return [];
      },
    };
    return chain;
  }
}

let redis: FakeRedis;

beforeEach(() => {
  redis = new FakeRedis();
  vi.mocked(runtimeRedis).mockResolvedValue(redis as never);
});

describe('distributed runtime state', () => {
  it('shares cache values without exposing the source key', async () => {
    const cache = new RuntimeCache<{ verdict: string }>('test', 5_000);
    await cache.set('sensitive.example', { verdict: 'unknown' });
    await expect(cache.get('sensitive.example')).resolves.toEqual({ verdict: 'unknown' });
    expect([...redis.strings.keys()].join()).not.toContain('sensitive.example');
  });

  it('enforces distributed request and provider limits', async () => {
    expect((await rateLimit('client', 2)).allowed).toBe(true);
    expect((await rateLimit('client', 2)).allowed).toBe(true);
    expect((await rateLimit('client', 2)).allowed).toBe(false);
    expect(await consumeBudget('provider', 1)).toBe(true);
    expect(await consumeBudget('provider', 1)).toBe(false);
  });

  it('shares circuit state and resets it after success', async () => {
    const circuit = new RuntimeCircuitBreaker('provider', 2, 30_000);
    await circuit.failure();
    expect(await circuit.canRun()).toBe(true);
    await circuit.failure();
    expect(await circuit.canRun()).toBe(false);
    await circuit.success();
    expect(await circuit.canRun()).toBe(true);
  });

  it('aggregates counters and gauges', async () => {
    await recordMetric('provider.lookup', 10);
    await recordMetric('provider.lookup', 20, true);
    await recordGauge('queue.pending', 3);
    const snapshot = await metricsSnapshot();
    expect(snapshot['provider.lookup']).toMatchObject({ count: 2, errors: 1, averageMs: 15 });
    expect(snapshot['queue.pending']).toMatchObject({ value: 3 });
  });
});