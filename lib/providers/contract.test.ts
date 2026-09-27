import { describe, expect, it } from 'vitest';
import { performLookup } from '../lookup';
import type { Evidence, ProviderAdapter } from './types';

class FixtureAdapter implements ProviderAdapter {
  readonly name: string;
  constructor(name: string, private readonly evidence: Omit<Evidence, 'provider'>) {
    this.name = name;
  }
  supports() { return true; }
  async lookup() { return { ...this.evidence, provider: this.name }; }
}

const base = {
  confidence: 0.9,
  observedAt: null,
  fetchedAt: new Date(0).toISOString(),
  reasonCodes: ['KNOWN_MALICIOUS'],
  submissionOccurred: false as const,
};

describe('provider contract', () => {
  it('aggregates independent existing-lookup evidence without submission', async () => {
    const result = await performLookup('example.com', [
      new FixtureAdapter('one', { ...base, verdict: 'malicious' }),
      new FixtureAdapter('two', { ...base, verdict: 'suspicious' }),
    ]);
    expect(result).toMatchObject({
      verdict: 'high-risk',
      confidence: 'high',
      policy: { existingLookupOnly: true, submissionOccurred: false },
    });
  });
});