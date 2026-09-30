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

export function virusTotalApiKeys(env: NodeJS.ProcessEnv = process.env) {
  const pool = env.VIRUSTOTAL_API_KEYS || env.VIRUSTOTAL_API_KEY || '';
  return [...new Set(pool.split(/[\r\n,]+/).map((key) => key.trim()).filter(Boolean))];
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
  return providerDiagnostics(env).filter((provider) => provider.status === 'enabled').map((provider) => provider.name);
}

export type ProviderDiagnostic = {
  name: string;
  kind: 'metadata' | 'reputation';
  status: 'enabled' | 'disabled' | 'misconfigured';
  reason: string;
};

export const reputationPolicy = {
  minimumConfiguredProviders: 1,
  acceptedSingleProviderLimitation: true,
  limitation: 'VirusTotal is the only enabled reputation source; DNS providers supply metadata only.',
  staleBenignEvidenceCanProduceSafeVerdict: false,
} as const;

export function providerDiagnostics(env: NodeJS.ProcessEnv = process.env): ProviderDiagnostic[] {
  const premiumEnabled = enabled(env.FEATURE_PREMIUM_PROVIDERS);
  const virusTotalKeys = virusTotalApiKeys(env);
  const virusTotalStatus: ProviderDiagnostic = !premiumEnabled
    ? { name: 'virustotal', kind: 'reputation', status: 'disabled', reason: 'feature-disabled' }
    : !virusTotalKeys.length
      ? { name: 'virustotal', kind: 'reputation', status: 'misconfigured', reason: 'missing-key' }
      : { name: 'virustotal', kind: 'reputation', status: 'enabled', reason: virusTotalKeys.length > 1 ? 'configured-key-pool' : 'configured' };

  return [
    enabled(env.DISABLE_CLOUDFLARE_DNS)
      ? { name: 'cloudflare-dns', kind: 'metadata', status: 'disabled', reason: 'kill-switch' }
      : { name: 'cloudflare-dns', kind: 'metadata', status: 'enabled', reason: 'configured' },
    enabled(env.DISABLE_GOOGLE_DNS)
      ? { name: 'google-dns', kind: 'metadata', status: 'disabled', reason: 'kill-switch' }
      : { name: 'google-dns', kind: 'metadata', status: 'enabled', reason: 'configured' },
    virusTotalStatus,
  ] as ProviderDiagnostic[];
}