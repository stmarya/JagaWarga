import { NextResponse } from 'next/server';
import { apiError, errorStatus, jsonBody, requestId } from '@/lib/api/request';
import { performLookup } from '@/lib/lookup';
import { withMetric } from '@/lib/runtime/metrics';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const id = requestId(request);
  try {
    const limit = rateLimit(`lookup:${clientKey(request)}`, 30);
    if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED', resetsAt: limit.resetsAt, requestId: id }, { status: 429, headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
    const body = await jsonBody<{ indicator?: unknown }>(request, 4_096);
    if (typeof body.indicator !== 'string' || body.indicator.length > 2_048) return apiError('INVALID_INPUT', 400, id);
    const result = await withMetric('lookup', () => performLookup(body.indicator as string));
    return NextResponse.json({ ...result, requestId: id }, { headers: { 'Cache-Control': 'no-store', 'X-RateLimit-Remaining': String(limit.remaining), 'X-Request-ID': id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'LOOKUP_FAILED';
    const knownInput = ['INDICATOR_UNSUPPORTED', 'DOMAIN_INVALID', 'URL_PROTOCOL_UNSUPPORTED', 'URL_CREDENTIALS_NOT_ALLOWED', 'IP_NON_PUBLIC'];
    return apiError(code, knownInput.includes(code) ? 400 : code === 'LOOKUP_FAILED' ? 500 : errorStatus(code), id);
  }
}
