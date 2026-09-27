import { timingSafeEqual } from 'node:crypto';

export function adminAuthorized(request: Request, env: NodeJS.ProcessEnv = process.env) {
  const expected = env.ADMIN_METRICS_TOKEN;
  if (!expected) return env.NODE_ENV !== 'production';
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}