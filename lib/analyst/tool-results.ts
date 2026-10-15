export type PatternResult = { risk: number; verdict: string; reasonCodes: string[]; actions: string[]; requestId: string; authentication?: Record<string, string> };
export function readPatternResult(value: unknown): PatternResult {
  if (!value || typeof value !== 'object') throw new Error('Respons analisis tidak valid.');
  const r = value as Record<string, unknown>;
  if (typeof r.risk !== 'number' || !Number.isFinite(r.risk) || r.risk < 0 || r.risk > 100 || !['high-risk', 'suspicious', 'needs-review', 'low-signal'].includes(String(r.verdict))) throw new Error('Respons analisis tidak valid.');
  if (!Array.isArray(r.reasonCodes) || r.reasonCodes.length > 50 || !r.reasonCodes.every((s) => typeof s === 'string' && s.length < 200) || typeof r.requestId !== 'string' || r.requestId.length > 128) throw new Error('Respons analisis tidak valid.');
  const authentication = r.authentication && typeof r.authentication === 'object' && !Array.isArray(r.authentication) ? Object.fromEntries(Object.entries(r.authentication).filter(([key, val]) => ['spf', 'dkim', 'dmarc'].includes(key) && typeof val === 'string' && val.length < 30)) as Record<string, string> : undefined;
  return { risk: r.risk, verdict: String(r.verdict), requestId: r.requestId, reasonCodes: r.reasonCodes as string[], actions: Array.isArray(r.actions) ? r.actions.filter((s): s is string => typeof s === 'string' && s.length < 1000).slice(0, 10) : [], authentication };
}
export const MAX_LOCAL_FILE = 25 * 1024 * 1024;
export const MAX_QR_FILE = 10 * 1024 * 1024;
