export type Verdict = 'high-risk' | 'suspicious' | 'no-indication' | 'insufficient-data';
export type Confidence = 'low' | 'medium' | 'high';

export function toVerdict(risk: number, confidence: Confidence): Verdict {
  if (confidence === 'low') return 'insufficient-data';
  if (risk >= 70) return 'high-risk';
  if (risk >= 40) return 'suspicious';
  return 'no-indication';
}
