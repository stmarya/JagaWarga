import { createHash } from 'node:crypto';
import type { CanonicalIndicator } from '../security/canonicalize';
import { safeFetchJson } from '../security/safe-fetch';
import type { Evidence, EvidenceVerdict, ProviderAdapter } from './types';

const exhaustedKeys = new Map<string, number>();
let nextKeyCursor = 0;

type Stats = {
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  timeout?: number;
};

type VirusTotalResponse = {
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      last_analysis_stats?: Stats;
      last_analysis_date?: number;
      last_analysis_results?: Record<string, {
        category?: string;
        engine_name?: string;
        engine_version?: string | null;
        result?: string | null;
        method?: string;
        engine_update?: string;
      }>;
      reputation?: number;
      total_votes?: { harmless?: number; malicious?: number };
      tags?: string[];
      categories?: Record<string, string>;
      names?: string[];
      meaningful_name?: string;
      type_description?: string;
      size?: number;
      first_submission_date?: number;
      last_submission_date?: number;
      times_submitted?: number;
      creation_date?: number;
      registrar?: string;
      country?: string;
      as_owner?: string;
      network?: string;
      last_https_certificate_date?: number;
      [key: string]: unknown;
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

function nextUtcDay() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}

function keyId(apiKey: string) {
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 16);
}

function keyPool(value: string | string[]) {
  const keys = (Array.isArray(value) ? value : [value])
    .flatMap((key) => key.split(/[\r\n,]+/))
    .map((key) => key.trim())
    .filter(Boolean);
  return [...new Set(keys)];
}

function resource(indicator: CanonicalIndicator) {
  if (indicator.type === 'url') return { api: `urls/${urlId(indicator.value)}`, gui: `url/${urlId(indicator.value)}` };
  if (indicator.type === 'domain') return { api: `domains/${encodeURIComponent(indicator.value)}`, gui: `domain/${encodeURIComponent(indicator.value)}` };
  if (indicator.type === 'hash') return { api: `files/${indicator.value}`, gui: `file/${indicator.value}` };
  return { api: `ip_addresses/${encodeURIComponent(indicator.value)}`, gui: `ip-address/${encodeURIComponent(indicator.value)}` };
}

function normalize(
  stats: Stats,
  attributes?: VirusTotalResponse['data'] extends { attributes?: infer A } ? A : Record<string, unknown>,
): { verdict: EvidenceVerdict; confidence: number; reasons: string[] } {
  const malicious = Math.max(0, stats.malicious ?? 0);
  const suspicious = Math.max(0, stats.suspicious ?? 0);
  const harmless = Math.max(0, stats.harmless ?? 0);
  const undetected = Math.max(0, stats.undetected ?? 0);
  const total = malicious + suspicious + harmless + undetected + Math.max(0, stats.timeout ?? 0);
  const ratio = total ? malicious / total : 0;

  // Check popularity and reputation to filter false-positives on globally recognized domains
  const popRanks = ((attributes as Record<string, unknown> | undefined)?.popularity_ranks ?? {}) as Record<string, { rank?: number }>;
  const rankValues = Object.values(popRanks).map((r) => r?.rank).filter((r): r is number => typeof r === 'number' && r > 0);
  const bestRank = rankValues.length ? Math.min(...rankValues) : Infinity;
  const isTopRanked = Number.isFinite(bestRank) && bestRank <= 100_000;
  const reputation = (attributes as { reputation?: number } | undefined)?.reputation ?? 0;
  const isHighReputation = reputation >= 50 || isTopRanked;

  // Case A: Highly reputable or top-ranked domain with isolated false flags (e.g. 1-2 engines out of 60+ harmless)
  if (isHighReputation && harmless >= 15 && malicious <= 3 && ratio < 0.05) {
    return {
      verdict: 'benign',
      confidence: 0.9,
      reasons: ['VT_POPULAR_TRUSTED_DOMAIN', 'VT_NO_NEGATIVE_DETECTIONS'],
    };
  }

  // Case B: High threshold for declaring "malicious":
  // In large scanner pools (total >= 40), 2 flags can easily be false positives.
  // We require either malicious >= 4, or (malicious >= 3 with ratio >= 0.05), or ratio >= 0.08.
  // For small engine pools (total < 40), malicious >= 2 is sufficient.
  const isConfirmedMalicious = total >= 40
    ? (malicious >= 4 || (malicious >= 3 && ratio >= 0.05) || ratio >= 0.08)
    : (malicious >= 2 || ratio >= 0.05);

  if (isConfirmedMalicious) {
    return {
      verdict: 'malicious',
      confidence: Math.min(0.98, 0.8 + ratio),
      reasons: ['VT_MULTIPLE_MALICIOUS_DETECTIONS'],
    };
  }

  // Case C: Suspicious / low flag count (1 to 3 detections or suspicious flags)
  if (malicious > 0 || suspicious > 0) {
    return {
      verdict: 'suspicious',
      confidence: 0.6,
      reasons: [malicious ? 'VT_FEW_MALICIOUS_DETECTIONS' : 'VT_SUSPICIOUS_DETECTION'],
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
  private readonly apiKeys: string[];

  constructor(
    apiKeys: string | string[],
    private readonly fetcher: Fetcher = (url, signal, key) => safeFetchJson<VirusTotalResponse>(
      url,
      signal,
      { accept: 'application/json', headers: { 'x-apikey': key } },
    ),
  ) {
    this.apiKeys = keyPool(apiKeys);
    if (!this.apiKeys.length) throw new Error('VIRUSTOTAL_API_KEY_REQUIRED');
  }

  supports(type: CanonicalIndicator['type']) {
    return ['url', 'domain', 'ipv4', 'ipv6', 'hash'].includes(type);
  }

  async lookup(indicator: CanonicalIndicator, signal: AbortSignal): Promise<Evidence> {
    const path = resource(indicator);
    const fetchedAt = new Date().toISOString();
    let lastError: unknown;
    for (let offset = 0; offset < this.apiKeys.length; offset += 1) {
      const index = (nextKeyCursor + offset) % this.apiKeys.length;
      const apiKey = this.apiKeys[index];
      const id = keyId(apiKey);
      const exhaustedUntil = exhaustedKeys.get(id) ?? 0;
      if (exhaustedUntil > Date.now()) continue;
      try {
        const response = await this.fetcher(`https://www.virustotal.com/api/v3/${path.api}`, signal, apiKey);
        nextKeyCursor = (index + 1) % this.apiKeys.length;
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
          details: {
            resourceId: response.data?.id ?? null,
            resourceType: response.data?.type ?? null,
            attributes: attributes ?? {},
          },
          submissionOccurred: false,
        };
      }
      const result = normalize(attributes.last_analysis_stats, attributes);
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
        details: {
          resourceId: response.data?.id ?? null,
          resourceType: response.data?.type ?? null,
          attributes,
        },
        submissionOccurred: false,
      };
      } catch (error) {
        lastError = error;
        if (error instanceof Error && error.message === 'PROVIDER_HTTP_429') {
          exhaustedKeys.set(id, nextUtcDay());
          continue;
        }
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
    throw lastError ?? new Error('PROVIDER_HTTP_429');
  }
}