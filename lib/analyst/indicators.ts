import { classifyInput } from '../input';
import { assertPublicIp } from '../security/network';

export const MAX_BATCH = 20;
export const MAX_INPUT_BYTES = 64 * 1024;
const sensitive = /^(token|key|api_?key|code|auth|password|passwd|session|sid|jwt|access_?token)$/i;

/** Browser-safe normalization. The API still performs authoritative validation. */
export function normalizeIndicator(raw: string): { type: string; value: string } {
  if (raw.length > 2048) throw new Error('Indikator terlalu panjang.');
  const input = classifyInput(raw);
  let value = input.normalized ?? raw.trim();
  if (input.type === 'unknown') throw new Error('Format indikator tidak dikenali.');
  if (input.type === 'url') {
    const url = new URL(value);
    if (url.username || url.password) throw new Error('URL dengan kredensial tidak diperbolehkan.');
    for (const key of url.searchParams.keys()) {
      if (sensitive.test(key)) throw new Error('Hapus parameter rahasia dari URL sebelum lookup.');
    }
    url.hash = '';
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host.includes(':') || /^\d+(?:\.\d+){3}$/.test(host)) assertPublicIp(host);
    else if (!host.includes('.') || host === 'localhost') throw new Error('Domain tidak valid.');
    value = url.toString();
  } else if (input.type === 'ipv4' || input.type === 'ipv6') {
    value = assertPublicIp(value);
  } else if (input.type === 'domain') {
    value = value.replace(/\.$/, '').toLowerCase();
  }
  return { type: input.type, value };
}

export type PreviewItem = { value: string; type: string; error?: string };

/** CSV is deliberately one column: indicator. Quote values containing commas. */
export function parseBatch(text: string, csv = false): PreviewItem[] {
  if (new TextEncoder().encode(text).length > MAX_INPUT_BYTES) throw new Error('Input maksimal 64 KB.');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (csv && /^indicator$/i.test(lines[0] ?? '')) lines.shift();
  if (lines.length > MAX_BATCH) throw new Error(`Maksimal ${MAX_BATCH} baris per batch.`);
  const seen = new Set<string>();
  return lines.flatMap((line) => {
    let value = line;
    if (csv) {
      if (line.startsWith('"') && /^"(?:[^"]|"")*"$/.test(line)) value = line.slice(1, -1).replace(/""/g, '"');
      else if (line.includes(',') || line.includes('"')) return [{ value: 'Baris CSV tidak valid', type: 'unknown', error: 'Gunakan CSV satu kolom; quote nilai dengan koma.' }];
    }
    try {
      const indicator = normalizeIndicator(value);
      if (seen.has(indicator.value)) return [];
      seen.add(indicator.value);
      return [indicator];
    } catch (error) {
      // Do not retain invalid raw input: it might contain a password or token.
      return [{ value: 'Input ditolak', type: 'unknown', error: error instanceof Error ? error.message : 'Input tidak valid.' }];
    }
  });
}