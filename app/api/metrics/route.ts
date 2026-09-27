import { NextResponse } from 'next/server';
import { metricsSnapshot } from '@/lib/runtime/metrics';
import { adminAuthorized } from '@/lib/runtime/admin-auth';
import { apiError, requestId } from '@/lib/api/request';

export function GET(request: Request) {
  const id = requestId(request);
  if (!adminAuthorized(request)) return apiError('UNAUTHORIZED', 401, id);
  return NextResponse.json({
    at: new Date().toISOString(),
    metrics: metricsSnapshot(),
    privacy: 'No raw indicators or message content are included.',
  }, { headers: { 'Cache-Control': 'no-store', 'X-Request-ID': id } });
}