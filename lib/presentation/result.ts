export type ResultEvidence = { provider: string; verdict?: string; confidence?: number; reasonCodes: string[]; fetchedAt: string; observedAt?: string | null; freshness?: string; details?: Record<string, unknown> };
export type DisplayResult = {
  requestId: string; risk: number; verdict: string; confidence?: string;
  indicator?: { type: string; displayValue: string }; evidence?: ResultEvidence[];
  checkedAt?: string; partial?: boolean; reasonCodes?: string[]; actions?: string[];
  analysisKind?: string; historyId?: string; storageNotice?: string;
  coverage?: { requested: number; assessed: number; failed: number }; scoringVersion?: string;
};
const labels: Record<string, string> = {
  VT_MULTIPLE_MALICIOUS_DETECTIONS: 'Sumber reputasi mencatat beberapa deteksi berbahaya.',
  VT_FEW_MALICIOUS_DETECTIONS: 'Ada deteksi berbahaya terbatas; perlu review, bukan otomatis false positive.',
  VT_SINGLE_MALICIOUS_DETECTION: 'Satu mesin mencatat deteksi berbahaya.',
  VT_SUSPICIOUS_DETECTION: 'Sumber reputasi mencatat indikasi mencurigakan.',
  VT_NO_NEGATIVE_DETECTIONS: 'Sumber reputasi belum mencatat deteksi negatif pada data ini.',
  VT_POPULAR_TRUSTED_DOMAIN: 'Sumber memberi konteks popularitas domain; popularitas bukan jaminan aman.',
  VT_NO_ANALYSIS: 'Sumber belum memiliki analisis yang cukup.', VT_NO_RECORD: 'Indikator belum tercatat pada sumber ini.',
  DNS_RESOLVES: 'Domain memberi jawaban DNS; ini bukan penilaian reputasi.', DNS_NO_ANSWER: 'Tidak ada jawaban DNS saat diperiksa.',
  PROVIDER_ERROR: 'Sumber gagal merespons.', PROVIDER_CIRCUIT_OPEN: 'Sumber dihentikan sementara.', PROVIDER_BUDGET_EXHAUSTED: 'Kuota sumber habis.',
  STALE_BENIGN_EVIDENCE: 'Bukti bersih sudah terlalu lama untuk dipakai sebagai penilaian.', NO_RECORD: 'Belum ada bukti yang cukup untuk menilai.',
  CREDENTIAL_REQUEST: 'Pola permintaan kata sandi, PIN, OTP, atau kode rahasia terdeteksi.',
  MONEY_REQUEST: 'Pola permintaan uang/transaksi terdeteksi.', IMPERSONATION: 'Pola penyamaran identitas terdeteksi.',
  URGENCY: 'Pola desakan waktu terdeteksi.', PRIZE_OR_REFUND: 'Pola hadiah/pengembalian dana terdeteksi.', SHORT_LINK: 'Tautan pendek menyembunyikan tujuan awal.',
  FROM_REPLY_TO_MISMATCH: 'Domain From dan Reply-To berbeda.', NO_RECEIVED_CHAIN: 'Header Received tidak ditemukan.',
};
export function resultReasons(result: DisplayResult) {
  return [...new Set([...(result.reasonCodes ?? []), ...(result.evidence ?? []).flatMap((e) => e.reasonCodes)])];
}
export function resultFindings(result: DisplayResult) {
  if (result.evidence?.length) return result.evidence.map((e) => ({
    source: e.provider, status: e.verdict ?? 'unknown',
    text: e.reasonCodes.map((code) => labels[code] ?? code.replaceAll('_', ' ').toLowerCase()).join(' '),
    fetchedAt: e.fetchedAt, freshness: e.freshness ?? 'unknown',
  }));
  return resultReasons(result).map((code) => ({ source: result.analysisKind === 'email-header' ? 'Analisis header (heuristik)' : 'Analisis pola (heuristik)',
    status: result.verdict, text: labels[code] ?? code.replaceAll('_', ' ').toLowerCase(), fetchedAt: result.checkedAt ?? '', freshness: 'unknown' }));
}
export function resultActions(result: DisplayResult) {
  const codes = new Set(resultReasons(result));
  const steps: string[] = [];
  if (result.verdict === 'insufficient-data') steps.push('Tunda tindakan penting. Cari bukti tambahan atau ulangi pemeriksaan saat sumber tersedia.');
  else if (result.risk >= 70) steps.push('Hentikan interaksi dengan objek ini sampai hasil ditinjau. Jangan buka berkas atau masukkan kredensial.');
  else if (result.risk >= 40 || result.verdict === 'suspicious') steps.push('Tunda membuka, membalas, atau membayar; verifikasi konteks melalui kanal resmi.');
  else steps.push('Tetap verifikasi pengirim dan tujuan. Tidak ada indikasi bukan berarti aman.');
  if (codes.has('CREDENTIAL_REQUEST')) steps.push('Jangan kirim OTP, PIN, atau kata sandi. Jika sudah diberikan, amankan akun dari perangkat tepercaya.');
  if (codes.has('MONEY_REQUEST')) steps.push('Jangan transfer sebelum verifikasi. Jika sudah transfer, hubungi bank/e-wallet dari kanal resmi.');
  if (codes.has('IMPERSONATION')) steps.push('Konfirmasi identitas melalui kontak yang Anda cari sendiri, bukan kontak dalam pesan.');
  if (result.partial) steps.push('Sebagian sumber gagal. Ulangi pemeriksaan nanti; hasil ini belum lengkap.');
  return [...new Set([...steps, ...(result.actions ?? [])])].slice(0, 6);
}
export function resultLimitations(result: DisplayResult) {
  const notes = ['Hasil adalah bantuan awal, bukan jaminan keamanan atau atribusi pelaku.'];
  if (result.evidence?.some((e) => e.provider.includes('dns'))) notes.push('DNS aktif tidak membuktikan domain aman.');
  if (result.evidence?.filter((e) => !e.provider.includes('dns') && e.verdict !== 'unknown').length === 1) notes.push('Hanya satu sumber reputasi dapat menilai; cakupan terbatas.');
  if (result.evidence?.some((e) => e.freshness === 'stale')) notes.push('Ada evidence lama; kondisi saat ini mungkin sudah berubah.');
  if (result.analysisKind === 'email-header') notes.push('Autentikasi dibaca dari header yang Anda masukkan; bukan verifikasi kriptografis DKIM independen.');
  if (result.analysisKind === 'message') notes.push('Analisis pola tidak memastikan identitas atau niat pengirim.');
  return notes;
}
