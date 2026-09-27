import { NextResponse } from 'next/server';
import { metricsSnapshot } from '@/lib/runtime/metrics';

export function GET() {
  return NextResponse.json({
    at: new Date().toISOString(),
    metrics: metricsSnapshot(),
    privacy: 'No raw indicators or message content are included.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}