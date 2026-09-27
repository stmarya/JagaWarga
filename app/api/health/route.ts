import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';
import { enabledProviderNames, providerDiagnostics, reputationPolicy } from '@/lib/runtime/features';
import { runtimeTopology } from '@/lib/runtime/redis';

export function GET() {
  const config = runtimeConfig();
  return NextResponse.json({
    status: 'ok',
    version: config.appVersion,
    imageDigest: config.imageDigest,
    environment: config.nodeEnv,
    policy: { existingLookupOnly: true, fileUpload: false, urlSubmission: false },
    providers: enabledProviderNames(),
    providerDiagnostics: providerDiagnostics(),
    reputationPolicy,
    runtimeTopology: runtimeTopology(),
    uptimeSeconds: Math.round(process.uptime()),
  });
}