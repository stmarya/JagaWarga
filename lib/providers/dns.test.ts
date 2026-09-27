import { describe, expect, it } from 'vitest';
import { canonicalizeIndicator } from '../security/canonicalize';
import { CloudflareDnsAdapter, GoogleDnsAdapter } from './dns';

const signal = new AbortController().signal;

describe('DNS metadata adapters', () => {
  it('normalizes a resolving response without claiming it is safe', async () => {
    const adapter = new CloudflareDnsAdapter(async () => ({ Status: 0, Answer: [{ data: '93.184.216.34' }] }));
    const evidence = await adapter.lookup(canonicalizeIndicator('example.com'), signal);
    expect(evidence).toMatchObject({
      provider: 'cloudflare-dns',
      verdict: 'unknown',
      reasonCodes: ['DNS_RESOLVES'],
      submissionOccurred: false,
    });
  });

  it('uses only the fixed Google DNS endpoint', () => {
    const adapter = new GoogleDnsAdapter();
    expect(adapter.endpoint('example.com')).toBe('https://dns.google/resolve?name=example.com&type=A');
  });
});