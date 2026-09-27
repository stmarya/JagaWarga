import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';
import { enabledProviderNames, providerDiagnostics } from '@/lib/runtime/features';
import { runtimeStateHealth } from '@/lib/runtime/redis';

export async function GET() {
  const config = runtimeConfig();
  const providers = enabledProviderNames();
  const diagnostics = providerDiagnostics();
  const runtimeState = await runtimeStateHealth();
  const ready = providers.length > 0 && runtimeState.status === 'ok';
  return NextResponse.json({
    status: ready ? 'ready' : 'not-ready',
    version: config.appVersion,
    providers,
    providerDiagnostics: diagnostics,
    warnings: diagnostics.filter((provider) => provider.status === 'misconfigured'),
    checks: {
      config: diagnostics.some((provider) => provider.status === 'misconfigured') ? 'warning' : 'ok',
      providers: providers.length > 0 ? 'ok' : 'failed',
      runtimeState,
      persistence: 'not-required',
    },
  }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}