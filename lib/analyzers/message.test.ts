import { describe, expect, it } from 'vitest';
import { analyzeMessage } from './message';

describe('analyzeMessage', () => {
  it('finds explainable phishing signals', () => {
    const result = analyzeMessage('Segera transfer biaya paket dan kirim OTP sekarang ke bank ini https://bit.ly/test');
    expect(result.verdict).toBe('high-risk');
    expect(result.reasonCodes).toEqual(expect.arrayContaining(['URGENCY', 'CREDENTIAL_REQUEST', 'MONEY_REQUEST', 'SHORT_LINK']));
  });
  it('does not call a normal greeting safe', () => {
    expect(analyzeMessage('Halo, apa kabar?')).toMatchObject({ verdict: 'low-signal', risk: 0 });
  });
  it('detects an English credential and payment lure', () => {
    expect(analyzeMessage('Urgent: your bank account will be suspended. Send money and share your verification code.')).toMatchObject({
      verdict: 'high-risk',
      reasonCodes: expect.arrayContaining(['URGENCY', 'CREDENTIAL_REQUEST', 'MONEY_REQUEST', 'IMPERSONATION']),
    });
  });
  it('does not flag a normal knowledge-transfer sentence as a money request', () => {
    expect(analyzeMessage('Besok ada sesi transfer pengetahuan bersama tim produk.')).toMatchObject({
      verdict: 'low-signal',
      reasonCodes: [],
    });
  });
  it('bounds very large input before evaluation', () => {
    const result = analyzeMessage(`${'halo '.repeat(3_000)} OTP segera`);
    expect(result.risk).toBeLessThanOrEqual(100);
  });
});