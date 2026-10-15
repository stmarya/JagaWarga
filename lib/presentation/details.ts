import { readSnapshot, type LookupSnapshot } from '@/lib/analyst/snapshot';
import type { DisplayResult, ResultEvidence } from './result';
export type DetailEvidence = ResultEvidence & { verdict: string; confidence: number; observedAt: string | null; details?: Record<string, unknown> };
export type DetailResult = Omit<DisplayResult, 'indicator' | 'evidence'> & { indicator: { type: string; displayValue: string }; evidence: DetailEvidence[]; conflictingEvidence: boolean };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Data tidak valid.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 2048) { if (typeof value !== 'string' || value.length > max) throw new Error('Teks tidak valid.'); return value; }
function time(value: unknown) { const s = text(value, 40); if (!Number.isFinite(Date.parse(s))) throw new Error('Waktu tidak valid.'); return s; }
function number(value: unknown, max: number) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new Error('Angka tidak valid.'); return value; }
/** Guard stored/remote shapes before rendering. Retain private metadata only in memory. */
export function readDetailResult(value: unknown): DetailResult {
  const raw = object(value); const indicator = object(raw.indicator);
  if (!['url', 'domain', 'ipv4', 'ipv6', 'hash'].includes(String(indicator.type))) throw new Error('Bukan hasil IoC.');
  if (!['high-risk', 'suspicious', 'no-indication', 'insufficient-data'].includes(String(raw.verdict))) throw new Error('Verdict tidak valid.');
  if (!['low', 'medium', 'high'].includes(String(raw.confidence))) throw new Error('Confidence tidak valid.');
  if (!Array.isArray(raw.evidence) || raw.evidence.length > 20) throw new Error('Bukti tidak valid.');
  const evidence = raw.evidence.map((value) => {
    const e = object(value);
    if (!['malicious', 'suspicious', 'benign', 'unknown'].includes(String(e.verdict))) throw new Error('Verdict sumber tidak valid.');
    if (!Array.isArray(e.reasonCodes) || e.reasonCodes.length > 50) throw new Error('Reason codes tidak valid.');
    return { provider: text(e.provider, 100), verdict: text(e.verdict, 50), confidence: number(e.confidence, 1),
      observedAt: e.observedAt == null ? null : time(e.observedAt), fetchedAt: time(e.fetchedAt), reasonCodes: e.reasonCodes.map((code) => text(code, 100)),
      freshness: ['fresh', 'stale', 'unknown'].includes(String(e.freshness)) ? String(e.freshness) : 'unknown',
      ...(e.details && typeof e.details === 'object' && !Array.isArray(e.details) ? { details: e.details as Record<string, unknown> } : {}),
    };
  });
  let coverage: DetailResult['coverage'];
  if (raw.coverage) { const c = object(raw.coverage); coverage = { requested: number(c.requested, 20), assessed: number(c.assessed, 20), failed: number(c.failed, 20) }; }
  return { indicator: { type: text(indicator.type, 30), displayValue: text(indicator.displayValue) }, risk: number(raw.risk, 100), verdict: text(raw.verdict, 50),
    confidence: text(raw.confidence, 30), checkedAt: time(raw.checkedAt), requestId: text(raw.requestId, 128), evidence, coverage,
    scoringVersion: typeof raw.scoringVersion === 'string' ? text(raw.scoringVersion, 100) : undefined,
    partial: raw.partial === true || Boolean(coverage?.failed), conflictingEvidence: raw.conflictingEvidence === true,
  };
}
export function normalizedDetailExport(result: DetailResult): LookupSnapshot | null { try { return readSnapshot(result); } catch { return null; } }
export function providerAttributes(evidence: DetailEvidence) {
  const raw = evidence.details?.attributes;
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
}
export function engineRows(attributes: Record<string, unknown>) {
  const results = attributes.last_analysis_results;
  if (!results || typeof results !== 'object' || Array.isArray(results)) return [];
  return Object.values(results).filter((v): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v)).slice(0, 2000);
}
export function displayTechnical(value: unknown): string {
  if (value == null || value === '') return 'Tidak tersedia';
  const s = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  return s.length > 30000 ? `${s.slice(0, 30000)}\n… tampilan dibatasi 30.000 karakter` : s;
}
