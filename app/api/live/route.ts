import { NextResponse } from 'next/server';
export function GET() {
  return NextResponse.json({ status: 'alive', uptimeSeconds: Math.round(process.uptime()) }, { headers: { 'Cache-Control': 'no-store' } });
}