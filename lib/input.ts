export type IndicatorType = 'url' | 'domain' | 'ipv4' | 'ipv6' | 'hash' | 'unknown';
export type SmartInputType = IndicatorType | 'message' | 'email-header';

export type ClassifiedInput = {
  type: SmartInputType;
  label: string;
  endpoint: 'lookup' | 'message' | 'email-header' | null;
  normalized?: string;
};

function looksLikeEmailHeader(value: string) {
  const headerNames = value.match(/^(?:from|to|subject|date|message-id|received|reply-to|return-path|authentication-results):/gim) ?? [];
  return headerNames.length >= 2
    || (/^authentication-results:/im.test(value) && /^(?:from|received):/im.test(value));
}

export function cleanHashCandidate(raw: string): string | null {
  let trimmed = raw.trim();
  // Strip outer quotes or brackets if wrapped as a pair
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  } else if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('<') && trimmed.endsWith('>')) || (trimmed.startsWith('(') && trimmed.endsWith(')'))) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  // Strip common label prefixes like "sha256:", "sha-256:", "md5:", "sha1:", "hash:", "sha256="
  const stripped = trimmed.replace(/^(?:sha-?256|sha-?1|md5|hash|sample|ioc)[\s:=_-]+/i, '').trim();
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(stripped)) {
    return stripped.toLowerCase();
  }
  return null;
}

export function cleanDefang(raw: string): string {
  let val = raw.trim();
  // Strip outer quotes or angle brackets if wrapped as a pair
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1).trim();
  } else if (val.startsWith('<') && val.endsWith('>')) {
    val = val.slice(1, -1).trim();
  }
  // Replace hxxp:// or hxxps:// with http:// or https://
  val = val.replace(/^hxxp(s?):\/\//i, 'http$1://');
  // Replace [.] with .
  val = val.replace(/\[\.\]/g, '.');
  // Replace [:] with : (e.g. hxxp[:]//)
  val = val.replace(/\[:\]/g, ':');
  return val;
}

export function classifyInput(raw: string): { type: IndicatorType; label: string; normalized?: string } {
  const value = raw.trim();
  if (!value) return { type: 'unknown', label: 'belum ada input' };

  // 1. Hash detection (supports raw hex, labeled hex like "SHA256: ...", quoted, etc.)
  const hashCandidate = cleanHashCandidate(value);
  if (hashCandidate) {
    return { type: 'hash', label: 'Hash', normalized: hashCandidate };
  }

  // 2. De-fang candidate for URL, IP, domain
  const defanged = cleanDefang(value);

  if (/^https?:\/\//i.test(defanged)) {
    return { type: 'url', label: 'URL', normalized: defanged };
  }
  if (/^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(defanged)) {
    return { type: 'hash', label: 'Hash', normalized: defanged.toLowerCase() };
  }
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(defanged)) {
    return { type: 'ipv4', label: 'IPv4', normalized: defanged };
  }
  if (defanged.includes(':') && !/\s/.test(defanged)) {
    return { type: 'ipv6', label: 'IPv6', normalized: defanged };
  }
  if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(defanged)) {
    return { type: 'domain', label: 'Domain', normalized: defanged.toLowerCase() };
  }
  return { type: 'unknown', label: 'belum dikenali' };
}

export function classifySmartInput(raw: string): ClassifiedInput {
  const value = raw.trim();
  if (!value) return { type: 'unknown', label: 'belum ada input', endpoint: null };
  if (looksLikeEmailHeader(value)) {
    return { type: 'email-header', label: 'Header email', endpoint: 'email-header' };
  }

  // Check direct indicator (with hash/defang sanitization)
  const indicator = classifyInput(value);
  if (indicator.type !== 'unknown') {
    return { ...indicator, endpoint: 'lookup' };
  }

  // Check if text is a short line containing an isolated hash (e.g., copied from MalwareBazaar)
  const hashMatch = value.match(/\b([a-f0-9]{64}|[a-f0-9]{40}|[a-f0-9]{32})\b/i);
  if (hashMatch && value.length <= 150 && /^(?:hash|sha-?256|sha-?1|md5|sample|malware|ioc|file)[\s:=_-]*/i.test(value)) {
    return { type: 'hash', label: 'Hash', endpoint: 'lookup', normalized: hashMatch[1].toLowerCase() };
  }

  if (value.includes('\n') || value.length >= 40 || /\s/.test(value)) {
    return { type: 'message', label: 'Pesan', endpoint: 'message' };
  }
  return { type: 'unknown', label: 'belum dikenali', endpoint: null };
}