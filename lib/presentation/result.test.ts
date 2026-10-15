import { describe, expect, it } from 'vitest';
import { resultActions, resultFindings, resultLimitations, type DisplayResult } from './result';
const base: DisplayResult = { requestId: 'fixture', risk: 10, verdict: 'no-indication', confidence: 'medium',
  indicator: { type: 'ipv4', displayValue: '8.8.8.8' }, evidence: [] };
describe('evidence-first result presentation', () => {
  it('does not infer C2, phishing, malware, or account takeover from indicator type', () => {
    for (const type of ['url', 'domain', 'ipv4', 'hash']) {
      const result = { ...base, indicator: { type, displayValue: 'fixture' } };
      expect(resultFindings(result)).toEqual([]);
      expect(resultActions(result).join(' ')).not.toMatch(/server pengendali|akun.*diambil|malware/i);
    }
  });
  it('unknown evidence never produces reassuring actions', () => {
    expect(resultActions({ ...base, risk: 0, verdict: 'insufficient-data' })[0]).toContain('Tunda');
  });
  it('preserves partial and stale evidence warnings', () => {
    const r = { ...base, partial: true, evidence: [{ provider: 'google-dns', verdict: 'unknown', fetchedAt: '', freshness: 'stale', reasonCodes: ['DNS_RESOLVES'] }] };
    expect(resultActions(r).join(' ')).toContain('Sebagian sumber gagal');
    expect(resultLimitations(r).join(' ')).toContain('evidence lama');
    expect(resultFindings(r)[0].text).toContain('bukan penilaian reputasi');
  });
  it('shows credential and money actions only when supported by reason codes', () => {
    const r = { ...base, analysisKind: 'message', reasonCodes: ['CREDENTIAL_REQUEST', 'MONEY_REQUEST'] };
    expect(resultActions(r).join(' ')).toContain('Jangan kirim OTP');
    expect(resultActions(r).join(' ')).toContain('Jangan transfer');
  });
  it('discloses that header analysis is not independent DKIM verification', () => {
    expect(resultLimitations({ ...base, analysisKind: 'email-header' }).join(' ')).toContain('bukan verifikasi kriptografis');
  });
});