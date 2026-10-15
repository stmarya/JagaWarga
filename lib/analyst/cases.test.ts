import { describe, expect, it } from 'vitest';
import { casePackage, parseCaseImport, validateCase } from './cases';
import { readSnapshot } from './snapshot';

export const snapshot = {
  indicator: { type: 'domain', displayValue: 'example.org' }, risk: 60, verdict: 'suspicious', confidence: 'medium',
  checkedAt: '2026-10-14T00:00:00.000Z', requestId: 'fixture-id', scoringVersion: 'severity-independent-v1',
  coverage: { requested: 1, assessed: 1, failed: 0 }, conflictingEvidence: false,
  evidence: [{ provider: 'fixture', verdict: 'suspicious', confidence: 0.6, observedAt: null,
    fetchedAt: '2026-10-14T00:00:00.000Z', reasonCodes: ['FIXTURE'], freshness: 'fresh',
    details: { sensitive: 'DO_NOT_EXPORT' }, sourceUrl: 'https://example.org/?token=DO_NOT_EXPORT' }],
};
const investigation = {
  id: 'fixture-case', title: 'Kasus uji', summary: '', notes: 'Hipotesis belum terverifikasi', conclusion: '',
  status: 'investigating', createdAt: snapshot.checkedAt, updatedAt: snapshot.checkedAt, snapshots: [snapshot],
};
describe('local case packages', () => {
  it('round-trips a versioned package and strips provider metadata', () => {
    const c = validateCase(investigation);
    const exported = JSON.stringify(casePackage(c));
    expect(exported).not.toContain('DO_NOT_EXPORT');
    expect(parseCaseImport(exported)).toEqual(c);
  });
  it('rejects unsupported schemas and malformed payloads', () => {
    expect(() => parseCaseImport('{"schemaVersion":2,"kind":"jagawarga-case"}')).toThrow();
    expect(() => parseCaseImport('{')).toThrow();
    expect(() => validateCase({ ...investigation, status: 'unknown' })).toThrow();
    expect(() => validateCase({ ...investigation, title: '' })).toThrow();
    expect(() => validateCase({ ...investigation, notes: 'a'.repeat(8001) })).toThrow();
    expect(() => validateCase({ ...investigation, snapshots: Array(101).fill(snapshot) })).toThrow();
  });
  it('rejects unsafe imported indicators, dates and numeric values', () => {
    expect(() => readSnapshot({ ...snapshot, indicator: { type: 'url', displayValue: 'https://example.org/?token=secret' } })).toThrow();
    expect(() => readSnapshot({ ...snapshot, indicator: { type: 'hash', displayValue: 'example.org' } })).toThrow();
    expect(() => readSnapshot({ ...snapshot, risk: NaN })).toThrow();
    expect(() => readSnapshot({ ...snapshot, checkedAt: 'invalid' })).toThrow();
    expect(() => readSnapshot({ ...snapshot, evidence: [{ ...snapshot.evidence[0], confidence: 5 }] })).toThrow();
    expect(() => parseCaseImport('a'.repeat(1024 * 1024 + 1))).toThrow('1 MB');
  });
  it('retains text as plain data; it is never interpreted as HTML', () => {
    expect(validateCase({ ...investigation, title: '<script>alert(1)</script>' }).title).toContain('<script>');
  });
  it('normalizes timestamp offsets so timeline ordering is chronological', () => {
    expect(readSnapshot({ ...snapshot, checkedAt: '2026-10-14T07:00:00+07:00' }).checkedAt).toBe(snapshot.checkedAt);
    expect(() => readSnapshot({ ...snapshot, checkedAt: '2026-10-14' })).toThrow();
  });
});