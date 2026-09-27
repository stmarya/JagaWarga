import { NextResponse } from 'next/server';
import { featureFlags, reputationPolicy } from '@/lib/runtime/features';

export function GET() {
  return NextResponse.json({
    features: featureFlags(),
    principles: {
      existingLookupOnly: true,
      noRawContentPersistence: true,
      noAutomaticNavigation: true,
    },
    releaseScope: {
      locale: 'id-ID',
      browserExtension: 'experimental-not-in-launch-scope',
      communityReporting: 'deferred',
      organizationWorkspaces: 'deferred',
      externalNotifications: 'deferred',
    },
    reputationPolicy,
  }, { headers: { 'Cache-Control': 'no-store' } });
}