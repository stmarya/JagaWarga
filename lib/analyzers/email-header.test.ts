import { describe, expect, it } from 'vitest';
import { analyzeEmailHeader } from './email-header';

describe('analyzeEmailHeader', () => {
  it('flags failed authentication and reply-to mismatch', () => {
    const result = analyzeEmailHeader([
      'From: Support <help@bank.example>',
      'Reply-To: attacker@evil.example',
      'Received: by mx.example',
      'Authentication-Results: mx.example; spf=fail; dkim=fail; dmarc=fail',
    ].join('\n'));
    expect(result.verdict).toBe('suspicious');
    expect(result.reasonCodes).toContain('FROM_REPLY_TO_MISMATCH');
  });
  it('handles folded authentication headers', () => {
    const result = analyzeEmailHeader([
      'From: Support <help@example.com>',
      'Reply-To: help@example.com',
      'Received: by mx.example',
      'Authentication-Results: mx.example; spf=pass;',
      ' dkim=pass; dmarc=pass',
    ].join('\n'));
    expect(result).toMatchObject({ verdict: 'low-signal', authentication: { spf: 'pass', dkim: 'pass', dmarc: 'pass' } });
  });
  it('returns bounded review signals for malformed or oversized input', () => {
    const result = analyzeEmailHeader(`not-a-header\n${'x'.repeat(60_000)}`);
    expect(result).toMatchObject({ verdict: 'low-signal', reasonCodes: ['NO_RECEIVED_CHAIN'] });
    expect(result.risk).toBe(10);
  });
});