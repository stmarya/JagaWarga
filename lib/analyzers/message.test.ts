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
});