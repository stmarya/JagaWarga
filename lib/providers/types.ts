import type { CanonicalIndicator } from '../security/canonicalize';

export type EvidenceVerdict = 'malicious' | 'suspicious' | 'benign' | 'unknown';

export type Evidence = {
  provider: string;
  verdict: EvidenceVerdict;
  confidence: number;
  observedAt: string | null;
  fetchedAt: string;
  reasonCodes: string[];
  sourceUrl?: string;
  details?: Record<string, unknown>;
  submissionOccurred: false;
};

export interface ProviderAdapter {
  readonly name: string;
  supports(type: CanonicalIndicator['type']): boolean;
  lookup(indicator: CanonicalIndicator, signal: AbortSignal): Promise<Evidence>;
}

export class ExistingLookupOnlyAdapter implements ProviderAdapter {
  readonly name = 'existing-lookup-placeholder';
  supports(): boolean { return true; }
  async lookup(): Promise<Evidence> {
    return {
      provider: this.name,
      verdict: 'unknown',
      confidence: 0,
      observedAt: null,
      fetchedAt: new Date().toISOString(),
      reasonCodes: ['NO_PROVIDER_CONFIGURED'],
      submissionOccurred: false,
    };
  }
}