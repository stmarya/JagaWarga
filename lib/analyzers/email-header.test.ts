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
});