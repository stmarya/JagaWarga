import { runtimeRedis } from './runtime/redis';

export type CommunityComment = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type CommunityHistoryItem = {
  id: string;
  indicator: { type: string; displayValue: string };
  verdict: string;
  risk: number;
  confidence: string;
  checkedAt: string;
  result: unknown;
  comments: CommunityComment[];
};

const memory = new Map<string, CommunityHistoryItem>();
const order: string[] = [];
const KEY = 'jagawarga:community-history:v1';

function safeItem(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as CommunityHistoryItem;
  } catch {
    return null;
  }
}

export async function saveCommunityHistory(input: Omit<CommunityHistoryItem, 'id' | 'comments'>) {
  const item: CommunityHistoryItem = { ...input, id: crypto.randomUUID(), comments: [] };
  const redis = await runtimeRedis();
  if (redis) {
    await redis.hSet(KEY, item.id, JSON.stringify(item));
    await redis.zAdd(`${KEY}:order`, { score: Date.parse(item.checkedAt) || Date.now(), value: item.id });
    await redis.zRemRangeByRank(`${KEY}:order`, 0, -201);
  } else {
    memory.set(item.id, item);
    order.unshift(item.id);
    order.splice(200);
  }
  return item;
}

export function getCommunityHistory(id: string): Promise<CommunityHistoryItem | null>;
export function getCommunityHistory(id?: undefined): Promise<CommunityHistoryItem[]>;
export async function getCommunityHistory(id?: string): Promise<CommunityHistoryItem | CommunityHistoryItem[] | null> {
  const redis = await runtimeRedis();
  if (id) {
    if (redis) return safeItem(await redis.hGet(KEY, id));
    return memory.get(id) ?? null;
  }
  if (redis) {
    const ids = await redis.zRange(`${KEY}:order`, 0, 99, { REV: true });
    const values = ids.length ? await redis.hmGet(KEY, ids) : [];
    return values.map(safeItem).filter((item): item is CommunityHistoryItem => Boolean(item));
  }
  return order.map((itemId) => memory.get(itemId)).filter((item): item is CommunityHistoryItem => Boolean(item));
}

export async function addCommunityComment(id: string, message: string) {
  const item = await getCommunityHistory(id);
  if (!item) return null;
  item.comments.push({
    id: crypto.randomUUID(),
    author: 'Warga',
    message: message.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
  });
  const redis = await runtimeRedis();
  if (redis) await redis.hSet(KEY, id, JSON.stringify(item));
  else memory.set(id, item);
  return item;
}