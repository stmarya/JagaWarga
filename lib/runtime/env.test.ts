import { describe, expect, it } from 'vitest';
import { runtimeConfig } from './env';

describe('runtimeConfig', () => {
  it('uses a validated version', () => {
    expect(runtimeConfig({ NODE_ENV: 'production', APP_VERSION: '0.4.0' })).toMatchObject({ nodeEnv: 'production', appVersion: '0.4.0' });
  });
  it('rejects unsafe version input', () => {
    expect(() => runtimeConfig({ NODE_ENV: 'production', APP_VERSION: '<script>' })).toThrow('ENV_APP_VERSION_INVALID');
  });
});