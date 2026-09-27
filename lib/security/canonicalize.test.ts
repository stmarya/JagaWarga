import { describe, expect, it } from 'vitest';
import { canonicalizeIndicator } from './canonicalize';

describe('canonicalizeIndicator', () => {
  it('redacts sensitive query values in display output', () => {
    const value = canonicalizeIndicator('https://example.com/reset?token=secret&lang=id');
    expect(value.displayValue).toContain('token=%5BREDACTED%5D');
    expect(value.displayValue).not.toContain('secret');
  });

  it.each(['http://127.0.0.1', 'http://10.0.0.1', 'http://169.254.169.254', 'http://[::1]'])(
    'rejects a non-public URL host: %s',
    (value) => expect(() => canonicalizeIndicator(value)).toThrow('IP_NON_PUBLIC'),
  );

  it('rejects credentials embedded in URLs', () => {
    expect(() => canonicalizeIndicator('https://user:pass@example.com')).toThrow('URL_CREDENTIALS_NOT_ALLOWED');
  });
});