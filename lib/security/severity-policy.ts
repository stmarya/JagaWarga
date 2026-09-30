export type SeverityTone = 'neutral' | 'danger' | 'warning' | 'caution' | 'safe';

export type Severity = {
  level: 'unknown' | 'critical' | 'warning' | 'caution' | 'low';
  label: string;
  answer: string;
  summary: string;
  tone: SeverityTone;
};

export type SeverityInput = {
  risk: number;
  verdict?: string;
  confidence?: string;
};

export const RISK_THRESHOLDS = {
  critical: 70,
  warning: 40,
  caution: 15,
} as const;

export function severityFor({ risk, verdict = '', confidence }: SeverityInput): Severity {
  const score = Math.max(0, Math.min(100, Number.isFinite(risk) ? risk : 0));
  if (verdict === 'insufficient-data' || confidence === 'low') {
    return {
      level: 'unknown',
      label: 'Belum dapat dinilai',
      answer: 'Jangan anggap aman',
      summary: 'Data belum cukup. Hindari tindakan penting sampai pemeriksaan dapat diulang.',
      tone: 'neutral',
    };
  }
  if (score >= RISK_THRESHOLDS.critical || ['high-risk', 'phishing', 'malicious'].includes(verdict)) {
    return {
      level: 'critical',
      label: 'Bahaya tinggi',
      answer: 'Tidak aman',
      summary: 'Sinyal ancaman kuat ditemukan. Jangan lanjutkan interaksi.',
      tone: 'danger',
    };
  }
  if (score >= RISK_THRESHOLDS.warning || verdict === 'suspicious') {
    return {
      level: 'warning',
      label: 'Perlu waspada',
      answer: 'Berpotensi tidak aman',
      summary: 'Ada tanda mencurigakan. Verifikasi sebelum membuka, membalas, atau membayar.',
      tone: 'warning',
    };
  }
  if (score >= RISK_THRESHOLDS.caution) {
    return {
      level: 'caution',
      label: 'Perlu perhatian',
      answer: 'Belum tentu aman',
      summary: 'Belum ada ancaman kuat, tetapi beberapa sinyal masih perlu diperiksa.',
      tone: 'caution',
    };
  }
  return {
    level: 'low',
    label: 'Risiko rendah',
    answer: 'Belum ada tanda bahaya',
    summary: 'Belum ditemukan sinyal berbahaya. Tetap periksa pengirim dan tujuan.',
    tone: 'safe',
  };
}