'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@/components/icon';

type Evidence = {
  provider: string;
  verdict?: string;
  confidence?: number;
  reasonCodes: string[];
  fetchedAt: string;
  freshness?: string;
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
  'high-risk': { title: 'Bahaya: Jangan Dibuka', summary: 'Sinyal kuat menunjukkan indikator ini berbahaya. Hentikan interaksi.', tone: 'danger' },
  suspicious: { title: 'Waspada: Verifikasi Ulang', summary: 'Ditemukan sinyal mencurigakan. Verifikasi melalui kanal resmi.', tone: 'warning' },
  'no-indication': { title: 'Belum Ada Indikasi', summary: 'Belum ditemukan deteksi negatif, tetapi hasil ini bukan jaminan aman.', tone: 'safe' },
  'insufficient-data': { title: 'Data Kurang', summary: 'Sumber yang tersedia belum cukup untuk memberi kesimpulan.', tone: 'neutral' },
  phishing: { title: 'Bahaya: Dugaan Phishing', summary: 'Pola pesan menunjukkan upaya manipulasi atau pencurian data.', tone: 'danger' },
};

const reasonLabels: Record<string, string> = {
  VT_MULTIPLE_MALICIOUS_DETECTIONS: 'Beberapa mesin keamanan mendeteksi ancaman.',
  VT_SINGLE_MALICIOUS_DETECTION: 'Satu mesin keamanan mendeteksi ancaman.',
  VT_SUSPICIOUS_DETECTION: 'Sumber reputasi menandai objek sebagai mencurigakan.',
  VT_NO_NEGATIVE_DETECTIONS: 'Belum ditemukan deteksi negatif.',
  VT_NO_ANALYSIS: 'Sumber reputasi belum memiliki analisis yang cukup.',
  VT_NO_RECORD: 'Objek belum tercatat pada sumber reputasi.',
  DNS_RESOLVES: 'Domain aktif, tetapi status aktif bukan bukti aman.',
  DNS_NO_ANSWER: 'Domain tidak memberikan jawaban DNS saat diperiksa.',
  PROVIDER_ERROR: 'Salah satu sumber gagal merespons.',
  PROVIDER_CIRCUIT_OPEN: 'Sumber dihentikan sementara untuk mencegah kegagalan berulang.',
  PROVIDER_BUDGET_EXHAUSTED: 'Batas pemeriksaan salah satu sumber sedang habis.',
  URGENCY: 'Pesan mendorong tindakan sangat mendesak.',
  CREDENTIAL_REQUEST: 'Pesan meminta kata sandi, PIN, OTP, atau kode rahasia.',
  MONEY_REQUEST: 'Pesan meminta uang atau transaksi.',
  PRIZE_OR_REFUND: 'Pesan menawarkan hadiah atau pengembalian dana yang perlu diverifikasi.',
  IMPERSONATION: 'Pesan mengaku sebagai pihak yang dipercaya.',
  SHORT_LINK: 'Tautan pendek menyembunyikan alamat tujuan sebenarnya.',
};

function contextualActions(result: Result, reasons: string[]) {
  const codes = new Set(reasons);
  const steps: string[] = [];
  if (result.risk >= 70) steps.push('Hentikan interaksi. Jangan buka tautan, lampiran, atau aplikasi dari sumber ini.');
  else if (result.risk >= 40) steps.push('Tunda tindakan sampai identitas pengirim dan tujuan berhasil diverifikasi.');
  else steps.push('Tetap periksa alamat pengirim dan konteks sebelum memasukkan data pribadi.');
  if (codes.has('CREDENTIAL_REQUEST')) steps.push('Jangan kirim OTP, PIN, atau kata sandi. Jika sudah diberikan, segera ganti kredensial dari perangkat tepercaya.');
  if (codes.has('MONEY_REQUEST')) steps.push('Jangan transfer. Hubungi bank atau penerima melalui kanal resmi yang Anda cari sendiri.');
  if (codes.has('IMPERSONATION')) steps.push('Konfirmasi kepada pihak yang ditiru menggunakan nomor atau aplikasi resmi, bukan kontak dari pesan.');
  if (codes.has('SHORT_LINK')) steps.push('Jangan buka tautan pendek sebelum alamat tujuan sebenarnya diketahui.');
  if (codes.has('VT_MULTIPLE_MALICIOUS_DETECTIONS') || codes.has('VT_SINGLE_MALICIOUS_DETECTION')) steps.push('Isolasi berkas atau alamat ini dan jangan teruskan kepada perangkat lain.');
  if (result.partial) steps.push('Ulangi pemeriksaan nanti karena sebagian sumber belum memberikan data.');
  return [...new Set(steps)].slice(0, 4);
}

function contextualFindings(result: Result, reasons: string[]) {
  const findings = [...new Set(reasons)].map((code) => ({
    code,
    title: reasonLabels[code] ?? code.replaceAll('_', ' ').toLowerCase(),
    detail: code.startsWith('VT_')
      ? 'Kesimpulan berasal dari agregasi mesin keamanan pada sumber reputasi eksternal.'
      : code.startsWith('DNS_')
        ? 'Sinyal DNS menunjukkan kondisi teknis domain, bukan jaminan aman.'
        : 'Sinyal ditemukan dari pola dan konteks input yang Anda berikan.',
    level: ['VT_MULTIPLE_MALICIOUS_DETECTIONS', 'CREDENTIAL_REQUEST', 'MONEY_REQUEST'].includes(code) ? 'high' : 'medium',
  }));
  for (const evidence of result.evidence ?? []) {
    if (!evidence.details || evidence.provider !== 'virustotal') continue;
    const attributes = evidence.details.attributes as Record<string, unknown> | undefined;
    const stats = attributes?.last_analysis_stats as Record<string, number> | undefined;
    if (stats && (stats.malicious || stats.suspicious)) {
      findings.unshift({
        code: 'REPUTATION_SUMMARY',
        title: `${stats.malicious ?? 0} deteksi berbahaya dan ${stats.suspicious ?? 0} deteksi mencurigakan`,
        detail: 'Jumlah tersebut merupakan hasil mesin keamanan yang tersedia pada saat pemeriksaan.',
        level: (stats.malicious ?? 0) > 1 ? 'high' : 'medium',
      });
    }
  }
  return findings.slice(0, 6);
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
        ? 'Masukan tersimpan. Anda dapat membuka bukti teknis atau materi edukasi terkait.'
        : 'Masukan tersimpan. Tambahkan konteks agar hasil berikutnya lebih mudah dipahami.'
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
      setFeedback('Komentar tersimpan di riwayat komunitas.');
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
  const findings = contextualFindings(result, reasons);
  const actions = result.actions?.length ? result.actions : contextualActions(result, reasons);
  const urgent = ['high-risk', 'phishing'].includes(result.verdict);
  const reputation = result.evidence?.find((item) => item.provider === 'virustotal');
  const attributes = (reputation?.details?.attributes ?? {}) as Record<string, unknown>;
  const stats = (attributes.last_analysis_stats ?? {}) as Record<string, number>;
  const scoreLevel = result.risk >= 70 ? 'high' : result.risk >= 40 ? 'medium' : result.risk >= 15 ? 'guarded' : 'low';
  const warningText = `Peringatan JagaWarga: ${result.indicator?.displayValue ?? 'indikator ini'} mendapat status “${verdict.title}”. Jangan membuka, mengisi data, atau melakukan transfer sebelum diverifikasi melalui kanal resmi.`;

  async function shareResult() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Peringatan JagaWarga', text: warningText });
        return;
      } catch {
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(warningText)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="compact-page result-page">
      <nav className="breadcrumb"><Link href="/#scanner">Scanner</Link><span>→</span><span>Hasil</span></nav>
      <section className={`summary-card tone-${verdict.tone}`}>
        <div>
          <p className="step-label">LANGKAH 2 DARI 3 · HASIL UMUM</p>
          <h1>{verdict.title}</h1>
          <p className="result-lead">{verdict.summary}</p>
          {result.indicator && <p className="indicator-value">{result.indicator.type.toUpperCase()} · {result.indicator.displayValue}</p>}
        </div>
        <div className={`score score-${scoreLevel}`} aria-label={`Skor risiko ${result.risk} dari 100`}><strong>{result.risk}</strong><span>/100</span></div>
      </section>

      {urgent && <aside className="emergency-callout">
        <div><strong><Icon name="alert" /> Sudah terlanjur klik atau transfer uang?</strong><p>Jangan panik. Putuskan interaksi dan ikuti langkah pertolongan pertama.</p></div>
        <Link className="primary-action" href="/emergency">Buka panduan darurat <Icon name="arrow" /></Link>
      </aside>}

      <section className="result-grid">
        <article className="content-card">
          <h2>Apa yang ditemukan?</h2>
          <div className="finding-list">{findings.length ? findings.map((finding) => <article className={`finding finding-${finding.level}`} key={finding.code}><span className="finding-signal" /><div><strong>{finding.title}</strong><p>{finding.detail}</p></div></article>) : <article className="finding finding-low"><span className="finding-signal" /><div><strong>Belum ada pola risiko kuat</strong><p>Sumber yang diperiksa belum menemukan sinyal negatif yang cukup. Tetap periksa konteks.</p></div></article>}</div>
          {result.partial && <p className="inline-alert">Sebagian sumber belum tersedia. Perlakukan hasil sebagai data parsial.</p>}
        </article>
        <aside className={`action-card action-${scoreLevel}`}>
          <h2>Langkah yang disarankan</h2>
          <ol>{actions.map((step) => <li key={step}>{step}</li>)}</ol>
        </aside>
      </section>

      {reputation && <details className="quick-technical">
        <summary>Lihat ringkasan mesin keamanan</summary>
        <div className="quick-stats">
          {Object.keys(stats).length ? Object.entries(stats).map(([name, count]) => <span key={name}><strong>{count}</strong>{name}</span>) : <p>Sumber reputasi belum memiliki statistik analisis.</p>}
        </div>
        <p>Metadata dan hasil setiap mesin tersedia pada halaman detail.</p>
      </details>}

      <section className="detail-cta">
        <div><p className="step-label">LANGKAH 3 · OPSIONAL</p><h2>Butuh seluruh detail IoC?</h2><p>Lihat statistik mesin, metadata, kategori, dan bukti dari seluruh sumber.</p></div>
        <Link className="primary-action" href={result.historyId ? `/details?id=${encodeURIComponent(result.historyId)}` : '/details'}>Cek detail <Icon name="arrow" /></Link>
      </section>

      <section className="feedback-card">
        <div><h2>Apakah hasil ini membantu?</h2><p>Pilihan Anda membantu memperbaiki penjelasan, bukan mengubah skor.</p></div>
        <div className="feedback-buttons"><button onClick={() => sendFeedback(true)} disabled={sending}>Ya, membantu</button><button className="secondary-action" onClick={() => sendFeedback(false)} disabled={sending}>Belum</button></div>
        {result.historyId && <form onSubmit={addComment}><label htmlFor="comment">Tambahkan konteks untuk warga lain (opsional)</label><div className="comment-row"><input id="comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={500} placeholder="Contoh: dikirim lewat WhatsApp dan meminta OTP" /><button disabled={!comment.trim() || sending}>Kirim komentar</button></div></form>}
        {feedback && <p className="feedback-response" role="status">{feedback}</p>}
      </section>

      <button className="floating-share" type="button" onClick={shareResult} aria-label="Bagikan hasil pemeriksaan"><Icon name="share" size={22} /><span>Bagikan</span></button>
    </main>
  );
}