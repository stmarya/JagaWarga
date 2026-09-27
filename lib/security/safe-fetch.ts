import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { assertPublicIp } from './network';

const ALLOWED_PROVIDER_HOSTS = new Set(['cloudflare-dns.com', 'dns.google', 'www.virustotal.com']);
const MAX_RESPONSE_BYTES = 512 * 1024;

type SafeFetchOptions = {
  accept?: string;
  headers?: Record<string, string>;
};

export function validateProviderUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || !ALLOWED_PROVIDER_HOSTS.has(url.hostname) || url.username || url.password) {
    throw new Error('PROVIDER_URL_NOT_ALLOWED');
  }
  return url;
}

export async function safeFetchJson<T>(
  raw: string,
  signal?: AbortSignal,
  options: SafeFetchOptions = {},
): Promise<T> {
  const url = validateProviderUrl(raw);
  const extraHeaders = options.headers ?? {};
  for (const [name, value] of Object.entries(extraHeaders)) {
    if (name.toLowerCase() !== 'x-apikey' || !value || value.length > 512 || /[\r\n]/.test(value)) {
      throw new Error('PROVIDER_HEADER_NOT_ALLOWED');
    }
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length) throw new Error('PROVIDER_DNS_EMPTY');
  const pinned = addresses.map((item) => ({ ...item, address: assertPublicIp(item.address) }))[0];

  return new Promise<T>((resolve, reject) => {
    const pinnedLookup = (
      _hostname: string,
      options: { all?: boolean },
      callback: (...args: unknown[]) => void,
    ) => {
      if (options.all) callback(null, [pinned]);
      else callback(null, pinned.address, pinned.family);
    };
    const req = request(
      url,
      {
        method: 'GET',
        headers: {
          Accept: options.accept ?? 'application/dns-json',
          'User-Agent': 'JagaWarga/0.11',
          ...extraHeaders,
        },
        lookup: pinnedLookup as never,
        servername: url.hostname,
      },
      (response) => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`PROVIDER_HTTP_${response.statusCode ?? 0}`));
          return;
        }
        const contentType = response.headers['content-type'] ?? '';
        if (!contentType.includes('json')) {
          response.resume();
          reject(new Error('PROVIDER_CONTENT_TYPE'));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy(new Error('PROVIDER_RESPONSE_TOO_LARGE'));
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as T);
          } catch {
            reject(new Error('PROVIDER_INVALID_JSON'));
          }
        });
      },
    );
    const abort = () => req.destroy(new Error('PROVIDER_ABORTED'));
    signal?.addEventListener('abort', abort, { once: true });
    req.setTimeout(4_000, () => req.destroy(new Error('PROVIDER_TIMEOUT')));
    req.on('error', reject);
    req.on('close', () => signal?.removeEventListener('abort', abort));
    req.end();
  });
}