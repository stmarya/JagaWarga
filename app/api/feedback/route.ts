import { NextResponse } from 'next/server';
import { apiError, errorStatus, jsonBody, requestId } from '@/lib/api/request';
import { safeLog } from '@/lib/observability';
import { recordMetric } from '@/lib/runtime/metrics';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export async function POST(request: Request) {
  const id = requestId(request);
  if (!(await rateLimit(`feedback:${clientKey(request)}`, 10, 60 * 60_000)).allowed) return apiError('RATE_LIMITED', 429, id);
  try {
    const body = await jsonBody<{ helpful?: unknown; category?: unknown }>(request, 1_024);
    if (typeof body.helpful !== 'boolean') return apiError('INVALID_INPUT', 400, id);
    const category = typeof body.category === 'string' ? body.category.slice(0, 40) : 'general';
    safeLog('feedback_received', { helpful: body.helpful, category });
    await recordMetric('feedback', 0);
    return NextResponse.json({ accepted: true, requestId: id }, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'FEEDBACK_FAILED';
    return apiError(code, code === 'FEEDBACK_FAILED' ? 500 : errorStatus(code), id);
  }
}
