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

  it('retries one transient provider failure and then succeeds', async () => {
    let attempts = 0;
    const adapter: ProviderAdapter = {
      name: `retry-${crypto.randomUUID()}`,
      supports: () => true,
      lookup: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('PROVIDER_TIMEOUT');
        return { ...base, provider: 'retry-fixture', verdict: 'benign' };
      },
    };
    const result = await performLookup(`retry-${crypto.randomUUID()}.example`, [adapter]);
    expect(attempts).toBe(2);
    expect(result.partial).toBe(false);
  });

  it('degrades to partial evidence after retryable failures are exhausted', async () => {
    let attempts = 0;
    const adapter: ProviderAdapter = {
      name: `failure-${crypto.randomUUID()}`,
      supports: () => true,
      lookup: async () => {
        attempts += 1;
        throw new Error('PROVIDER_TIMEOUT');
      },
    };
    const result = await performLookup(`failure-${crypto.randomUUID()}.example`, [adapter]);
    expect(attempts).toBe(2);
    expect(result).toMatchObject({
      verdict: 'insufficient-data',
      partial: true,
      providers: { succeeded: [], failed: [adapter.name] },
    });
  });

  it('coalesces concurrent identical lookups within a process', async () => {
    let calls = 0;
    const adapter: ProviderAdapter = {
      name: `coalesce-${crypto.randomUUID()}`,
      supports: () => true,
      lookup: async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return { ...base, provider: 'coalesce-fixture', verdict: 'benign' };
      },
    };
    const indicator = `coalesce-${crypto.randomUUID()}.example`;
    const [first, second] = await Promise.all([
      performLookup(indicator, [adapter]),
      performLookup(indicator, [adapter]),
    ]);
    expect(calls).toBe(1);
    expect([first.coalesced, second.coalesced].sort()).toEqual([false, true]);
  });
});