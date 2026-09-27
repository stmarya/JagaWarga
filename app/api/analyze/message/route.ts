import { NextResponse } from 'next/server';
import { analyzeMessage } from '@/lib/analyzers/message';
import { apiError, errorStatus, jsonBody, requestId } from '@/lib/api/request';
import { withMetric } from '@/lib/runtime/metrics';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export async function POST(request: Request) {
  const id = requestId(request);
  if (!(await rateLimit(`message:${clientKey(request)}`, 20)).allowed) return apiError('RATE_LIMITED', 429, id);
  try {
    const body = await jsonBody<{ text?: unknown }>(request, 12_000);
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 10_000) return apiError('INVALID_INPUT', 400, id);
    const result = await withMetric('message_analysis', async () => analyzeMessage(body.text as string));
    return NextResponse.json({ ...result, requestId: id }, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ANALYSIS_FAILED';
    return apiError(code, code === 'ANALYSIS_FAILED' ? 500 : errorStatus(code), id);
  }
}
