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
  evidence: Array<{ provider: string; reasonCodes: string[]; observedAt: string | null; fetchedAt: string; sourceUrl?: string }>;
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
  const indicator = useMemo(() => classifyInput(value), [value]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch('/api/lookups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator: value }),
      });
      const data = await response.json();
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
    <main>
      <nav><span className="brand">🛡️ JagaWarga</span><span><a href="/tools">Alat</a> · <a href="/dashboard">Dashboard</a> · <a href="/status">Status</a></span></nav>
      <section className="hero">
        <p className="eyebrow">SECURITY LOOKUP & AWARENESS</p>
        <h1>Ada link mencurigakan?<br />Cek sebelum klik.</h1>
        <p className="lead">Periksa URL, domain, IP, atau hash—lalu pahami risikonya dengan bahasa sederhana.</p>
        <form onSubmit={submit}>
          <label htmlFor="indicator">Masukkan objek yang ingin diperiksa</label>
          <div className="search">
            <input id="indicator" value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://contoh.id atau alamat IP" autoComplete="off" />
            <button type="submit" disabled={!value.trim() || loading}>
              {loading ? 'Memeriksa…' : 'Periksa'}
            </button>
          </div>
          <small>Terdeteksi: <strong>{indicator.label}</strong>. Pemeriksaan hanya memakai metadata dan hasil provider yang sudah tersedia—tanpa submission otomatis.</small>
          <label className="checkbox"><input type="checkbox" checked={saveLocal} onChange={(event) => setSaveLocal(event.target.checked)} /> Simpan hasil di perangkat ini</label>
        </form>
        {notice && <div className="notice" role="status">{notice}</div>}
        {result && (
          <section className="result" aria-live="polite">
            <p className="eyebrow">HASIL PEMERIKSAAN</p>
            <h2>{verdictCopy[result.verdict].title}</h2>
            <p>{verdictCopy[result.verdict].description}</p>
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
            <details>
              <summary>Sumber pemeriksaan</summary>
              <ul>
                {result.evidence.map((item) => (
                  <li key={item.provider}>
                    <strong>{item.provider}</strong>
                    <ul>{item.reasonCodes.map((code) => <li key={code}>{reasonLabels[code] ?? code}</li>)}</ul>
                    <small>Diperiksa: {new Date(item.fetchedAt).toLocaleString('id-ID')}{item.observedAt ? ` · Data: ${new Date(item.observedAt).toLocaleString('id-ID')}` : ''}</small>
                    {item.sourceUrl && <p><a href={item.sourceUrl} target="_blank" rel="noreferrer">Buka laporan sumber</a></p>}
                  </li>
                ))}
              </ul>
              <p>{result.cached ? 'Hasil berasal dari cache sementara.' : 'Hasil diperiksa langsung pada metadata provider.'}</p>
              {result.providers.failed.length > 0 && <p>Provider gagal: {result.providers.failed.join(', ')}.</p>}
            </details>
            <strong>Tindakan aman:</strong>
            <ul>{actions(result.verdict).map((action) => <li key={action}>{action}</li>)}</ul>
            <div className="feedback">
              <span>Apakah hasil ini membantu?</span>
              <button type="button" onClick={async () => { await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful: true, category: result.verdict }) }); setFeedback('Terima kasih atas feedback Anda.'); }}>Ya</button>
              <button type="button" onClick={async () => { await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful: false, category: result.verdict }) }); setFeedback('Feedback dicatat untuk peninjauan.'); }}>Tidak</button>
            </div>
            {feedback && <p role="status">{feedback}</p>}
          </section>
        )}
      </section>
      <section id="prinsip" className="cards">
        <article><span>1</span><h2>Cek</h2><p>Kami mengenali jenis input tanpa langsung mengirimkannya ke pihak ketiga.</p></article>
        <article><span>2</span><h2>Pahami</h2><p>Hasil menampilkan alasan, sumber, freshness, dan tingkat keyakinan.</p></article>
        <article><span>3</span><h2>Bertindak</h2><p>Dapatkan langkah aman berikutnya—bukan sekadar skor teknis.</p></article>
      </section>
      <footer>Belum ada indikasi berbahaya bukan berarti 100% aman.</footer>
    </main>
  );
}
