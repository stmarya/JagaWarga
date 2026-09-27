import { runtimeRedis } from './redis';

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  constructor(private readonly threshold = 3, private readonly resetMs = 30_000) {}

  canRun() {
    if (!this.openedAt) return true;
    if (Date.now() - this.openedAt >= this.resetMs) {
      this.failures = 0;
      this.openedAt = 0;
      return true;
    }
    return false;
  }
  success() { this.failures = 0; this.openedAt = 0; }
  failure() {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openedAt = Date.now();
  }
}

export class RuntimeCircuitBreaker {
  private readonly memory: CircuitBreaker;

  constructor(private readonly name: string, private readonly threshold = 3, private readonly resetMs = 30_000) {
    this.memory = new CircuitBreaker(threshold, resetMs);
  }

  private keys() {
    return {
      failures: `jagawarga:circuit:${this.name}:failures`,
      open: `jagawarga:circuit:${this.name}:open`,
    };
  }

  async canRun() {
    const redis = await runtimeRedis();
    if (!redis) return this.memory.canRun();
    return (await redis.exists(this.keys().open)) === 0;
  }

  async success() {
    const redis = await runtimeRedis();
    if (!redis) {
      this.memory.success();
      return;
    }
    const keys = this.keys();
    await redis.del([keys.failures, keys.open]);
  }

  async failure() {
    const redis = await runtimeRedis();
    if (!redis) {
      this.memory.failure();
      return;
    }
    const keys = this.keys();
    await redis.eval(`
      local failures = redis.call('INCR', KEYS[1])
      if failures == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
      if failures >= tonumber(ARGV[1]) then
        redis.call('SET', KEYS[2], '1', 'PX', ARGV[2])
        redis.call('DEL', KEYS[1])
      end
      return failures
    `, {
      keys: [keys.failures, keys.open],
      arguments: [String(this.threshold), String(this.resetMs)],
    });
  }
}