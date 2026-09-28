export type IndicatorType = 'url' | 'domain' | 'ipv4' | 'ipv6' | 'hash' | 'unknown';
export type SmartInputType = IndicatorType | 'message' | 'email-header';

export type ClassifiedInput = {
  type: SmartInputType;
  label: string;
  endpoint: 'lookup' | 'message' | 'email-header' | null;
};

function looksLikeEmailHeader(value: string) {
  const headerNames = value.match(/^(?:from|to|subject|date|message-id|received|reply-to|return-path|authentication-results):/gim) ?? [];
  return headerNames.length >= 2
    || (/^authentication-results:/im.test(value) && /^(?:from|received):/im.test(value));
}

export function classifyInput(raw: string): { type: IndicatorType; label: string } {
  const value = raw.trim();
  if (!value) return { type: 'unknown', label: 'belum ada input' };
  if (/^https?:\/\//i.test(value)) return { type: 'url', label: 'URL' };
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(value)) return { type: 'hash', label: 'Hash' };
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return { type: 'ipv4', label: 'IPv4' };
  if (value.includes(':') && !/\s/.test(value)) return { type: 'ipv6', label: 'IPv6' };
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)) {
    return { type: 'domain', label: 'Domain' };
  }
  return { type: 'unknown', label: 'belum dikenali' };
}

export function classifySmartInput(raw: string): ClassifiedInput {
  const value = raw.trim();
  if (!value) return { type: 'unknown', label: 'belum ada input', endpoint: null };
  if (looksLikeEmailHeader(value)) {
    return { type: 'email-header', label: 'Header email', endpoint: 'email-header' };
  }
  const indicator = classifyInput(value);
  if (indicator.type !== 'unknown') {
    return { ...indicator, endpoint: 'lookup' };
  }
  if (value.includes('\n') || value.length >= 40 || /\s/.test(value)) {
    return { type: 'message', label: 'Pesan', endpoint: 'message' };
  }
  return { type: 'unknown', label: 'belum dikenali', endpoint: null };
}