import { runtimeRedis } from './redis';
import { CAPACITY_LIMITS } from './capacity';

type Usage = { count: number; day: string };
const usage = new Map<string, Usage>();

export async function consumeBudget(provider: string, dailyLimit: number = CAPACITY_LIMITS.providerRequestsPerDay) {
  const day = new Date().toISOString().slice(0, 10);
  const redis = await runtimeRedis();
  if (redis) {
    const key = `jagawarga:budget:${day}:${provider}`;
    const count = Number(await redis.eval(`
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
      return current
    `, { keys: [key], arguments: [String(48 * 60 * 60)] }));
    return count <= dailyLimit;
  }
  const current = usage.get(provider);
  if (!current || current.day !== day) {
    usage.set(provider, { count: 1, day });
    return true;
  }
  if (current.count >= dailyLimit) return false;
  current.count += 1;
  return true;
}