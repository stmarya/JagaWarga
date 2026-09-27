import { describe, expect, it } from 'vitest';
import { enabledProviderNames, featureFlags } from './features';

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
});