import { createHash } from 'node:crypto';
import { runtimeRedis } from './redis';

type Entry<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  constructor(private readonly ttlMs = 5 * 60_000, private readonly maxEntries = 1_000) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value as string | undefined;
      if (oldest) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

export class RuntimeCache<T> {
  private readonly memory: TtlCache<T>;

  constructor(private readonly namespace: string, private readonly ttlMs = 5 * 60_000, maxEntries = 1_000) {
    this.memory = new TtlCache<T>(ttlMs, maxEntries);
  }

  private key(value: string) {
    const digest = createHash('sha256').update(value).digest('hex');
    return `jagawarga:cache:${this.namespace}:${digest}`;
  }

  async get(key: string): Promise<T | undefined> {
    const redis = await runtimeRedis();
    if (!redis) return this.memory.get(key);
    const value = await redis.get(this.key(key));
    if (value === null) return undefined;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: T) {
    const redis = await runtimeRedis();
    if (!redis) {
      this.memory.set(key, value);
      return;
    }
    await redis.set(this.key(key), JSON.stringify(value), { PX: this.ttlMs });
  }
}