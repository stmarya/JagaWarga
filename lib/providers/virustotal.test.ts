import { describe, expect, it } from 'vitest';
import { canonicalizeIndicator } from '../security/canonicalize';
import { VirusTotalAdapter } from './virustotal';

const signal = new AbortController().signal;

describe('VirusTotalAdapter', () => {
  it('performs existing IP lookup without submission and normalizes malicious evidence', async () => {
    let requested = '';
    let suppliedKey = '';
    const adapter = new VirusTotalAdapter('secret-test-key', async (url, _signal, key) => {
      requested = url;
      suppliedKey = key;
      return {
        data: {
          attributes: {
            last_analysis_date: 1_700_000_000,
            last_analysis_stats: { malicious: 4, suspicious: 1, harmless: 20, undetected: 25 },
          },
        },
      };
    });
    const evidence = await adapter.lookup(canonicalizeIndicator('8.8.8.8'), signal);
    expect(requested).toBe('https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8');
    expect(suppliedKey).toBe('secret-test-key');
    expect(evidence).toMatchObject({
      provider: 'virustotal',
      verdict: 'malicious',
      reasonCodes: ['VT_MULTIPLE_MALICIOUS_DETECTIONS'],
      submissionOccurred: false,
    });
  });

  it('uses URL lookup ID and never calls a submission endpoint', async () => {
    let requested = '';
    const adapter = new VirusTotalAdapter('secret-test-key', async (url) => {
      requested = url;
      return { data: { attributes: { last_analysis_stats: { harmless: 12, undetected: 3 } } } };
    });
    const evidence = await adapter.lookup(canonicalizeIndicator('https://example.com/path'), signal);
    expect(requested).toContain('/api/v3/urls/');
    expect(requested).not.toContain('/analyse');
    expect(evidence.verdict).toBe('benign');
    expect(evidence.submissionOccurred).toBe(false);
  });

  it('returns no-record evidence for a 404', async () => {
    const adapter = new VirusTotalAdapter('secret-test-key', async () => {
      throw new Error('PROVIDER_HTTP_404');
    });
    await expect(adapter.lookup(canonicalizeIndicator('example.com'), signal)).resolves.toMatchObject({
      verdict: 'unknown',
      reasonCodes: ['VT_NO_RECORD'],
    });
  });

  it('rolls over to the next API key immediately when a key is rate limited', async () => {
    const suppliedKeys: string[] = [];
    const adapter = new VirusTotalAdapter(['quota-exhausted-key', 'backup-key'], async (_url, _signal, key) => {
      suppliedKeys.push(key);
      if (key === 'quota-exhausted-key') throw new Error('PROVIDER_HTTP_429');
      return { data: { attributes: { last_analysis_stats: { harmless: 12, undetected: 3 } } } };
    });

    await expect(adapter.lookup(canonicalizeIndicator('example.com'), signal)).resolves.toMatchObject({
      provider: 'virustotal',
      verdict: 'benign',
    });
    expect(suppliedKeys).toEqual(['quota-exhausted-key', 'backup-key']);
  });

  it('accepts a comma-separated key pool for environment compatibility', async () => {
    let suppliedKey = '';
    const adapter = new VirusTotalAdapter('pool-key-1,pool-key-2', async (_url, _signal, key) => {
      suppliedKey = key;
      return { data: { attributes: { last_analysis_stats: { harmless: 1 } } } };
    });
    await adapter.lookup(canonicalizeIndicator('example.org'), signal);
    expect(['pool-key-1', 'pool-key-2']).toContain(suppliedKey);
  });

  it('classifies globally popular domains with isolated false-positive detections as benign', async () => {
    const adapter = new VirusTotalAdapter('test-key', async () => ({
      data: {
        attributes: {
          last_analysis_stats: { malicious: 2, suspicious: 0, harmless: 62, undetected: 27 },
          reputation: 725,
          popularity_ranks: { Majestic: { rank: 1 } },
        },
      },
    }));
    const evidence = await adapter.lookup(canonicalizeIndicator('google.com'), signal);
    expect(evidence.verdict).toBe('benign');
    expect(evidence.reasonCodes).toContain('VT_POPULAR_TRUSTED_DOMAIN');
  });
});