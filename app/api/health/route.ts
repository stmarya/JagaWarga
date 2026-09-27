import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '0.1.0',
    policy: { existingLookupOnly: true, fileUpload: false, urlSubmission: false },
    providers: ['cloudflare-dns', 'google-dns'],
    uptimeSeconds: Math.round(process.uptime()),
  });
}