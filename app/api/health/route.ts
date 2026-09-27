import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';
import { enabledProviderNames } from '@/lib/runtime/features';

export function GET() {
  const config = runtimeConfig();
  return NextResponse.json({
    status: 'ok',
    version: config.appVersion,
    environment: config.nodeEnv,
    policy: { existingLookupOnly: true, fileUpload: false, urlSubmission: false },
    providers: enabledProviderNames(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}