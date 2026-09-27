import { NextResponse } from 'next/server';
import { safeLog } from '@/lib/observability';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export async function POST(request: Request) {
  const limit = rateLimit(`feedback:${clientKey(request)}`, 10, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const body = (await request.json()) as { helpful?: unknown; category?: unknown };
  if (typeof body.helpful !== 'boolean') return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  const category = typeof body.category === 'string' ? body.category.slice(0, 40) : 'general';
  safeLog('feedback_received', { helpful: body.helpful, category });
  return NextResponse.json({ accepted: true });
}