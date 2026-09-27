import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';

export function GET() {
  const config = runtimeConfig();
  return NextResponse.json({
    version: config.appVersion,
    imageDigest: config.imageDigest,
    environment: config.nodeEnv,
    policy: { existingLookupOnly: true, fileUpload: false, urlSubmission: false },
  }, { headers: { 'Cache-Control': 'no-store' } });
}