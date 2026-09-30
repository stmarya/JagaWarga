import { describe, expect, it } from 'vitest';
import { severityFor } from './severity-policy';

describe('severity policy', () => {
  it('uses one consistent set of thresholds', () => {
    expect(severityFor({ risk: 70 }).level).toBe('critical');
    expect(severityFor({ risk: 40 }).level).toBe('warning');
    expect(severityFor({ risk: 15 }).level).toBe('caution');
    expect(severityFor({ risk: 14 }).level).toBe('low');
  });

  it('does not call low-confidence data safe', () => {
    expect(severityFor({ risk: 0, confidence: 'low' }).level).toBe('unknown');
  });
});