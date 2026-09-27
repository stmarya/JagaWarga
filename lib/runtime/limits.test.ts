import { describe, expect, it } from 'vitest';
import { consumeBudget } from './budget';
import { rateLimit } from './rate-limit';

describe('abuse and budget controls', () => {
  it('blocks after the request limit', () => {
    const key = `test-${crypto.randomUUID()}`;
    expect(rateLimit(key, 2).allowed).toBe(true);
    expect(rateLimit(key, 2).allowed).toBe(true);
    expect(rateLimit(key, 2).allowed).toBe(false);
  });

  it('blocks after the provider budget', () => {
    const provider = `test-${crypto.randomUUID()}`;
    expect(consumeBudget(provider, 1)).toBe(true);
    expect(consumeBudget(provider, 1)).toBe(false);
  });
});