import { readSnapshot, type LookupSnapshot } from '../analyst/snapshot';

export type LocalHistoryItem = {
  id: string;
  type: string;
  displayValue: string;
  verdict: string;
  checkedAt: string;
  snapshot?: LookupSnapshot;
};

const SCHEMA_VERSION = 2;
const HISTORY = 'jagawarga:history:v2';
const WATCHLIST = 'jagawarga:watchlist:v2';
const PROGRESS = 'jagawarga:progress:v2';
const HISTORY_PREFERENCE = 'jagawarga:remember-history:v1';
const LEGACY = {
  [HISTORY]: 'jagawarga:history:v1',
  [WATCHLIST]: 'jagawarga:watchlist:v1',
  [PROGRESS]: 'jagawarga:progress:v1',
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const current = localStorage.getItem(key);
    if (current) return JSON.parse(current) as T;
    const legacyKey = LEGACY[key as keyof typeof LEGACY];
    const legacy = legacyKey ? localStorage.getItem(legacyKey) : null;
    if (!legacy) return fallback;
    const migrated = JSON.parse(legacy) as T;
    write(key, migrated);
    localStorage.removeItem(legacyKey);
    return migrated;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getHistory() {
  const rows = read<unknown>(HISTORY, []);
  if (!Array.isArray(rows)) return [];
  return rows.filter((item): item is LocalHistoryItem => item && typeof item.id === 'string'
    && typeof item.type === 'string' && typeof item.displayValue === 'string'
    && typeof item.verdict === 'string' && Number.isFinite(Date.parse(item.checkedAt)));
}
export function addHistory(item: LocalHistoryItem) {
  write(HISTORY, [item, ...getHistory().filter((entry) => entry.id !== item.id)].slice(0, 50));
}
export function removeHistory(id: string) { write(HISTORY, getHistory().filter((item) => item.id !== id)); }
export function clearHistory() { localStorage.removeItem(HISTORY); localStorage.removeItem(LEGACY[HISTORY]); }
export function remembersHistory() { return typeof window !== 'undefined' && localStorage.getItem(HISTORY_PREFERENCE) === 'true'; }
export function setRememberHistory(value: boolean) { localStorage.setItem(HISTORY_PREFERENCE, String(value)); }
export function rememberLookup(value: unknown) {
  // Restricted snapshots cannot contain raw provider metadata or recognized URL secrets.
  const snapshot = readSnapshot(value);
  addHistory({ id: crypto.randomUUID(), type: snapshot.indicator.type,
    displayValue: snapshot.indicator.displayValue, verdict: snapshot.verdict, checkedAt: snapshot.checkedAt, snapshot });
}
export function exportLocalData() {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), history: getHistory(), watchlist: getWatchlist(), progress: getProgress(), legacy: { history: read("jagawarga:history", []), xp: read("jagawarga:user-xp", 0), historyV1: read("jagawarga:history:v1", []), watchlistV1: read("jagawarga:watchlist:v1", []), progressV1: read("jagawarga:progress:v1", null) } }, null, 2);
}
export function clearAllLocalData() {
  [...Object.keys(LEGACY), ...Object.values(LEGACY), HISTORY_PREFERENCE, 'jagawarga:history', 'jagawarga:user-xp', 'jagawarga:community-receipts:v1']
    .forEach((key) => localStorage.removeItem(key));
}

export function getWatchlist() { const value = read<unknown>(WATCHLIST, []); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
export function addWatchlist(value: string) { write(WATCHLIST, [...new Set([value, ...getWatchlist()])].slice(0, 50)); }
export function removeWatchlist(value: string) { write(WATCHLIST, getWatchlist().filter((item) => item !== value)); }

export type Progress = { xp: number; badges: string[] };
export function getProgress() { const value = read<Progress>(PROGRESS, { xp: 0, badges: [] }); return { xp: Number.isFinite(value?.xp) && value.xp >= 0 ? value.xp : 0, badges: Array.isArray(value?.badges) ? value.badges.filter((b) => typeof b === 'string') : [] }; }
export function addXp(amount: number) {
  const progress = getProgress();
  const xp = progress.xp + amount;
  const badges = [...new Set([...progress.badges, ...(xp >= 10 ? ['Cek Sebelum Klik'] : []), ...(xp >= 50 ? ['Detektif Digital'] : [])])];
  const next = { xp, badges };
  write(PROGRESS, next);
  return next;
}