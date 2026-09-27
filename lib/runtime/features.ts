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

function validSingleKey(value: string | undefined) {
  return Boolean(value?.trim()) && !/[\r\n,]/.test(value ?? '');
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
  const virusTotalStatus: ProviderDiagnostic = !premiumEnabled
    ? { name: 'virustotal', kind: 'reputation', status: 'disabled', reason: 'feature-disabled' }
    : !env.VIRUSTOTAL_API_KEY?.trim()
      ? { name: 'virustotal', kind: 'reputation', status: 'misconfigured', reason: 'missing-key' }
      : !validSingleKey(env.VIRUSTOTAL_API_KEY)
        ? { name: 'virustotal', kind: 'reputation', status: 'misconfigured', reason: 'key-must-be-single-value' }
        : { name: 'virustotal', kind: 'reputation', status: 'enabled', reason: 'configured' };

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