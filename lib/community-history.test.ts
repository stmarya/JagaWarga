import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMUNITY_TTL_SECONDS, deleteCommunityHistory, getCommunityHistory, saveCommunityHistory } from './community-history';
import { runtimeRedis } from './runtime/redis';
import { readSnapshot } from './analyst/snapshot';
vi.mock('./runtime/redis', () => ({ runtimeRedis: vi.fn() }));
const snapshot = () => readSnapshot({ indicator: { type: 'domain', displayValue: 'example.org' }, risk: 60, verdict: 'suspicious', confidence: 'medium',
  requestId: 'fixture', checkedAt: new Date().toISOString(), scoringVersion: 'severity-independent-v1', conflictingEvidence: false,
  coverage: { requested: 1, assessed: 1, failed: 0 }, evidence: [{ provider: 'fixture', verdict: 'suspicious', confidence: 0.6, observedAt: null, fetchedAt: new Date().toISOString(), reasonCodes: ['FIXTURE'], details: { raw: 'NOT_PUBLIC' } }] });
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-14T00:00:00Z')); vi.mocked(runtimeRedis).mockResolvedValue(null); });
afterEach(() => vi.useRealTimers());
class FakeRedis {
  values = new Map<string, { value: string; until: number }>(); index = new Map<string, number>(); ttls: number[] = [];
  multi() {
    const ops: Array<() => void> = []; const self = this;
    const chain = {
      set(k: string, v: string, options: { EX: number }) { ops.push(() => { self.ttls.push(options.EX); self.values.set(k, { value: v, until: Date.now() + options.EX * 1000 }); }); return chain; },
      zAdd(_k: string, row: { score: number; value: string }) { ops.push(() => self.index.set(row.value, row.score)); return chain; },
      expire(_k: string, ttl: number) { ops.push(() => { self.ttls.push(ttl); }); return chain; },
      del(keys: string | string[]) { ops.push(() => { for (const k of typeof keys === 'string' ? [keys] : keys) self.values.delete(k); }); return chain; },
      zRem(_k: string, ids: string | string[]) { ops.push(() => { for (const id of typeof ids === 'string' ? [ids] : ids) self.index.delete(id); }); return chain; },
      async exec() { ops.forEach((op) => op()); return []; },
    }; return chain;
  }
  async get(k: string) { const v = this.values.get(k); return v && v.until > Date.now() ? v.value : null; }
  async mGet(keys: string[]) { return Promise.all(keys.map((k) => this.get(k))); }
  async zRangeByScore(_k: string, low: string | number, high: string | number) {
    return [...this.index].filter(([, v]) => v >= (low === '-inf' ? -Infinity : Number(low)) && v <= (high === '+inf' ? Infinity : Number(high))).map(([id]) => id);
  }
  async zRange(_k: string, start: number, stop: number) { const ids = [...this.index.keys()]; const last = stop < 0 ? ids.length + stop : stop; return last < start ? [] : ids.slice(start, last + 1); }
}
describe('consented community retention', () => {
  it('returns deletion capability only to the publisher, not public readers', async () => {
    const saved = await saveCommunityHistory(snapshot());
    const publicItem = await getCommunityHistory(saved.item.id);
    expect(publicItem).toEqual(saved.item);
    expect(JSON.stringify(publicItem)).not.toContain(saved.deletionToken);
    expect(JSON.stringify(publicItem)).not.toContain('deletionHash');
    expect(JSON.stringify(publicItem)).not.toContain('NOT_PUBLIC');
  });
  it('denies deletion without the correct capability, then deletes record and listing', async () => {
    const saved = await saveCommunityHistory(snapshot());
    expect(await deleteCommunityHistory(saved.item.id, '0'.repeat(64))).toBe(false);
    expect(await deleteCommunityHistory(saved.item.id, 'short')).toBe(false);
    expect(await deleteCommunityHistory(saved.item.id, saved.deletionToken)).toBe(true);
    expect(await getCommunityHistory(saved.item.id)).toBeNull();
    expect((await getCommunityHistory()).some((row) => row.id === saved.item.id)).toBe(false);
  });
  it('expires memory records after 24 hours', async () => {
    const saved = await saveCommunityHistory(snapshot());
    vi.advanceTimersByTime(COMMUNITY_TTL_SECONDS * 1000);
    expect(await getCommunityHistory(saved.item.id)).toBeNull();
    expect((await getCommunityHistory()).some((row) => row.id === saved.item.id)).toBe(false);
  });
  it('keeps memory storage bounded and removes evicted records, not just index entries', async () => {
    const first = await saveCommunityHistory(snapshot());
    for (let i = 0; i < 201; i++) await saveCommunityHistory(snapshot());
    expect(await getCommunityHistory(first.item.id)).toBeNull();
    expect((await getCommunityHistory()).length).toBeLessThanOrEqual(100);
  });
  it('sets Redis TTL on each item and removes item plus index on authorized deletion', async () => {
    const redis = new FakeRedis(); vi.mocked(runtimeRedis).mockResolvedValue(redis as never);
    const saved = await saveCommunityHistory(snapshot());
    expect(redis.ttls).toEqual([COMMUNITY_TTL_SECONDS, COMMUNITY_TTL_SECONDS]);
    expect(await deleteCommunityHistory(saved.item.id, saved.deletionToken)).toBe(true);
    expect(redis.values.size).toBe(0); expect(redis.index.size).toBe(0);
  });
  it('does not return expired Redis entries', async () => {
    const redis = new FakeRedis(); vi.mocked(runtimeRedis).mockResolvedValue(redis as never);
    const saved = await saveCommunityHistory(snapshot()); vi.advanceTimersByTime(COMMUNITY_TTL_SECONDS * 1000);
    expect(await getCommunityHistory(saved.item.id)).toBeNull(); expect(await getCommunityHistory()).toEqual([]);
  });
  it('fails closed on an unavailable distributed backend', async () => {
    vi.mocked(runtimeRedis).mockRejectedValue(new Error('unavailable'));
    await expect(saveCommunityHistory(snapshot())).rejects.toThrow('unavailable');
  });
});
