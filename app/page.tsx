'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [mode, setMode] = useState<'file' | 'url' | 'search'>('search');
  const [fileName, setFileName] = useState('');
  const [value, setValue] = useState(''); const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null); const [loading, setLoading] = useState(false);
  const [saveLocal, setSaveLocal] = useState(true); const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false); const [requestId, setRequestId] = useState('');
  const indicator = useMemo(() => classifyInput(value), [value]);
  const canSubmit = Boolean(value.trim()) && indicator.type !== 'unknown' && !loading;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('ioc');
    if (query) {
      setValue(query);
      setMode(query.startsWith('http') ? 'url' : 'search');
    }
  }, []);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setNotice('');
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    setValue([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
  }

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
    <section className="security-desk" id="scanner">
      <aside className="desk-intro">
        <p className="desk-index">JW—01 / SECURITY DESK</p>
        <h1>CEK<br />RISIKO.<br /><span>TETAP AMAN.</span></h1>
        <p>Masukkan satu indikator. Kami bantu membaca sinyalnya dan menunjukkan langkah berikutnya—tanpa istilah yang bikin bingung.</p>
        <div className="desk-principles"><span>01 / PRIVAT</span><span>02 / TERLACAK</span><span>03 / PRAKTIS</span></div>
      </aside>
      <div className="desk-console">
        <header className="console-bar"><span>CHECKPOINT_01</span><span className="console-status">● SISTEM AKTIF</span></header>
        <div className="console-grid">
          <div className="mode-rail" role="tablist" aria-label="Jenis pemeriksaan">
            <button type="button" role="tab" aria-selected={mode === 'search'} className={mode === 'search' ? 'active' : ''} onClick={() => setMode('search')}><b>01</b><span>IOC</span><small>IP / HASH</small></button>
            <button type="button" role="tab" aria-selected={mode === 'url'} className={mode === 'url' ? 'active' : ''} onClick={() => setMode('url')}><b>02</b><span>URL</span><small>LINK / DOMAIN</small></button>
            <button type="button" role="tab" aria-selected={mode === 'file'} className={mode === 'file' ? 'active' : ''} onClick={() => setMode('file')}><b>03</b><span>FILE</span><small>HASH LOKAL</small></button>
            <Link href="/tools/message"><b>04</b><span>PESAN</span><small>TEKS</small></Link>
          </div>
          <div className="console-stage">
            <div className="stage-heading"><p>{mode === 'file' ? 'HASH FILE LOKAL' : mode === 'url' ? 'CEK LINK' : 'CEK INDIKATOR'}</p><h2>{mode === 'file' ? 'Pilih file. Kami hitung hash.' : mode === 'url' ? 'Link ini aman?' : 'Apa yang ingin dicek?'}</h2></div>
            <form className="scan-form desk-form" onSubmit={submit}>
              {mode === 'file' ? (
                <div className="file-mode">
                  <label className="file-picker" htmlFor="indicator-file">
                    <span className="file-icon" aria-hidden="true">+</span>
                    <strong>{fileName || 'Tarik atau pilih file'}</strong>
                    <small>File tidak diunggah. Hanya SHA-256 yang diperiksa.</small>
                    <b>{fileName ? 'GANTI FILE' : 'PILIH FILE'}</b>
                    <input id="indicator-file" type="file" onChange={selectFile} />
                  </label>
                  {value && <div className="file-ready"><span>HASH SIAP</span><code>{value}</code><button type="submit" disabled={!canSubmit}>{loading ? 'MENGECEK…' : 'CEK HASH →'}</button></div>}
                </div>
              ) : (
                <div className="direct-mode">
                  <label htmlFor="indicator">{mode === 'url' ? 'TEMPEL URL ATAU DOMAIN' : 'IP, DOMAIN, ATAU HASH'}</label>
                  <div className="search"><input id="indicator" value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === 'url' ? 'https://contoh.id' : '8.8.8.8 atau SHA-256'} autoComplete="off" spellCheck="false" /><button type="submit" disabled={!canSubmit}>{loading ? 'MENGECEK…' : 'CEK →'}</button></div>
                  <small className="detected-type">TERDETEKSI / <strong>{indicator.label}</strong></small>
                </div>
              )}
              <div className="lookup-options"><label className="checkbox"><input type="checkbox" checked={saveLocal} onChange={(e) => setSaveLocal(e.target.checked)} /> Simpan di perangkat</label><span>Tanpa submission otomatis</span></div>
            </form>
            {notice && <div className="notice" role="status">{notice}</div>}{!result && requestId && <p className="notice">ID: <code>{requestId}</code></p>}
          </div>
        </div>
        <footer className="console-foot"><span>DATA MINIMAL</span><span>SUMBER TERBUKA</span><span>LANGKAH JELAS</span></footer>
      </div>
    </section>

    {result && <section id="lookup-result" className={`result result-${result.verdict}`} aria-live="polite">
      <header className="result-header"><div><p className="eyebrow">/// HASIL IOC</p><h2>{verdictCopy[result.verdict].title}</h2><p>{verdictCopy[result.verdict].description}</p></div><div className="risk-gauge"><strong>{result.risk}</strong><span>/100</span><small>RISIKO</small></div></header>
      {!result.evidence.some((i) => i.provider === 'virustotal') && <p className="warning">Sumber reputasi utama belum aktif.</p>}{result.partial && <p className="warning">Sebagian sumber tidak tersedia.</p>}
      <dl><div><dt>TIPE</dt><dd>{result.indicator.type}</dd></div><div><dt>KEYAKINAN</dt><dd>{result.confidence}</dd></div><div><dt>RISIKO</dt><dd>{result.risk}/100</dd></div><div><dt>SUBMISSION</dt><dd>{result.policy.submissionOccurred ? 'YA' : 'TIDAK'}</dd></div></dl>
      <div className="result-columns"><details open><summary>BUKTI PEMERIKSAAN</summary><ul>{result.evidence.map((item) => <li key={item.provider}><strong>{item.provider.toUpperCase()}</strong><ul>{item.reasonCodes.map((code) => <li key={code}>{reasonLabels[code] ?? code}</li>)}</ul><small>{new Date(item.fetchedAt).toLocaleString('id-ID')} · {item.freshness}</small>{item.sourceUrl && <p><a href={item.sourceUrl} target="_blank" rel="noreferrer">BUKA SUMBER ↗</a></p>}</li>)}</ul><p>ID: <code>{result.requestId}</code></p></details><aside className="safe-actions"><strong>LANGKAH BERIKUTNYA</strong><ol>{actions(result.verdict).map((a) => <li key={a}>{a}</li>)}</ol></aside></div>
      <div className="feedback"><span>HASIL INI MEMBANTU?</span><button disabled={feedbackLoading || Boolean(feedback)} onClick={() => sendFeedback(true)}>YA</button><button className="button-quiet" disabled={feedbackLoading || Boolean(feedback)} onClick={() => sendFeedback(false)}>TIDAK</button></div>{feedback && <p role="status">{feedback}</p>}
    </section>}

    <section className="quick-links"><Link href="/dashboard"><strong>RIWAYAT</strong><span>Lihat hasil tersimpan →</span></Link><Link href="/methodology"><strong>CARA KERJA</strong><span>Pahami sumber dan skor →</span></Link><Link href="/emergency"><strong>TERLANJUR KLIK?</strong><span>Buka panduan darurat →</span></Link></section>
  </main>;
}
