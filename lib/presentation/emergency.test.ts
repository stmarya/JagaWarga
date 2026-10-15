import { describe, expect, it } from 'vitest';
import { emergencyCases } from './emergency';
describe('emergency action hierarchy', () => {
  it('covers all five existing incidents with a first action and follow-up', () => { expect(new Set(emergencyCases.map((c) => c.id)).size).toBe(5); for (const c of emergencyCases) { expect(c.now.length).toBeGreaterThan(30); expect(c.steps.length).toBeGreaterThanOrEqual(3); expect(c.evidence).toBeTruthy(); } });
  it('prioritizes bank contact without promising funds recovery', () => { const c = emergencyCases.find((c) => c.id === 'money')!; expect(c.now).toContain('hubungi bank'); expect(c.steps.join(' ')).toContain('tidak menjamin dana kembali'); expect(c.steps.join(' ')).toContain('tidak menggantikan Laporan Polisi'); });
  it('does not recommend opening the suspicious object to collect evidence', () => { expect(emergencyCases[0].evidence).toContain('Jangan buka ulang'); expect(emergencyCases.find((c) => c.id === 'app')!.steps.join(' ')).toContain('reset menghapus data'); });
});
