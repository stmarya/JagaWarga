import type { CanonicalIndicator } from '../security/canonicalize';
import { safeFetchJson } from '../security/safe-fetch';
import type { Evidence, ProviderAdapter } from './types';

type DnsJson = { Status?: number; Answer?: Array<{ data?: string; type?: number }> };
type Fetcher = (url: string, signal?: AbortSignal) => Promise<DnsJson>;

function hostname(indicator: CanonicalIndicator): string {
  return indicator.type === 'url' ? new URL(indicator.value).hostname : indicator.value;
}

abstract class DnsAdapter implements ProviderAdapter {
  abstract readonly name: string;
  abstract endpoint(name: string): string;
  constructor(
    private readonly fetcher: Fetcher = (url, signal) => safeFetchJson<DnsJson>(url, signal),
  ) {}
  supports(type: CanonicalIndicator['type']): boolean {
    return type === 'domain' || type === 'url';
  }
  async lookup(indicator: CanonicalIndicator, signal: AbortSignal): Promise<Evidence> {
    const result = await this.fetcher(this.endpoint(hostname(indicator)), signal);
    const resolves = result.Status === 0 && Boolean(result.Answer?.length);
    return {
      provider: this.name,
      verdict: 'unknown',
      confidence: resolves ? 0.4 : 0.2,
      observedAt: null,
      fetchedAt: new Date().toISOString(),
      reasonCodes: [resolves ? 'DNS_RESOLVES' : 'DNS_NO_ANSWER'],
      submissionOccurred: false,
    };
  }
}

export class CloudflareDnsAdapter extends DnsAdapter {
  readonly name = 'cloudflare-dns';
  endpoint(name: string) {
    return `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=A`;
  }
}

export class GoogleDnsAdapter extends DnsAdapter {
  readonly name = 'google-dns';
  endpoint(name: string) {
    return `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=A`;
  }
}