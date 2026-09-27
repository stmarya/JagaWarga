import { NextResponse } from 'next/server';
import { analyzeEmailHeader } from '@/lib/analyzers/email-header';
import { apiError, errorStatus, jsonBody, requestId } from '@/lib/api/request';
import { withMetric } from '@/lib/runtime/metrics';
import { clientKey, rateLimit } from '@/lib/runtime/rate-limit';

export async function POST(request: Request) {
  const id = requestId(request);
  if (!(await rateLimit(`header:${clientKey(request)}`, 20)).allowed) return apiError('RATE_LIMITED', 429, id);
  try {
    const body = await jsonBody<{ headers?: unknown }>(request, 60_000);
    if (typeof body.headers !== 'string' || !body.headers.trim() || body.headers.length > 50_000) return apiError('INVALID_INPUT', 400, id);
    const result = await withMetric('email_header_analysis', async () => analyzeEmailHeader(body.headers as string));
    return NextResponse.json({ ...result, requestId: id }, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'ANALYSIS_FAILED';
    return apiError(code, code === 'ANALYSIS_FAILED' ? 500 : errorStatus(code), id);
  }
}
