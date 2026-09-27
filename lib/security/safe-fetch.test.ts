import { describe, expect, it } from 'vitest';
import { validateProviderUrl } from './safe-fetch';

describe('validateProviderUrl', () => {
  it.each([
    'https://cloudflare-dns.com/dns-query?name=example.com&type=A',
    'https://dns.google/resolve?name=example.com&type=A',
    'https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8',
  ])('allows a fixed provider origin: %s', (value) => {
    expect(validateProviderUrl(value).protocol).toBe('https:');
  });

  it.each([
    'http://dns.google/resolve',
    'https://evil.example/resolve',
    'https://dns.google.evil.example/resolve',
    'https://user:pass@dns.google/resolve',
    'https://127.0.0.1/resolve',
  ])('rejects a non-allowlisted provider URL: %s', (value) => {
    expect(() => validateProviderUrl(value)).toThrow('PROVIDER_URL_NOT_ALLOWED');
  });
});