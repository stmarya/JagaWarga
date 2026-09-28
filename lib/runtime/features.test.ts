import { describe, expect, it } from 'vitest';
import { enabledProviderNames, featureFlags, providerDiagnostics, virusTotalApiKeys } from './features';

describe('feature governance', () => {
  it('denies risky features by default', () => {
    expect(featureFlags({ NODE_ENV: 'test', FEATURE_FILE_UPLOAD: 'true', FEATURE_URL_SUBMISSION: 'true' })).toMatchObject({
      fileUpload: false,
      urlSubmission: false,
      communityReporting: false,
    });
  });
  it('supports provider kill switches', () => {
    expect(enabledProviderNames({ NODE_ENV: 'test', DISABLE_GOOGLE_DNS: 'true' })).toEqual(['cloudflare-dns']);
  });
  it('enables VirusTotal only with the feature flag and key', () => {
    expect(enabledProviderNames({ NODE_ENV: 'test', FEATURE_PREMIUM_PROVIDERS: 'true' })).not.toContain('virustotal');
    expect(enabledProviderNames({
      NODE_ENV: 'test',
      FEATURE_PREMIUM_PROVIDERS: 'true',
      VIRUSTOTAL_API_KEY: 'test-key',
    })).toContain('virustotal');
  });
  it('accepts a comma-separated key pool for automatic rollover', () => {
    const env = {
      NODE_ENV: 'test',
      FEATURE_PREMIUM_PROVIDERS: 'true',
      VIRUSTOTAL_API_KEYS: 'one,two,one',
    };
    expect(virusTotalApiKeys(env)).toEqual(['one', 'two']);
    expect(providerDiagnostics(env).find((provider) => provider.name === 'virustotal')).toMatchObject({
      status: 'enabled',
      reason: 'configured-key-pool',
    });
  });
});