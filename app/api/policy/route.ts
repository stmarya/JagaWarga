import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/runtime/features';

export function GET() {
  return NextResponse.json({
    features: featureFlags(),
    principles: {
      existingLookupOnly: true,
      noRawContentPersistence: true,
      noAutomaticNavigation: true,
    },
  }, { headers: { 'Cache-Control': 'no-store' } });
}