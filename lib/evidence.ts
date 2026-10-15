import type { Evidence } from './providers/types';
import type { Confidence, Verdict } from './scoring';
import { toVerdict } from './scoring';

export type AggregatedResult = {
  risk: number;
  confidence: Confidence;
  verdict: Verdict;
  reasonCodes: string[];
  scoringVersion: string;
  coverage: { requested: number; assessed: number; failed: number };
  conflictingEvidence: boolean;
};

export const SCORING_VERSION = 'severity-independent-v1';

export function aggregateEvidence(items: Evidence[]): AggregatedResult {
  const useful = items.filter((item) => item.verdict !== 'unknown'
    && Number.isFinite(item.confidence) && item.confidence > 0 && item.confidence <= 1);
  const context = {
    scoringVersion: SCORING_VERSION,
    coverage: {
      requested: new Set(items.map((item) => item.provider)).size,
      assessed: new Set(useful.map((item) => item.provider)).size,
      failed: new Set(items.filter((item) => item.reasonCodes.some((code) =>
        ['PROVIDER_ERROR', 'PROVIDER_CIRCUIT_OPEN', 'PROVIDER_BUDGET_EXHAUSTED'].includes(code),
      )).map((item) => item.provider)).size,
    },
    conflictingEvidence: useful.some((item) => item.verdict === 'benign')
      && useful.some((item) => ['malicious', 'suspicious'].includes(item.verdict)),
  };
  if (!useful.length) {
    return { ...context, risk: 0, confidence: 'low', verdict: 'insufficient-data', reasonCodes: ['NO_RECORD'] };
  }
  // Severity is not a probability. Uncertainty must not erase a warning.
  const scores = useful.map((item) => {
    if (item.verdict === 'malicious') return 95;
    if (item.verdict === 'suspicious') return 60;
    if (item.verdict === 'benign') return 10;
    return 0;
  });
  const risk = Math.round(Math.max(...scores));
  const independent = new Set(useful.map((item) => item.provider)).size;
  const confidence: Confidence =
    independent >= 2 || useful.some((item) => item.confidence >= 0.9) ? 'high'
      : useful.some((item) => item.confidence >= 0.5) ? 'medium' : 'low';
  return {
    ...context,
    risk,
    confidence,
    // A low-confidence warning remains a warning, unlike absent evidence.
    verdict: toVerdict(risk, 'medium'),
    reasonCodes: [...new Set(useful.flatMap((item) => item.reasonCodes))].slice(0, 3),
  };
}