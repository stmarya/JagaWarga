import { normalizeIndicator } from './indicators';

export type SnapshotEvidence = {
  provider: string; verdict: string; confidence: number;
  observedAt: string | null; fetchedAt: string; reasonCodes: string[];
  freshness?: string;
};
export type LookupSnapshot = {
  indicator: { type: string; displayValue: string };
  risk: number; verdict: string; confidence: string;
  checkedAt: string; requestId: string; scoringVersion: string;
  coverage: { requested: number; assessed: number; failed: number };
  conflictingEvidence: boolean; evidence: SnapshotEvidence[];
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Objek tidak valid.');
  return value as Record<string, unknown>;
}
export function boundedText(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length > max) throw new Error('Teks tidak valid atau terlalu panjang.');
  return value;
}
function number(value: unknown, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new Error('Angka tidak valid.');
  return value;
}
function choice(value: unknown, allowed: string[]) {
  const text = boundedText(value, 100);
  if (!allowed.includes(text)) throw new Error('Nilai tidak dikenali.');
  return text;
}
export function timestamp(value: unknown) {
  const text = boundedText(value, 40);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(text)
    || !Number.isFinite(Date.parse(text))) throw new Error('Waktu ISO dengan zona waktu wajib diisi.');
  return new Date(text).toISOString();
}

/** Allowlisted evidence export: no raw provider attributes, names, URLs, or messages. */
export function readSnapshot(value: unknown): LookupSnapshot {
  const item = object(value);
  const indicator = object(item.indicator);
  const normalized = normalizeIndicator(boundedText(indicator.displayValue, 2048));
  if (normalized.type !== indicator.type) throw new Error('Tipe indikator tidak cocok.');
  const coverage = object(item.coverage);
  if (!Array.isArray(item.evidence) || item.evidence.length > 20) throw new Error('Evidence tidak valid.');
  return {
    indicator: {
      type: choice(indicator.type, ['url', 'domain', 'ipv4', 'ipv6', 'hash']),
      displayValue: normalized.value,
    },
    risk: number(item.risk, 100),
    verdict: choice(item.verdict, ['high-risk', 'suspicious', 'no-indication', 'insufficient-data']),
    confidence: choice(item.confidence, ['low', 'medium', 'high']),
    checkedAt: timestamp(item.checkedAt),
    requestId: boundedText(item.requestId, 128),
    scoringVersion: boundedText(item.scoringVersion, 100),
    coverage: {
      requested: number(coverage.requested, 20), assessed: number(coverage.assessed, 20), failed: number(coverage.failed, 20),
    },
    conflictingEvidence: item.conflictingEvidence === true,
    evidence: item.evidence.map((raw) => {
      const evidence = object(raw);
      if (!Array.isArray(evidence.reasonCodes) || evidence.reasonCodes.length > 50) throw new Error('Reason codes tidak valid.');
      return {
        provider: boundedText(evidence.provider, 100),
        verdict: choice(evidence.verdict, ['malicious', 'suspicious', 'benign', 'unknown']),
        confidence: number(evidence.confidence, 1),
        observedAt: evidence.observedAt === null ? null : timestamp(evidence.observedAt),
        fetchedAt: timestamp(evidence.fetchedAt),
        reasonCodes: evidence.reasonCodes.map((code) => boundedText(code, 100)),
        ...(evidence.freshness ? { freshness: choice(evidence.freshness, ['fresh', 'stale', 'unknown']) } : {}),
      };
    }),
  };
}

export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}