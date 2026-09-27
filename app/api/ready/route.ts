import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';
import { enabledProviderNames, providerDiagnostics } from '@/lib/runtime/features';

export function GET() {
  const config = runtimeConfig();
  const providers = enabledProviderNames();
  const diagnostics = providerDiagnostics();
  const ready = providers.length > 0;
  return NextResponse.json({
    status: ready ? 'ready' : 'not-ready',
    version: config.appVersion,
    providers,
    providerDiagnostics: diagnostics,
    warnings: diagnostics.filter((provider) => provider.status === 'misconfigured'),
    checks: { config: diagnostics.some((provider) => provider.status === 'misconfigured') ? 'warning' : 'ok', providers: ready ? 'ok' : 'failed', persistence: 'not-required' },
  }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}