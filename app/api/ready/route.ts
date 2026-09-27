import { NextResponse } from 'next/server';
import { runtimeConfig } from '@/lib/runtime/env';
import { enabledProviderNames } from '@/lib/runtime/features';

export function GET() {
  const config = runtimeConfig();
  const providers = enabledProviderNames();
  const ready = providers.length > 0;
  return NextResponse.json({
    status: ready ? 'ready' : 'not-ready',
    version: config.appVersion,
    providers,
    checks: { config: 'ok', providers: ready ? 'ok' : 'failed', persistence: 'not-required' },
  }, { status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}