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
});