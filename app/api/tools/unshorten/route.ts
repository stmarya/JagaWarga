import { NextResponse } from 'next/server';
import { apiError, errorStatus, jsonBody, requestId } from '@/lib/api/request';
import { featureFlags } from '@/lib/runtime/features';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';
import { BoundedQueue } from '@/lib/runtime/queue';
import { traceRedirects, validateTraceUrl } from '@/lib/security/redirect-trace';
export const runtime = 'nodejs';
const queue = new BoundedQueue(2, 8);
export async function POST(request: Request) {
  const id = requestId(request);
  if (!featureFlags().activeRedirects) return apiError('ACTIVE_REDIRECTS_DISABLED', 403, id);
  if (!(await rateLimit(`redirect-trace:${clientKey(request)}`, 5)).allowed) return apiError('RATE_LIMITED', 429, id);
  try {
    const body = await jsonBody<{ url?: unknown; consent?: unknown }>(request, 4096);
    if (body.consent !== true || typeof body.url !== 'string') return apiError('CONSENT_AND_URL_REQUIRED', 400, id);
    let safe: string; try { safe = validateTraceUrl(body.url.trim()).href; } catch { return apiError('URL_NOT_ALLOWED', 400, id); }
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(12_000)]);
    const result = await queue.run(() => traceRedirects(safe, signal));
    return NextResponse.json({ ...result, requestId: id }, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
  } catch (e) {
    const code = e instanceof Error ? e.message : '';
    if (['CONTENT_TYPE_REQUIRED', 'PAYLOAD_TOO_LARGE', 'INVALID_JSON'].includes(code)) return apiError(code, errorStatus(code), id);
    return apiError(code === 'QUEUE_FULL' ? 'QUEUE_FULL' : 'TRACE_INCOMPLETE_OR_BLOCKED', code === 'QUEUE_FULL' ? 503 : 502, id);
  }
}
