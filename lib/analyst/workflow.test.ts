import { describe, expect, it } from 'vitest';
import { caseIsDirty, mergeSnapshots, nextCaseUpdatedAt, retryDelayMs, triageCounts } from './workflow';
const snapshot = { indicator: { type: 'domain', displayValue: 'example.org' }, risk: 10, verdict: 'no-indication', confidence: 'medium', checkedAt: '2026-10-14T00:00:00Z', requestId: 'one', scoringVersion: 'v1', coverage: { requested: 1, assessed: 1, failed: 0 }, evidence: [] };
import { readSnapshot } from './snapshot';
const safe = readSnapshot(snapshot);
describe('analyst workflow boundaries', () => {
 it('counts valid/invalid and success/failure separately', () => { expect(triageCounts([{ value: 'x', type: 'domain', status: 'done', result: safe }, { value: 'bad', type: 'unknown', status: 'invalid' }, { value: 'y', type: 'domain', status: 'failed' }])).toEqual({ total: 3, valid: 2, invalid: 1, done: 1, failed: 1, ready: 0 }); });
 it('bounds retry delays and accepts HTTP-date or seconds', () => { expect(retryDelayMs(null)).toBe(60000); expect(retryDelayMs('0')).toBe(1000); expect(retryDelayMs('10000')).toBe(10000000); expect(retryDelayMs('999999999')).toBe(86400000); expect(retryDelayMs('invalid')).toBe(60000); expect(retryDelayMs('2026-10-14T00:00:02Z', Date.parse('2026-10-14T00:00:00Z'))).toBe(2000); });
 it('deduplicates snapshots by request ID and strips raw metadata', () => { const result = mergeSnapshots([safe], [safe, { ...safe, requestId: 'second' }]); expect(result).toHaveLength(2); expect(JSON.stringify(result)).not.toContain('DO_NOT_EXPORT'); });
 it('rejects case overflow atomically', () => { const current = Array.from({ length: 100 }, (_, n) => ({ ...safe, requestId: String(n) })); expect(() => mergeSnapshots(current, [{ ...safe, requestId: 'overflow' }])).toThrow('100'); expect(current).toHaveLength(100); });
 it('marks only changed drafts dirty', () => { expect(caseIsDirty(null, null)).toBe(false); const base = { title: 'x' } as never; expect(caseIsDirty(base, { title: 'x' } as never)).toBe(false); expect(caseIsDirty({ title: 'y' } as never, base)).toBe(true); });
 it('always advances update revision timestamp', () => { const future = new Date(Date.now() + 100000).toISOString(); expect(Date.parse(nextCaseUpdatedAt(future))).toBeGreaterThan(Date.parse(future)); });
});
