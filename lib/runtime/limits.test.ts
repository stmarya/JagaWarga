import { describe, expect, it } from 'vitest';
import { consumeBudget } from './budget';
import { rateLimit } from './rate-limit';

describe('abuse and budget controls', () => {
  it('blocks after the request limit', async () => {
    const key = `test-${crypto.randomUUID()}`;
    expect((await rateLimit(key, 2)).allowed).toBe(true);
    expect((await rateLimit(key, 2)).allowed).toBe(true);
    expect((await rateLimit(key, 2)).allowed).toBe(false);
  });

  it('blocks after the provider budget', async () => {
    const provider = `test-${crypto.randomUUID()}`;
    expect(await consumeBudget(provider, 1)).toBe(true);
    expect(await consumeBudget(provider, 1)).toBe(false);
  });
});