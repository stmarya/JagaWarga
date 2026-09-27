import { NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/analyzers/message';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export async function POST(request: Request) {
  const limit = rateLimit(`message:${clientKey(request)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const body = (await request.json()) as { text?: unknown };
  if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 10_000) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
  return NextResponse.json(analyzeMessage(body.text), { headers: { 'Cache-Control': 'no-store' } });
}