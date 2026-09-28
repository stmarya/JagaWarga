'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { classifyInput } from '@/lib/input';
import { addHistory, addXp } from '@/lib/client/storage';

type LookupResult = {
  risk: number;
  verdict: 'high-risk' | 'suspicious' | 'no-indication' | 'insufficient-data';
  confidence: 'low' | 'medium' | 'high';
  indicator: { type: string; displayValue: string };
  partial: boolean; cached: boolean; requestId: string;
  evidence: Array<{ provider: string; reasonCodes: string[]; observedAt: string | null; fetchedAt: string; sourceUrl?: string; freshness: 'fresh' | 'stale' | 'unknown'; ageSeconds: number | null; maxAgeSeconds: number }>;
  providers: { requested: string[]; succeeded: string[]; failed: string[] };
  policy: { existingLookupOnly: boolean; submissionOccurred: boolean };
  checkedAt: string;
};

const verdictCopy = {
  'high-risk': { title: 'BAHAYA', description: 'Ada sinyal kuat bahwa indikator ini berbahaya.' },
  suspicious: { title: 'WASPADA', description: 'Ada sinyal risiko. Verifikasi sebelum lanjut.' },
  'no-indication': { title: 'BELUM ADA SINYAL', description: 'Belum ditemukan sinyal negatif. Tetap periksa konteksnya.' },
  'insufficient-data': { title: 'DATA KURANG', description: 'Belum cukup bukti untuk memberi penilaian.' },
} as const;

const reasonLabels: Record<string, string> = {
  DNS_RESOLVES: 'Domain aktif. Ini bukan bukti bahwa domain aman.', DNS_NO_ANSWER: 'DNS tidak memberi jawaban.',
  VT_MULTIPLE_MALICIOUS_DETECTIONS: 'Beberapa mesin mendeteksi ancaman.', VT_SINGLE_MALICIOUS_DETECTION: 'Satu mesin mendeteksi ancaman.',
  VT_SUSPICIOUS_DETECTION: 'VirusTotal menandai objek sebagai mencurigakan.', VT_NO_NEGATIVE_DETECTIONS: 'Belum ada deteksi negatif.',
  VT_NO_ANALYSIS: 'Belum ada analisis yang cukup.', VT_NO_RECORD: 'Objek belum ada di basis data.',
  PROVIDER_ERROR: 'Sumber gagal merespons.', PROVIDER_CIRCUIT_OPEN: 'Sumber dihentikan sementara.',
  PROVIDER_BUDGET_EXHAUSTED: 'Kuota sumber habis.', NO_PROVIDER_CONFIGURED: 'Belum ada sumber untuk input ini.',
  STALE_BENIGN_EVIDENCE: 'Data bersih sudah terlalu lama.',
};

function actions(verdict: LookupResult['verdict']) {
  if (verdict === 'high-risk') return ['Jangan buka atau unduh.', 'Ganti sandi jika sudah terlanjur masuk.', 'Hubungi pihak terkait bila ada transaksi.'];
  if (verdict === 'suspicious') return ['Tunda interaksi.', 'Cek pengirim lewat kanal resmi.', 'Jangan kirim OTP atau data pembayaran.'];
  if (verdict === 'no-indication') return ['Cek kembali pengirim dan tujuan.', 'Jangan beri data sensitif jika terasa janggal.'];
  return ['Coba lagi nanti.', 'Verifikasi manual lewat kanal resmi.'];
}

export default function Home() {
  const [value, setValue] = useState(''); const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null); const [loading, setLoading] = useState(false);
  const [saveLocal, setSaveLocal] = useState(true); const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false); const [requestId, setRequestId] = useState('');
  const indicator = useMemo(() => classifyInput(value), [value]);
  const canSubmit = Boolean(value.trim()) && indicator.type !== 'unknown' && !loading;

  async function submit(event: FormEvent) {
    event.preventDefault(); setNotice(''); setResult(null); setRequestId(''); setLoading(true);
    try {
      const response = await fetch('/api/lookups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ indicator: value }) });
      const data = await response.json().catch(() => ({ error: 'LOOKUP_FAILED' }));
      setRequestId(typeof data.requestId === 'string' ? data.requestId : '');
      if (!response.ok) throw new Error(data.error ?? 'LOOKUP_FAILED');
      setResult(data);
      if (saveLocal) addHistory({ id: crypto.randomUUID(), type: data.indicator.type, displayValue: data.indicator.displayValue, verdict: data.verdict, checkedAt: data.checkedAt });
      addXp(10);
      window.setTimeout(() => document.getElementById('lookup-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'LOOKUP_FAILED';
      const messages: Record<string, string> = { RATE_LIMITED: 'Terlalu banyak permintaan. Coba sebentar lagi.', INDICATOR_UNSUPPORTED: 'Gunakan URL, domain, IP publik, atau hash.', DOMAIN_INVALID: 'Domain tidak valid.', URL_PROTOCOL_UNSUPPORTED: 'Gunakan http:// atau https://.', URL_CREDENTIALS_NOT_ALLOWED: 'URL dengan username atau sandi tidak bisa dicek.', IP_NON_PUBLIC: 'IP internal tidak bisa dicek.', INVALID_INPUT: 'Input tidak valid.' };
      setNotice(messages[code] ?? 'Cek gagal. Coba lagi.');
    } finally { setLoading(false); }
  }

  async function sendFeedback(helpful: boolean) {
    if (!result || feedbackLoading || feedback) return; setFeedbackLoading(true);
    try { const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful, category: result.verdict }) }); if (!response.ok) throw new Error(); setFeedback('Terima kasih.'); }
    catch { setFeedback('Belum terkirim.'); } finally { setFeedbackLoading(false); }
  }

  return <main className="home">
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">/// PERTAHANAN DIGITAL WARGA</p>
        <h1>CEK DULU.<br /><span>KLIK NANTI.</span></h1>
        <p className="lead">Cek link, domain, IP, atau hash dalam hitungan detik. Tanpa bahasa teknis yang bertele-tele.</p>
        <ul className="trust-list"><li>■ Tanpa upload otomatis</li><li>■ Bukti bisa dilacak</li><li>■ Gratis dipakai</li></ul>
      </div>
      <div className="scanner-shell" id="scanner">
        <div className="scanner-topbar"><span>IOC_LOOKUP.EXE</span><span className="system-online">● ONLINE</span></div>
        <div className="scanner-modes"><a className="active" href="#indicator">IOC</a><Link href="/tools/file-hash">FILE</Link><Link href="/tools/message">PESAN</Link></div>
        <div className="scanner-body">
          <p className="scanner-kicker">MASUKKAN INDIKATOR</p><h2>ADA YANG MENCURIGAKAN?</h2><p className="scanner-copy">Tempel satu link, domain, IP, atau hash.</p>
          <form className="scan-form" onSubmit={submit}>
            <label htmlFor="indicator">INDIKATOR</label>
            <div className="search"><input id="indicator" value={value} onChange={(e) => setValue(e.target.value)} placeholder="contoh.id / 8.8.8.8 / hash" autoComplete="off" spellCheck="false" /><button type="submit" disabled={!canSubmit}>{loading ? 'MENGECEK…' : 'CEK →'}</button></div>
            <div className="input-meta"><small>Tipe: <strong>{indicator.label}</strong></small><label className="checkbox"><input type="checkbox" checked={saveLocal} onChange={(e) => setSaveLocal(e.target.checked)} /> SIMPAN LOKAL</label></div>
            <p className="privacy-note">◆ Hanya memakai data reputasi yang sudah tersedia.</p>
          </form>
          {notice && <div className="notice" role="status">{notice}</div>}{!result && requestId && <p className="notice">ID: <code>{requestId}</code></p>}
        </div>
      </div>
    </section>

    {result && <section id="lookup-result" className={`result result-${result.verdict}`} aria-live="polite">
      <header className="result-header"><div><p className="eyebrow">/// HASIL IOC</p><h2>{verdictCopy[result.verdict].title}</h2><p>{verdictCopy[result.verdict].description}</p></div><div className="risk-gauge"><strong>{result.risk}</strong><span>/100</span><small>RISIKO</small></div></header>
      {!result.evidence.some((i) => i.provider === 'virustotal') && <p className="warning">Sumber reputasi utama belum aktif.</p>}{result.partial && <p className="warning">Sebagian sumber tidak tersedia.</p>}
      <dl><div><dt>TIPE</dt><dd>{result.indicator.type}</dd></div><div><dt>KEYAKINAN</dt><dd>{result.confidence}</dd></div><div><dt>RISIKO</dt><dd>{result.risk}/100</dd></div><div><dt>SUBMISSION</dt><dd>{result.policy.submissionOccurred ? 'YA' : 'TIDAK'}</dd></div></dl>
      <div className="result-columns"><details open><summary>BUKTI PEMERIKSAAN</summary><ul>{result.evidence.map((item) => <li key={item.provider}><strong>{item.provider.toUpperCase()}</strong><ul>{item.reasonCodes.map((code) => <li key={code}>{reasonLabels[code] ?? code}</li>)}</ul><small>{new Date(item.fetchedAt).toLocaleString('id-ID')} · {item.freshness}</small>{item.sourceUrl && <p><a href={item.sourceUrl} target="_blank" rel="noreferrer">BUKA SUMBER ↗</a></p>}</li>)}</ul><p>ID: <code>{result.requestId}</code></p></details><aside className="safe-actions"><strong>LANGKAH BERIKUTNYA</strong><ol>{actions(result.verdict).map((a) => <li key={a}>{a}</li>)}</ol></aside></div>
      <div className="feedback"><span>HASIL INI MEMBANTU?</span><button disabled={feedbackLoading || Boolean(feedback)} onClick={() => sendFeedback(true)}>YA</button><button className="button-quiet" disabled={feedbackLoading || Boolean(feedback)} onClick={() => sendFeedback(false)}>TIDAK</button></div>{feedback && <p role="status">{feedback}</p>}
    </section>}

    <section className="principles-intro"><p className="eyebrow">/// SEDERHANA, BUKAN ASAL</p><h2>TIGA LANGKAH. SATU KEPUTUSAN.</h2></section>
    <section className="cards"><article><span>01</span><h3>TEMPEL</h3><p>Masukkan indikator. Kami kenali tipenya.</p></article><article><span>02</span><h3>CEK</h3><p>Kami cari sinyal dari sumber reputasi.</p></article><article><span>03</span><h3>BERTINDAK</h3><p>Ikuti langkah aman yang jelas.</p></article></section>
  </main>;
}
