import { domainToASCII } from 'node:url';
import { classifyInput, IndicatorType } from '../input';
import { assertPublicIp } from './network';

export type CanonicalIndicator = {
  type: Exclude<IndicatorType, 'unknown'>;
  value: string;
  displayValue: string;
};

const SENSITIVE_QUERY_KEYS = /^(token|key|api_?key|code|auth|password|passwd|session|sid|jwt|access_?token)$/i;

function canonicalDomain(raw: string): string {
  const value = raw.replace(/\.$/, '').toLowerCase();
  const ascii = domainToASCII(value);
  if (!ascii || ascii.length > 253 || ascii === 'localhost' || !ascii.includes('.')) {
    throw new Error('DOMAIN_INVALID');
  }
  return ascii;
}

function redactUrl(url: URL): string {
  const safe = new URL(url.toString());
  safe.username = '';
  safe.password = '';
  safe.hash = '';
  for (const key of [...safe.searchParams.keys()]) {
    if (SENSITIVE_QUERY_KEYS.test(key)) safe.searchParams.set(key, '[REDACTED]');
  }
  return safe.toString();
}

export function canonicalizeIndicator(raw: string): CanonicalIndicator {
  const detected = classifyInput(raw);
  if (detected.type === 'unknown') throw new Error('INDICATOR_UNSUPPORTED');

  if (detected.type === 'url') {
    const parsed = new URL(raw.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL_PROTOCOL_UNSUPPORTED');
    if (parsed.username || parsed.password) throw new Error('URL_CREDENTIALS_NOT_ALLOWED');
    const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
    if (hostname.includes(':') || /^\d+(?:\.\d+){3}$/.test(hostname)) {
      assertPublicIp(hostname);
    } else {
      parsed.hostname = canonicalDomain(hostname);
    }
    parsed.hash = '';
    return { type: 'url', value: parsed.toString(), displayValue: redactUrl(parsed) };
  }

  if (detected.type === 'domain') {
    const value = canonicalDomain(raw.trim());
    return { type: 'domain', value, displayValue: value };
  }

  if (detected.type === 'ipv4' || detected.type === 'ipv6') {
    const value = assertPublicIp(raw.trim());
    return { type: detected.type, value, displayValue: value };
  }

  const value = raw.trim().toLowerCase();
  return { type: 'hash', value, displayValue: value };
}