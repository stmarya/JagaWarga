import type { Evidence } from './providers/types';
import type { Confidence, Verdict } from './scoring';
import { toVerdict } from './scoring';

export type AggregatedResult = {
  risk: number;
  confidence: Confidence;
  verdict: Verdict;
  reasonCodes: string[];
};

export function aggregateEvidence(items: Evidence[]): AggregatedResult {
  const useful = items.filter((item) => item.verdict !== 'unknown');
  if (!useful.length) {
    return { risk: 0, confidence: 'low', verdict: 'insufficient-data', reasonCodes: ['NO_RECORD'] };
  }
  const scores = useful.map((item) => {
    if (item.verdict === 'malicious') return 95 * item.confidence;
    if (item.verdict === 'suspicious') return 60 * item.confidence;
    if (item.verdict === 'benign') return 10 * item.confidence;
    return 0;
  });
  const risk = Math.round(Math.max(...scores));
  const independent = new Set(useful.map((item) => item.provider)).size;
  const confidence: Confidence =
    independent >= 2 || useful.some((item) => item.confidence >= 0.9) ? 'high' : 'medium';
  return {
    risk,
    confidence,
    verdict: toVerdict(risk, confidence),
    reasonCodes: [...new Set(useful.flatMap((item) => item.reasonCodes))].slice(0, 3),
  };
}