import type { PreviewItem } from './indicators';
import { readSnapshot, type LookupSnapshot } from './snapshot';
import type { InvestigationCase } from './cases';
export type TriageRow = PreviewItem & { status: 'ready' | 'invalid' | 'running' | 'done' | 'failed'; result?: LookupSnapshot };
export const rowLabels = { ready: 'Menunggu', invalid: 'Ditolak', running: 'Sedang diperiksa', done: 'Selesai', failed: 'Gagal' };
export function triageCounts(rows: TriageRow[]) {
  const valid = rows.filter((r) => r.status !== 'invalid');
  return { total: rows.length, valid: valid.length, invalid: rows.length - valid.length,
    done: rows.filter((r) => r.status === 'done').length, failed: rows.filter((r) => r.status === 'failed').length,
    ready: rows.filter((r) => r.status === 'ready').length };
}
export function retryDelayMs(header: string | null, now = Date.now()) {
  const seconds = header !== null && /^\d+(?:\.\d+)?$/.test(header.trim()) ? Number(header) : header ? (Date.parse(header) - now) / 1000 : 60;
  return Math.min(86_400_000, Math.max(1_000, Number.isFinite(seconds) ? seconds * 1000 : 60_000));
}
export function mergeSnapshots(current: LookupSnapshot[], incoming: LookupSnapshot[]) {
  const combined = current.map(readSnapshot);
  for (const raw of incoming) { const snapshot = readSnapshot(raw); if (!combined.some((s) => s.requestId === snapshot.requestId)) combined.push(snapshot); }
  if (combined.length > 100) throw new Error('Maksimal 100 snapshot per kasus. Tidak ada perubahan disimpan.');
  return combined;
}
export function caseIsDirty(draft: InvestigationCase | null, baseline: InvestigationCase | null) { return Boolean(draft && JSON.stringify(draft) !== JSON.stringify(baseline)); }

export function nextCaseUpdatedAt(previous: string) { return new Date(Math.max(Date.now(), Date.parse(previous) + 1)).toISOString(); }
