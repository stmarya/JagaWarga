import { NextResponse } from 'next/server';
import { performLookup } from '@/lib/lookup';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`lookup:${clientKey(request)}`, 30);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'RATE_LIMITED', resetsAt: limit.resetsAt }, { status: 429 });
    }
    const body = (await request.json()) as { indicator?: unknown };
    if (typeof body.indicator !== 'string' || body.indicator.length > 2_048) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
    }
    return NextResponse.json(await performLookup(body.indicator), {
      headers: {
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'LOOKUP_FAILED';
    const status = [
      'INDICATOR_UNSUPPORTED', 'DOMAIN_INVALID', 'URL_PROTOCOL_UNSUPPORTED',
      'URL_CREDENTIALS_NOT_ALLOWED', 'IP_NON_PUBLIC',
    ].includes(code) ? 400 : 500;
    return NextResponse.json({ error: code }, { status });
  }
}