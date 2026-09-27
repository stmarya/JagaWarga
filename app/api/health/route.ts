import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';
import { enabledProviderNames, providerDiagnostics } from '@/lib/runtime/features';

export function GET() {
  const config = runtimeConfig();
  return NextResponse.json({
    status: 'ok',
    version: config.appVersion,
    environment: config.nodeEnv,
    policy: { existingLookupOnly: true, fileUpload: false, urlSubmission: false },
    providers: enabledProviderNames(),
    providerDiagnostics: providerDiagnostics(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}