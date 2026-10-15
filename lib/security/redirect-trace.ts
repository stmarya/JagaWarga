import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { assertPublicIp } from './network';
import { normalizeIndicator } from '@/lib/analyst/indicators';
export type TraceHop = { url: string; status: number };
export type RedirectTrace = { originalUrl: string; finalUrl: string | null; completed: boolean; stopReason: string; hops: TraceHop[] };
export function validateTraceUrl(raw: string) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw)) throw new Error('URL_NOT_ALLOWED');
  const input = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const normalized = normalizeIndicator(input); if (normalized.type !== 'url') throw new Error('URL_NOT_ALLOWED');
  const url = new URL(normalized.value); if (url.href.length > 2048) throw new Error('URL_TOO_LONG'); if (url.port) throw new Error('CUSTOM_PORT_NOT_ALLOWED');
  return url;
}
/** Pin DNS addresses into a fresh no-agent HEAD connection; never fetch response bodies. */
export async function requestTraceHop(url: URL, signal: AbortSignal): Promise<{ status: number; location?: string }> {
  signal.throwIfAborted(); const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await new Promise<LookupAddress[]>((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(new Error('TRACE_ABORTED')); };
    signal.addEventListener('abort', abort, { once: true });
    lookup(host, { all: true, verbatim: true }).then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
  signal.throwIfAborted(); if (!addresses.length) throw new Error('DNS_EMPTY');
  const pinned = addresses.map((a) => ({ ...a, address: assertPublicIp(a.address) }))[0];
  return new Promise((resolve, reject) => {
    const pinnedLookup = (_host: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => options.all ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family);
    const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = request(url, { method: 'HEAD', agent: false, maxHeaderSize: 16384, lookup: pinnedLookup as never,
      ...(url.protocol === 'https:' && !isIP(host) ? { servername: host } : {}), signal,
      headers: { 'User-Agent': 'JagaWarga-RedirectTrace/1.0', Accept: '*/*' } }, (res) => {
      const status = res.statusCode ?? 0; const location = res.headers.location;
      res.destroy(); resolve({ status, ...(location ? { location } : {}) });
    });
    req.setTimeout(3000, () => req.destroy(new Error('TRACE_TIMEOUT'))); req.on('error', reject); req.end();
  });
}
export async function traceRedirects(raw: string, signal: AbortSignal, hop = requestTraceHop): Promise<RedirectTrace> {
  const first = validateTraceUrl(raw).href; let current = first; const visited = new Set<string>(); const hops: TraceHop[] = [];
  for (let i = 0; i < 6; i += 1) {
    signal.throwIfAborted(); const url = validateTraceUrl(current);
    if (visited.has(url.href)) return { originalUrl: first, finalUrl: null, completed: false, stopReason: 'REDIRECT_LOOP', hops };
    visited.add(url.href); const response = await hop(url, signal); hops.push({ url: url.href, status: response.status });
    if ([301, 302, 303, 307, 308].includes(response.status) && response.location) { current = validateTraceUrl(new URL(response.location, url).href).href; continue; }
    const completed = response.status >= 200 && response.status < 300;
    return { originalUrl: first, finalUrl: completed ? url.href : null, completed, stopReason: completed ? 'HEAD_COMPLETE' : 'HTTP_NOT_COMPLETE', hops };
  }
  return { originalUrl: first, finalUrl: null, completed: false, stopReason: 'HOP_LIMIT', hops };
}
