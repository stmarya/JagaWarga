import { NextResponse } from 'next/server';
import { metricsSnapshot } from '@/lib/runtime/metrics';
import { evaluateSlo } from '@/lib/runtime/slo';

export async function GET() {
  const snapshot = await metricsSnapshot();
  return NextResponse.json(evaluateSlo(snapshot), { headers: { 'Cache-Control': 'no-store' } });
}