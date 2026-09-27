import { createHash } from 'node:crypto';

type Counter = { count: number; resetsAt: number };
const counters = new Map<string, Counter>();

export function clientKey(request: Request) {
  const raw = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = counters.get(key);
  if (!current || current.resetsAt <= now) {
    counters.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetsAt: now + windowMs };
  }
  if (current.count >= limit) return { allowed: false, remaining: 0, resetsAt: current.resetsAt };
  current.count += 1;
  return { allowed: true, remaining: limit - current.count, resetsAt: current.resetsAt };
}