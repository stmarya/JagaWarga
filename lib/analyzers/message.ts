export type MessageAnalysis = {
  risk: number;
  verdict: 'high-risk' | 'suspicious' | 'low-signal';
  reasonCodes: string[];
  actions: string[];
};

const RULES = [
  { code: 'URGENCY', weight: 20, pattern: /\b(segera|sekarang|hari ini|akan diblokir|kedaluwarsa|terakhir|urgent|immediately|verify now|account (?:will be )?(?:blocked|suspended))\b/i },
  { code: 'CREDENTIAL_REQUEST', weight: 35, pattern: /\b(password|kata sandi|pin|otp|kode verifikasi|verification code|passcode|cvv|seed phrase)\b/i },
  { code: 'MONEY_REQUEST', weight: 30, pattern: /\b((?:transfer|kirim|send|wire).{0,24}(?:uang|dana|biaya|saldo|rekening|money|funds|payment)|bayar|make a payment)\b/i },
  { code: 'PRIZE_OR_REFUND', weight: 20, pattern: /\b(hadiah|menang|refund|pengembalian dana|bonus|prize|winner|cashback)\b/i },
  { code: 'IMPERSONATION', weight: 20, pattern: /\b(bank|kurir|bea cukai|atasan|direktur|polisi|courier|customs|manager|director|police|support team)\b/i },
  { code: 'SHORT_LINK', weight: 25, pattern: /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|s\.id|cutt\.ly)\b/i },
] as const;

export function analyzeMessage(input: string): MessageAnalysis {
  const text = input.trim().slice(0, 10_000);
  const matches = RULES.filter((rule) => rule.pattern.test(text));
  const risk = Math.min(100, matches.reduce((total, rule) => total + rule.weight, 0));
  const verdict = risk >= 65 ? 'high-risk' : risk >= 25 ? 'suspicious' : 'low-signal';
  const actions = [
    'Jangan klik link atau membuka lampiran dari pesan tersebut.',
    'Verifikasi pengirim melalui kanal resmi yang sudah Anda kenal.',
  ];
  if (matches.some((rule) => rule.code === 'CREDENTIAL_REQUEST')) {
    actions.push('Jangan membagikan password, PIN, atau OTP.');
  }
  if (matches.some((rule) => rule.code === 'MONEY_REQUEST')) {
    actions.push('Konfirmasi transaksi melalui aplikasi atau nomor resmi.');
  }
  return { risk, verdict, reasonCodes: matches.map((rule) => rule.code), actions };
}