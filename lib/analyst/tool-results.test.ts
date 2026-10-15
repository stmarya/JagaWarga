import { describe, expect, it } from 'vitest';
import { MAX_LOCAL_FILE, MAX_QR_FILE, readPatternResult } from './tool-results';
describe('investigation tool results', () => {
 it('retains only allowlisted fields, never echoed input', () => { const r = readPatternResult({ risk: 10, verdict: 'low-signal', reasonCodes: [], requestId: 'test', text: 'PRIVATE_INPUT', authentication: { spf: 'pass', raw: 'PRIVATE_INPUT' } }); expect(JSON.stringify(r)).not.toContain('PRIVATE_INPUT'); expect(r.actions).toEqual([]); });
 it('rejects malformed results instead of treating missing signals as safe', () => { for (const raw of [null, {}, { risk: NaN }, { risk: 101, verdict: 'low-signal', reasonCodes: [], requestId: 'x' }]) expect(() => readPatternResult(raw)).toThrow(); });
 it('defines explicit bounded local-file policies', () => { expect(MAX_LOCAL_FILE).toBe(25 * 1024 * 1024); expect(MAX_QR_FILE).toBe(10 * 1024 * 1024); });
});
