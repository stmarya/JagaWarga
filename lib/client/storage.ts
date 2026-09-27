export type LocalHistoryItem = {
  id: string;
  type: string;
  displayValue: string;
  verdict: string;
  checkedAt: string;
};

const SCHEMA_VERSION = 2;
const HISTORY = 'jagawarga:history:v2';
const WATCHLIST = 'jagawarga:watchlist:v2';
const PROGRESS = 'jagawarga:progress:v2';
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

export function getHistory() { return read<LocalHistoryItem[]>(HISTORY, []); }
export function addHistory(item: LocalHistoryItem) {
  write(HISTORY, [item, ...getHistory().filter((entry) => entry.id !== item.id)].slice(0, 50));
}
export function clearHistory() { localStorage.removeItem(HISTORY); }
export function exportLocalData() {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), history: getHistory(), watchlist: getWatchlist(), progress: getProgress() }, null, 2);
}
export function clearAllLocalData() {
  [...Object.keys(LEGACY), ...Object.values(LEGACY)].forEach((key) => localStorage.removeItem(key));
}

export function getWatchlist() { return read<string[]>(WATCHLIST, []); }
export function addWatchlist(value: string) { write(WATCHLIST, [...new Set([value, ...getWatchlist()])].slice(0, 50)); }
export function removeWatchlist(value: string) { write(WATCHLIST, getWatchlist().filter((item) => item !== value)); }

export type Progress = { xp: number; badges: string[] };
export function getProgress() { return read<Progress>(PROGRESS, { xp: 0, badges: [] }); }
export function addXp(amount: number) {
  const progress = getProgress();
  const xp = progress.xp + amount;
  const badges = [...new Set([...progress.badges, ...(xp >= 10 ? ['Cek Sebelum Klik'] : []), ...(xp >= 50 ? ['Detektif Digital'] : [])])];
  const next = { xp, badges };
  write(PROGRESS, next);
  return next;
}