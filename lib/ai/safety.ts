import type { AiContext, AiMessage, AiReply } from './types';

const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 1_600;
const MAX_TOTAL_LENGTH = 8_000;

export function redactSensitive(value: string) {
  return value
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[nomor kartu disamarkan]')
    .replace(/\b(otp|pin|password|kata sandi|cvv|token)\s*[:=-]?\s*[a-z0-9!@#$%^&*._-]{4,}\b/gi, '$1 [data rahasia disamarkan]')
    .replace(/\bBearer\s+[a-z0-9._~-]+\b/gi, 'Bearer [token disamarkan]')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[token/hash panjang disamarkan]');
}

function safeString(value: unknown, max = 300) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeStrings(value: unknown, limit = 8, max = 300) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').slice(0, limit).map((item) => redactSensitive(item.trim().slice(0, max)));
}

export function validateMessages(value: unknown): AiMessage[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_MESSAGES) throw new Error('INVALID_MESSAGES');
  let total = 0;
  const messages = value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('INVALID_MESSAGES');
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') throw new Error('INVALID_MESSAGES');
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) throw new Error('INVALID_MESSAGES');
    total += trimmed.length;
    return { role, content: redactSensitive(trimmed) } as AiMessage;
  });
  if (total > MAX_TOTAL_LENGTH || messages.at(-1)?.role !== 'user') throw new Error('INVALID_MESSAGES');
  return messages;
}

export function normalizeContext(value: unknown): AiContext {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const pathname = safeString(raw.pathname, 120) || '/';
  const source = raw.lastResult && typeof raw.lastResult === 'object' ? raw.lastResult as Record<string, unknown> : null;
  if (!source) return { pathname, lastResult: null };
  const indicatorRaw = source.indicator && typeof source.indicator === 'object' ? source.indicator as Record<string, unknown> : null;
  const risk = Math.max(0, Math.min(100, Number(source.risk) || 0));
  const evidence = Array.isArray(source.evidence) ? source.evidence.slice(0, 8).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const details = row.details && typeof row.details === 'object' ? row.details as Record<string, unknown> : {};
    const attributes = details.attributes && typeof details.attributes === 'object' ? details.attributes as Record<string, unknown> : {};
    const statsRaw = attributes.last_analysis_stats && typeof attributes.last_analysis_stats === 'object'
      ? attributes.last_analysis_stats as Record<string, unknown>
      : {};
    const stats = Object.fromEntries(Object.entries(statsRaw).slice(0, 10).map(([key, amount]) => [key.slice(0, 40), Math.max(0, Number(amount) || 0)]));
    return [{
      provider: safeString(row.provider, 60) || 'unknown',
      verdict: safeString(row.verdict, 60) || undefined,
      confidence: typeof row.confidence === 'number' ? Math.max(0, Math.min(1, row.confidence)) : undefined,
      reasonCodes: safeStrings(row.reasonCodes, 12, 80),
      stats,
    }];
  }) : [];
  return {
    pathname,
    lastResult: {
      indicator: indicatorRaw ? {
        type: safeString(indicatorRaw.type, 30),
        displayValue: redactSensitive(safeString(indicatorRaw.displayValue, 500)),
      } : undefined,
      risk,
      verdict: safeString(source.verdict, 60),
      confidence: safeString(source.confidence, 30) || undefined,
      checkedAt: safeString(source.checkedAt, 60) || undefined,
      partial: Boolean(source.partial),
      reasonCodes: safeStrings(source.reasonCodes, 20, 80),
      actions: safeStrings(source.actions, 10, 300),
      evidence,
    },
  };
}

export function safeReply(value: unknown): AiReply | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const intent = ['result', 'emergency', 'education', 'tool', 'general'].includes(String(raw.intent)) ? raw.intent as AiReply['intent'] : 'general';
  const tone = ['neutral', 'danger', 'warning', 'safe'].includes(String(raw.tone)) ? raw.tone as AiReply['tone'] : 'neutral';
  const links = Array.isArray(raw.links) ? raw.links.slice(0, 4).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const label = safeString(row.label, 80);
    const href = safeString(row.href, 300);
    const allowed = href.startsWith('/') || ['https://aduankonten.id/', 'https://patrolisiber.id/', 'https://iasc.ojk.go.id/', 'https://cekrekening.id/'].includes(href);
    return label && allowed ? [{ label, href }] : [];
  }) : [];
  return {
    intent,
    status: safeString(raw.status, 80) || 'Panduan JagaWarga',
    tone,
    summary: safeString(raw.summary, 700) || 'Saya belum dapat merangkum jawaban dengan aman.',
    why: safeStrings(raw.why, 5, 300),
    actions: safeStrings(raw.actions, 7, 350),
    avoid: safeStrings(raw.avoid, 5, 300),
    escalation: safeStrings(raw.escalation, 5, 350),
    sources: [],
    links,
    followUp: safeString(raw.followUp, 250) || undefined,
  };
}