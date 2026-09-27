import type { CanonicalIndicator } from '../security/canonicalize';
import { safeFetchJson } from '../security/safe-fetch';
import type { Evidence, EvidenceVerdict, ProviderAdapter } from './types';

type Stats = {
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  timeout?: number;
};

type VirusTotalResponse = {
  data?: {
    attributes?: {
      last_analysis_stats?: Stats;
      last_analysis_date?: number;
    };
  };
};

type Fetcher = (
  url: string,
  signal: AbortSignal,
  apiKey: string,
) => Promise<VirusTotalResponse>;

function urlId(value: string) {
  return Buffer.from(value).toString('base64url');
}

function resource(indicator: CanonicalIndicator) {
  if (indicator.type === 'url') return { api: `urls/${urlId(indicator.value)}`, gui: `url/${urlId(indicator.value)}` };
  if (indicator.type === 'domain') return { api: `domains/${encodeURIComponent(indicator.value)}`, gui: `domain/${encodeURIComponent(indicator.value)}` };
  if (indicator.type === 'hash') return { api: `files/${indicator.value}`, gui: `file/${indicator.value}` };
  return { api: `ip_addresses/${encodeURIComponent(indicator.value)}`, gui: `ip-address/${encodeURIComponent(indicator.value)}` };
}

function normalize(stats: Stats): { verdict: EvidenceVerdict; confidence: number; reasons: string[] } {
  const malicious = Math.max(0, stats.malicious ?? 0);
  const suspicious = Math.max(0, stats.suspicious ?? 0);
  const harmless = Math.max(0, stats.harmless ?? 0);
  const undetected = Math.max(0, stats.undetected ?? 0);
  const total = malicious + suspicious + harmless + undetected + Math.max(0, stats.timeout ?? 0);
  const ratio = total ? malicious / total : 0;

  if (malicious >= 2 || ratio >= 0.05) {
    return {
      verdict: 'malicious',
      confidence: Math.min(0.98, 0.8 + ratio),
      reasons: ['VT_MULTIPLE_MALICIOUS_DETECTIONS'],
    };
  }
  if (malicious === 1 || suspicious > 0) {
    return {
      verdict: 'suspicious',
      confidence: 0.65,
      reasons: [malicious ? 'VT_SINGLE_MALICIOUS_DETECTION' : 'VT_SUSPICIOUS_DETECTION'],
    };
  }
  if (harmless > 0) {
    return {
      verdict: 'benign',
      confidence: 0.55,
      reasons: ['VT_NO_NEGATIVE_DETECTIONS'],
    };
  }
  return { verdict: 'unknown', confidence: 0.1, reasons: ['VT_NO_ANALYSIS'] };
}

export class VirusTotalAdapter implements ProviderAdapter {
  readonly name = 'virustotal';

  constructor(
    private readonly apiKey: string,
    private readonly fetcher: Fetcher = (url, signal, key) => safeFetchJson<VirusTotalResponse>(
      url,
      signal,
      { accept: 'application/json', headers: { 'x-apikey': key } },
    ),
  ) {
    if (!apiKey.trim()) throw new Error('VIRUSTOTAL_API_KEY_REQUIRED');
  }

  supports(type: CanonicalIndicator['type']) {
    return ['url', 'domain', 'ipv4', 'ipv6', 'hash'].includes(type);
  }

  async lookup(indicator: CanonicalIndicator, signal: AbortSignal): Promise<Evidence> {
    const path = resource(indicator);
    const fetchedAt = new Date().toISOString();
    try {
      const response = await this.fetcher(`https://www.virustotal.com/api/v3/${path.api}`, signal, this.apiKey);
      const attributes = response.data?.attributes;
      if (!attributes?.last_analysis_stats) {
        return {
          provider: this.name,
          verdict: 'unknown',
          confidence: 0.1,
          observedAt: null,
          fetchedAt,
          reasonCodes: ['VT_NO_ANALYSIS'],
          sourceUrl: `https://www.virustotal.com/gui/${path.gui}`,
          submissionOccurred: false,
        };
      }
      const result = normalize(attributes.last_analysis_stats);
      return {
        provider: this.name,
        verdict: result.verdict,
        confidence: result.confidence,
        observedAt: attributes.last_analysis_date
          ? new Date(attributes.last_analysis_date * 1_000).toISOString()
          : null,
        fetchedAt,
        reasonCodes: result.reasons,
        sourceUrl: `https://www.virustotal.com/gui/${path.gui}`,
        submissionOccurred: false,
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'PROVIDER_HTTP_404') {
        return {
          provider: this.name,
          verdict: 'unknown',
          confidence: 0,
          observedAt: null,
          fetchedAt,
          reasonCodes: ['VT_NO_RECORD'],
          submissionOccurred: false,
        };
      }
      throw error;
    }
  }
}