import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { runtimeRedis } from './runtime/redis';
import { readSnapshot, type LookupSnapshot } from './analyst/snapshot';

export const COMMUNITY_TTL_SECONDS = 24 * 60 * 60;
export const COMMUNITY_KEY = 'jagawarga:community-history:v2';
const MAX_ITEMS = 200;
export type CommunityComment = { id: string; author: string; message: string; createdAt: string };
export type CommunityHistoryItem = {
  id: string; indicator: LookupSnapshot['indicator']; risk: number; verdict: string;
  confidence: string; checkedAt: string; expiresAt: string; result: LookupSnapshot;
  comments: CommunityComment[];
};
type Record = { item: CommunityHistoryItem; deletionHash: string };
const memory = new Map<string, Record>();
const key = (id: string) => `${COMMUNITY_KEY}:item:${id}`;
const indexKey = `${COMMUNITY_KEY}:order`;
const validId = (id: string) => /^[a-f0-9-]{36}$/i.test(id);
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
function parse(raw: string | null): Record | null {
  try { return raw ? JSON.parse(raw) as Record : null; } catch { return null; }
}
function live(record: Record | null): record is Record {
  return Boolean(record?.item && Date.parse(record.item.expiresAt) > Date.now());
}
function pruneMemory() {
  for (const [id, record] of memory) if (!live(record)) memory.delete(id);
}

/** Only normalized, server-derived evidence may be published. No raw metadata. */
export async function saveCommunityHistory(snapshot: LookupSnapshot) {
  const result = readSnapshot(snapshot);
  const deletionToken = randomBytes(32).toString('hex');
  const item: CommunityHistoryItem = {
    id: randomUUID(), indicator: result.indicator, risk: result.risk, verdict: result.verdict,
    confidence: result.confidence, checkedAt: result.checkedAt, result, comments: [],
    expiresAt: new Date(Date.now() + COMMUNITY_TTL_SECONDS * 1000).toISOString(),
  };
  const record = { item, deletionHash: digest(deletionToken) };
  const redis = await runtimeRedis();
  if (redis) {
    await redis.multi()
      .set(key(item.id), JSON.stringify(record), { EX: COMMUNITY_TTL_SECONDS })
      .zAdd(indexKey, { score: Date.parse(item.expiresAt), value: item.id })
      .expire(indexKey, COMMUNITY_TTL_SECONDS)
      .exec();
    const expired = await redis.zRangeByScore(indexKey, '-inf', Date.now());
    const overflow = await redis.zRange(indexKey, 0, -(MAX_ITEMS + 1));
    const removed = [...new Set([...expired, ...overflow])];
    if (removed.length) await redis.multi().del(removed.map(key)).zRem(indexKey, removed).exec();
  } else {
    pruneMemory(); memory.set(item.id, record);
    while (memory.size > MAX_ITEMS) memory.delete(memory.keys().next().value!);
  }
  return { item, deletionToken };
}
export function getCommunityHistory(id: string): Promise<CommunityHistoryItem | null>;
export function getCommunityHistory(id?: undefined): Promise<CommunityHistoryItem[]>;
export async function getCommunityHistory(id?: string): Promise<CommunityHistoryItem | CommunityHistoryItem[] | null> {
  const redis = await runtimeRedis();
  if (id) {
    if (!validId(id)) return null;
    const record = redis ? parse(await redis.get(key(id))) : memory.get(id) ?? null;
    return live(record) ? record.item : null;
  }
  if (redis) {
    const ids = await redis.zRangeByScore(indexKey, Date.now() + 1, '+inf');
    const records = ids.length ? (await redis.mGet(ids.reverse().slice(0, 100).map(key))).map(parse) : [];
    return records.filter(live).map((record) => record.item);
  }
  pruneMemory(); return [...memory.values()].reverse().slice(0, 100).map((record) => record.item);
}
export async function deleteCommunityHistory(id: string, token: string) {
  if (!validId(id) || !/^[a-f0-9]{64}$/i.test(token)) return false;
  const redis = await runtimeRedis();
  const record = redis ? parse(await redis.get(key(id))) : memory.get(id) ?? null;
  if (!live(record) || !record.deletionHash || !/^[a-f0-9]{64}$/.test(record.deletionHash)) return false;
  if (!timingSafeEqual(Buffer.from(record.deletionHash, 'hex'), Buffer.from(digest(token), 'hex'))) return false;
  if (redis) await redis.multi().del(key(id)).zRem(indexKey, id).exec();
  else memory.delete(id);
  return true;
}
