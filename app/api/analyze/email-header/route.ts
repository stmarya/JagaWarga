import { NextResponse } from 'next/server';
import { analyzeEmailHeader } from '@/lib/analyzers/email-header';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export async function POST(request: Request) {
  const limit = rateLimit(`header:${clientKey(request)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  const body = (await request.json()) as { headers?: unknown };
  if (typeof body.headers !== 'string' || !body.headers.trim() || body.headers.length > 50_000) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
  return NextResponse.json(analyzeEmailHeader(body.headers), { headers: { 'Cache-Control': 'no-store' } });
}