export type IndicatorType = 'url' | 'domain' | 'ipv4' | 'ipv6' | 'hash' | 'unknown';

export function classifyInput(raw: string): { type: IndicatorType; label: string } {
  const value = raw.trim();
  if (!value) return { type: 'unknown', label: 'belum ada input' };
  if (/^https?:\/\//i.test(value)) return { type: 'url', label: 'URL' };
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(value)) return { type: 'hash', label: 'Hash' };
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return { type: 'ipv4', label: 'IPv4' };
  if (value.includes(':')) return { type: 'ipv6', label: 'IPv6' };
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)) {
    return { type: 'domain', label: 'Domain' };
  }
  return { type: 'unknown', label: 'belum dikenali' };
}
