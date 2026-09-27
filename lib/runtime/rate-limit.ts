import { createHash } from 'node:crypto';
import { runtimeRedis } from './redis';

type Counter = { count: number; resetsAt: number };
const counters = new Map<string, Counter>();

export function clientKey(request: Request) {
  const raw = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export async function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const redis = await runtimeRedis();
  if (redis) {
    const redisKey = `jagawarga:rate-limit:${key}`;
    const result = await redis.eval(`
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
      local ttl = redis.call('PTTL', KEYS[1])
      return {current, ttl}
    `, { keys: [redisKey], arguments: [String(windowMs)] }) as [number, number];
    const [count, rawTtl] = result.map(Number);
    const ttl = Math.max(0, rawTtl);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetsAt: now + ttl,
    };
  }
  const current = counters.get(key);
  if (!current || current.resetsAt <= now) {
    counters.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetsAt: now + windowMs };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetsAt: current.resetsAt };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetsAt: current.resetsAt };
}