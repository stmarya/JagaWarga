import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { canonicalizeIndicator } from '../lib/security/canonicalize';

type Fixture = {
  id: string;
  input: string;
  expectedType?: string;
  expectedError?: string;
  expectedDisplayContains?: string;
};

const fixtures = JSON.parse(
  readFileSync(join(process.cwd(), 'fixtures/golden-baseline.json'), 'utf8'),
) as Fixture[];

describe('golden baseline', () => {
  for (const fixture of fixtures) {
    it(fixture.id, () => {
      if (fixture.expectedError) {
        expect(() => canonicalizeIndicator(fixture.input)).toThrow(fixture.expectedError);
        return;
      }
      const result = canonicalizeIndicator(fixture.input);
      expect(result.type).toBe(fixture.expectedType);
      if (fixture.expectedDisplayContains) {
        expect(decodeURIComponent(result.displayValue)).toContain(fixture.expectedDisplayContains);
      }
    });
  }
});