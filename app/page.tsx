'use client';

import { FormEvent, useMemo, useState } from 'react';
import { classifyInput } from '@/lib/input';
import { addHistory, addXp } from '@/lib/client/storage';

type LookupResult = {
  risk: number;
  verdict: 'high-risk' | 'suspicious' | 'no-indication' | 'insufficient-data';
  confidence: 'low' | 'medium' | 'high';
  indicator: { type: string; displayValue: string };
  partial: boolean;
  cached: boolean;
  requestId: string;
  evidence: Array<{
    provider: string;
    reasonCodes: string[];
    observedAt: string | null;
    fetchedAt: string;
    sourceUrl?: string;
    freshness: 'fresh' | 'stale' | 'unknown';
    ageSeconds: number | null;
    maxAgeSeconds: number;
  }>;
  providers: { requested: string[]; succeeded: string[]; failed: string[] };
  policy: { existingLookupOnly: boolean; submissionOccurred: boolean };
  checkedAt: string;
};

const verdictCopy = {
  'high-risk': { title: 'Bahaya tinggi', description: 'Sumber reputasi menemukan indikasi kuat bahwa objek ini berbahaya.' },
  suspicious: { title: 'Mencurigakan', description: 'Ada sinyal risiko. Jangan lanjut sebelum melakukan verifikasi melalui kanal lain.' },
  'no-indication': { title: 'Belum ditemukan indikasi berbahaya', description: 'Sumber yang aktif tidak menemukan sinyal negatif. Ini bukan jaminan 100% aman.' },
  'insufficient-data': { title: 'Belum ada cukup data reputasi', description: 'Metadata teknis tersedia, tetapi belum ada bukti reputasi yang cukup untuk menilai objek ini.' },
} as const;

const reasonLabels: Record<string, string> = {
  DNS_RESOLVES: 'Domain aktif dan memiliki jawaban DNS; ini bukan bukti bahwa domain aman.',
  DNS_NO_ANSWER: 'Tidak ditemukan jawaban DNS saat pemeriksaan.',
  VT_MULTIPLE_MALICIOUS_DETECTIONS: 'Beberapa mesin VirusTotal mendeteksi aktivitas berbahaya.',
  VT_SINGLE_MALICIOUS_DETECTION: 'Satu mesin VirusTotal memberi deteksi berbahaya; perlu verifikasi tambahan.',
  VT_SUSPICIOUS_DETECTION: 'VirusTotal memiliki deteksi mencurigakan.',
  VT_NO_NEGATIVE_DETECTIONS: 'VirusTotal tidak menampilkan deteksi negatif pada analisis terakhir.',
  VT_NO_ANALYSIS: 'VirusTotal belum memiliki hasil analisis yang cukup.',
  VT_NO_RECORD: 'Objek belum ditemukan pada database VirusTotal.',
  PROVIDER_ERROR: 'Provider gagal merespons. Coba kembali beberapa saat lagi.',
  PROVIDER_CIRCUIT_OPEN: 'Provider dihentikan sementara setelah beberapa kegagalan.',
  PROVIDER_BUDGET_EXHAUSTED: 'Kuota provider untuk periode ini telah habis.',
  NO_PROVIDER_CONFIGURED: 'Belum ada provider yang mendukung jenis input ini.',
  STALE_BENIGN_EVIDENCE: 'Data bersih dari provider sudah terlalu lama dan tidak digunakan untuk menyatakan aman.',
};

function actions(verdict: LookupResult['verdict']) {
  if (verdict === 'high-risk') return ['Jangan buka link atau file.', 'Jika sudah memasukkan password, segera ganti password dan aktifkan MFA.', 'Hubungi bank atau admin terkait bila ada transaksi atau akun terdampak.'];
  if (verdict === 'suspicious') return ['Tunda interaksi dengan objek ini.', 'Konfirmasi identitas pengirim melalui kanal resmi yang berbeda.', 'Jangan memasukkan OTP, password, atau data pembayaran.'];
  if (verdict === 'no-indication') return ['Tetap periksa konteks pengirim dan tujuan.', 'Jangan memasukkan data sensitif bila ada hal yang tidak wajar.'];
  return ['Pastikan provider reputasi telah dikonfigurasi.', 'Verifikasi pengirim dan jangan mengandalkan DNS sebagai bukti aman.'];
}

export default function Home() {
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLocal, setSaveLocal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [requestId, setRequestId] = useState('');
  const indicator = useMemo(() => classifyInput(value), [value]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setResult(null);
    setRequestId('');
    setLoading(true);
    try {
      const response = await fetch('/api/lookups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator: value }),
      });
      const data = await response.json();
      setRequestId(typeof data.requestId === 'string' ? data.requestId : '');
      if (!response.ok) throw new Error(data.error ?? 'LOOKUP_FAILED');
      setResult(data);
      if (saveLocal) {
        addHistory({
          id: crypto.randomUUID(),
          type: data.indicator.type,
          displayValue: data.indicator.displayValue,
          verdict: data.verdict,
          checkedAt: data.checkedAt,
        });
      }
      addXp(10);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'LOOKUP_FAILED';
      const messages: Record<string, string> = {
        RATE_LIMITED: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba kembali.',
        INDICATOR_UNSUPPORTED: 'Format input belum dikenali. Gunakan URL, domain, IP publik, atau hash.',
        IP_NON_PUBLIC: 'Alamat jaringan internal tidak boleh diperiksa.',
      };
      setNotice(messages[code] ?? 'Pemeriksaan gagal. Periksa konfigurasi provider atau coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="pulse-dot" /> PUSAT CEK KEAMANAN WARGA</p>
          <h1>Kenali risiko.<br /><span>Ambil langkah aman.</span></h1>
          <p className="lead">Periksa link, domain, IP publik, atau hash file sebelum Anda berinteraksi. Hasil dijelaskan dengan bahasa yang mudah dipahami.</p>
          <div className="hero-actions">
            <a className="button button-secondary" href="#scanner">Mulai pemeriksaan <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="/emergency">Sudah terlanjur klik? <span aria-hidden="true">→</span></a>
          </div>
          <ul className="trust-list" aria-label="Prinsip pemeriksaan">
            <li><span aria-hidden="true">✓</span> Tanpa upload file</li>
            <li><span aria-hidden="true">✓</span> Tanpa submission otomatis</li>
            <li><span aria-hidden="true">✓</span> Sumber dapat ditelusuri</li>
          </ul>
        </div>

        <div className="scanner-shell" id="scanner">
          <div className="scanner-topbar">
            <span><i aria-hidden="true" /> Pemeriksaan baru</span>
            <span className="system-online"><i aria-hidden="true" /> Sistem aktif</span>
          </div>
          <div className="scanner-body">
            <div className="scanner-modes" aria-label="Jenis input yang didukung">
              <span className="active">URL &amp; domain</span>
              <span>IP publik</span>
              <span>Hash file</span>
            </div>
            <p className="scanner-kicker">CEK INDIKATOR</p>
            <h2>Apa yang ingin Anda periksa?</h2>
            <p className="scanner-copy">Masukkan satu indikator. JagaWarga akan mengenali jenisnya secara otomatis.</p>
            <form className="scan-form" onSubmit={submit}>
              <label htmlFor="indicator">Link, domain, alamat IP, atau hash</label>
              <div className="search">
                <input id="indicator" value={value} onChange={(event) => setValue(event.target.value)} placeholder="contoh.id atau https://contoh.id" autoComplete="off" />
                <button type="submit" disabled={!value.trim() || loading}>
                  {loading ? 'Memeriksa…' : <>Periksa <span aria-hidden="true">→</span></>}
                </button>
              </div>
              <div className="input-meta">
                <small>Terdeteksi: <strong>{indicator.label}</strong></small>
                <label className="checkbox"><input type="checkbox" checked={saveLocal} onChange={(event) => setSaveLocal(event.target.checked)} /> Simpan di perangkat ini</label>
              </div>
              <p className="privacy-note"><span aria-hidden="true">◇</span> Metadata dan hasil provider yang sudah tersedia saja. Tidak ada submission otomatis.</p>
            </form>
            {notice && <div className="notice" role="status">{notice}</div>}
            {!result && requestId && <p className="notice">ID permintaan untuk dukungan: <code>{requestId}</code></p>}
          </div>
        </div>
      </section>

      {result && (
        <section className={`result result-${result.verdict}`} aria-live="polite">
          <header className="result-header">
            <div>
              <p className="eyebrow">HASIL PEMERIKSAAN</p>
              <h2>{verdictCopy[result.verdict].title}</h2>
              <p>{verdictCopy[result.verdict].description}</p>
            </div>
            <div className="risk-gauge" aria-label={`Risk signal ${result.risk} dari 100`}>
              <strong>{result.risk}</strong><span>/100</span>
              <small>risk signal</small>
            </div>
          </header>
          {!result.evidence.some((item) => item.provider === 'virustotal') && (
            <p className="warning">Provider reputasi belum aktif atau belum berhasil digunakan. Periksa <a href="/status">status konfigurasi provider</a>.</p>
          )}
          {result.partial && <p className="warning">Sebagian sumber tidak tersedia. Hasil tetap ditampilkan sebagai data parsial.</p>}
          <dl>
            <div><dt>Jenis</dt><dd>{result.indicator.type}</dd></div>
            <div><dt>Confidence</dt><dd>{result.confidence}</dd></div>
            <div><dt>Risk signal</dt><dd>{result.risk}/100</dd></div>
            <div><dt>Submission</dt><dd>{result.policy.submissionOccurred ? 'Terjadi' : 'Tidak dilakukan'}</dd></div>
          </dl>
          <div className="result-columns">
            <details>
              <summary>Sumber pemeriksaan</summary>
              <ul>
                {result.evidence.map((item) => (
                  <li key={item.provider}>
                    <strong>{item.provider}</strong>
                    <ul>{item.reasonCodes.map((code) => <li key={code}>{reasonLabels[code] ?? code}</li>)}</ul>
                    <small>Diperiksa: {new Date(item.fetchedAt).toLocaleString('id-ID')}{item.observedAt ? ` · Data: ${new Date(item.observedAt).toLocaleString('id-ID')}` : ''}</small>
                    <p>Freshness: <strong>{item.freshness}</strong>{item.ageSeconds === null ? '' : ` · usia ${Math.round(item.ageSeconds / 3600)} jam`}</p>
                    {item.sourceUrl && <p><a href={item.sourceUrl} target="_blank" rel="noreferrer">Buka laporan sumber</a></p>}
                  </li>
                ))}
              </ul>
              <p>{result.cached ? 'Hasil berasal dari cache sementara.' : 'Hasil diperiksa langsung pada metadata provider.'}</p>
              {result.providers.failed.length > 0 && <p>Provider gagal: {result.providers.failed.join(', ')}.</p>}
              <p>ID permintaan: <code>{result.requestId}</code></p>
            </details>
            <aside className="safe-actions">
              <strong>Tindakan aman berikutnya</strong>
              <ol>{actions(result.verdict).map((action) => <li key={action}>{action}</li>)}</ol>
            </aside>
          </div>
          <div className="feedback">
            <span>Apakah hasil ini membantu?</span>
            <button type="button" onClick={async () => { await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful: true, category: result.verdict }) }); setFeedback('Terima kasih atas feedback Anda.'); }}>Ya</button>
            <button type="button" className="button-quiet" onClick={async () => { await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful: false, category: result.verdict }) }); setFeedback('Feedback dicatat untuk peninjauan.'); }}>Tidak</button>
          </div>
          {feedback && <p role="status">{feedback}</p>}
        </section>
      )}

      <section className="principles-intro">
        <p className="eyebrow">DIRANCANG UNTUK KEPUTUSAN YANG LEBIH AMAN</p>
        <h2>Bukan sekadar skor teknis.</h2>
        <p>Informasi penting disusun agar Anda tahu apa yang terjadi, seberapa yakin hasilnya, dan apa yang perlu dilakukan.</p>
      </section>
      <section id="prinsip" className="cards">
        <article><span>01</span><h3>Periksa dengan minim data</h3><p>Jenis input dikenali lebih dulu dan tidak langsung dikirimkan ke pihak ketiga.</p><a href="/privacy">Prinsip privasi →</a></article>
        <article><span>02</span><h3>Pahami bukti</h3><p>Lihat alasan, sumber, usia data, dan tingkat keyakinan di balik setiap hasil.</p><a href="/methodology">Lihat metodologi →</a></article>
        <article><span>03</span><h3>Ambil tindakan</h3><p>Dapatkan langkah aman yang konkret, termasuk bantuan ketika insiden sudah terjadi.</p><a href="/emergency">Panduan darurat →</a></article>
      </section>
    </main>
  );
}
