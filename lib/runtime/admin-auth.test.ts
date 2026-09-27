import { describe, expect, it } from 'vitest';
import { adminAuthorized } from './admin-auth';

describe('adminAuthorized', () => {
  it('requires a matching bearer token in production', () => {
    const request = new Request('https://example.test', { headers: { authorization: 'Bearer correct' } });
    expect(adminAuthorized(request, { NODE_ENV: 'production', ADMIN_METRICS_TOKEN: 'correct' })).toBe(true);
    expect(adminAuthorized(request, { NODE_ENV: 'production', ADMIN_METRICS_TOKEN: 'wrong' })).toBe(false);
  });
  it('fails closed when production token is absent', () => {
    expect(adminAuthorized(new Request('https://example.test'), { NODE_ENV: 'production' })).toBe(false);
  });
});