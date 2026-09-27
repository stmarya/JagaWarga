export type FeatureFlags = {
  communityReporting: boolean;
  fileUpload: boolean;
  urlSubmission: boolean;
  premiumProviders: boolean;
  externalNotifications: boolean;
  organizationWorkspaces: boolean;
};

function enabled(value: string | undefined) {
  return value?.toLowerCase() === 'true';
}

export function featureFlags(env: NodeJS.ProcessEnv = process.env): FeatureFlags {
  const riskyEnabled = enabled(env.ALLOW_RISKY_FEATURES);
  return {
    communityReporting: riskyEnabled && enabled(env.FEATURE_COMMUNITY_REPORTING),
    fileUpload: riskyEnabled && enabled(env.FEATURE_FILE_UPLOAD),
    urlSubmission: riskyEnabled && enabled(env.FEATURE_URL_SUBMISSION),
    premiumProviders: enabled(env.FEATURE_PREMIUM_PROVIDERS),
    externalNotifications: enabled(env.FEATURE_EXTERNAL_NOTIFICATIONS),
    organizationWorkspaces: enabled(env.FEATURE_ORGANIZATION_WORKSPACES),
  };
}

export function enabledProviderNames(env: NodeJS.ProcessEnv = process.env) {
  return [
    !enabled(env.DISABLE_CLOUDFLARE_DNS) && 'cloudflare-dns',
    !enabled(env.DISABLE_GOOGLE_DNS) && 'google-dns',
  ].filter(Boolean) as string[];
}