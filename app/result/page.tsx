'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type Evidence = {
  provider: string;
  reasonCodes: string[];
  fetchedAt: string;
  freshness?: string;
  sourceUrl?: string;
  details?: Record<string, unknown>;
};

type Result = {
  historyId?: string;
  analysisKind?: string;
  requestId: string;
  risk: number;
  verdict: string;
  confidence?: string;
  indicator?: { type: string; displayValue: string };
  evidence?: Evidence[];
  checkedAt?: string;
  partial?: boolean;
  reasonCodes?: string[];
  actions?: string[];
};

const copy: Record<string, { title: string; summary: string; tone: string }> = {
  'high-risk': { title: 'Risiko tinggi', summary: 'Ada sinyal kuat bahwa indikator ini berbahaya. Jangan lanjutkan interaksi.', tone: 'danger' },
  suspicious: { title: 'Perlu waspada', summary: 'Ada sinyal mencurigakan. Verifikasi melalui kanal resmi sebelum bertindak.', tone: 'warning' },
  'no-indication': { title: 'Belum ada sinyal negatif', summary: 'Tidak ada deteksi negatif saat ini, tetapi ini bukan jaminan aman.', tone: 'safe' },
  'insufficient-data': { title: 'Data belum cukup', summary: 'Sumber yang tersedia belum cukup untuk memberi kesimpulan.', tone: 'neutral' },
  phishing: { title: 'Pesan berisiko', summary: 'Pola pesan menunjukkan risiko phishing atau manipulasi.', tone: 'danger' },
};

const reasonLabels: Record<string, string> = {
  VT_MULTIPLE_MALICIOUS_DETECTIONS: 'Beberapa mesin keamanan mendeteksi ancaman.',
  VT_SINGLE_MALICIOUS_DETECTION: 'Satu mesin keamanan mendeteksi ancaman.',
  VT_SUSPICIOUS_DETECTION: 'VirusTotal menandai objek sebagai mencurigakan.',
  VT_NO_NEGATIVE_DETECTIONS: 'Belum ditemukan deteksi negatif.',
  VT_NO_ANALYSIS: 'VirusTotal belum memiliki analisis yang cukup.',
  VT_NO_RECORD: 'Objek belum tercatat di VirusTotal.',
  DNS_RESOLVES: 'Domain aktif, tetapi status aktif bukan bukti aman.',
  PROVIDER_ERROR: 'Salah satu sumber gagal merespons.',
  URGENCY: 'Pesan mendorong tindakan sangat mendesak.',
  CREDENTIAL_REQUEST: 'Pesan meminta kata sandi, PIN, OTP, atau kode rahasia.',
  MONEY_REQUEST: 'Pesan meminta uang atau transaksi.',
  IMPERSONATION: 'Pesan mengaku sebagai pihak tepercaya.',
};

function nextSteps(verdict: string) {
  if (['high-risk', 'phishing'].includes(verdict)) return ['Hentikan interaksi dan jangan buka tautan atau file.', 'Ganti kata sandi dari perangkat tepercaya bila sudah memasukkannya.', 'Hubungi bank atau layanan terkait bila ada transaksi.'];
  if (verdict === 'suspicious') return ['Tunda tindakan.', 'Hubungi pengirim melalui kanal resmi yang Anda cari sendiri.', 'Jangan berikan OTP, kata sandi, atau data pembayaran.'];
  if (verdict === 'no-indication') return ['Periksa kembali alamat pengirim dan tujuan.', 'Tetap hindari membagikan data sensitif.', 'Cek ulang bila konteks berubah.'];
  return ['Coba pemeriksaan lagi nanti.', 'Verifikasi manual melalui kanal resmi.', 'Anggap belum aman sampai bukti cukup.'];
}

export default function ResultPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [feedback, setFeedback] = useState('');
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const local = sessionStorage.getItem('jagawarga:last-result');
    if (local) setResult(JSON.parse(local));
  }, []);

  async function sendFeedback(helpful: boolean) {
    if (!result || sending) return;
    setSending(true);
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful, category: result.verdict }),
    });
    setFeedback(response.ok
      ? helpful
        ? 'Senang hasil ini membantu. Anda dapat membuka detail teknis atau melihat edukasi terkait.'
        : 'Terima kasih. Beri tahu bagian yang kurang jelas agar hasil berikutnya lebih berguna.'
      : 'Masukan belum terkirim. Silakan coba lagi.');
    setSending(false);
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!result?.historyId || !comment.trim()) return;
    setSending(true);
    const response = await fetch('/api/history', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: result.historyId, message: comment }),
    });
    if (response.ok) {
      setComment('');
      setFeedback('Komentar tersimpan di riwayat komunitas. Terima kasih sudah membantu warga lain.');
    } else setFeedback('Komentar belum tersimpan. Silakan coba lagi.');
    setSending(false);
  }

  if (!result) return (
    <main className="compact-page">
      <div className="empty-card"><h1>Hasil tidak ditemukan</h1><p>Mulai pemeriksaan baru untuk melihat hasil.</p><Link className="primary-action" href="/#scanner">Mulai cek</Link></div>
    </main>
  );

  const verdict = copy[result.verdict] ?? { title: result.verdict.replaceAll('-', ' '), summary: 'Ini adalah sinyal awal, bukan vonis otomatis.', tone: 'warning' };
  const reasons = result.evidence?.flatMap((item) => item.reasonCodes) ?? result.reasonCodes ?? [];

  return (
    <main className="compact-page">
      <nav className="breadcrumb"><Link href="/#scanner">Scanner</Link><span>→</span><span>Hasil</span></nav>
      <section className={`summary-card tone-${verdict.tone}`}>
        <div>
          <p className="step-label">LANGKAH 2 DARI 3 · HASIL UMUM</p>
          <h1>{verdict.title}</h1>
          <p className="result-lead">{verdict.summary}</p>
          {result.indicator && <p className="indicator-value">{result.indicator.type.toUpperCase()} · {result.indicator.displayValue}</p>}
        </div>
        <div className="score"><strong>{result.risk}</strong><span>/100 risiko</span></div>
      </section>

      <section className="result-grid">
        <article className="content-card">
          <h2>Apa yang ditemukan?</h2>
          <ul className="reason-list">
            {reasons.length ? [...new Set(reasons)].slice(0, 5).map((reason) => <li key={reason}>{reasonLabels[reason] ?? reason.replaceAll('_', ' ').toLowerCase()}</li>) : <li>Belum ada pola risiko kuat yang terdeteksi.</li>}
          </ul>
          {result.partial && <p className="inline-alert">Sebagian sumber belum tersedia. Perlakukan hasil sebagai data parsial.</p>}
        </article>
        <aside className="action-card">
          <h2>Langkah yang disarankan</h2>
          <ol>{(result.actions ?? nextSteps(result.verdict)).map((step) => <li key={step}>{step}</li>)}</ol>
        </aside>
      </section>

      <section className="detail-cta">
        <div><p className="step-label">LANGKAH 3 · OPSIONAL</p><h2>Butuh seluruh detail IoC?</h2><p>Lihat statistik mesin, metadata, kategori, dan respons VirusTotal pada halaman terpisah.</p></div>
        <Link className="primary-action" href={result.historyId ? `/details?id=${encodeURIComponent(result.historyId)}` : '/details'}>Cek detail →</Link>
      </section>

      <section className="feedback-card">
        <div><h2>Apakah hasil ini membantu?</h2><p>Pilihan Anda membantu kami memperbaiki penjelasan, bukan mengubah skor.</p></div>
        <div className="feedback-buttons">
          <button onClick={() => sendFeedback(true)} disabled={sending}>Ya, membantu</button>
          <button className="secondary-action" onClick={() => sendFeedback(false)} disabled={sending}>Belum</button>
        </div>
        {result.historyId && (
          <form onSubmit={addComment}>
            <label htmlFor="comment">Tambahkan konteks untuk warga lain (opsional)</label>
            <div className="comment-row"><input id="comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} placeholder="Contoh: tautan dikirim lewat WhatsApp dan meminta OTP" /><button disabled={!comment.trim() || sending}>Kirim komentar</button></div>
          </form>
        )}
        {feedback && <p className="feedback-response" role="status">{feedback}</p>}
      </section>
    </main>
  );
}