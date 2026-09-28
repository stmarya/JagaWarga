'use client';

import Link from 'next/link';
import { ChangeEvent, DragEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { classifySmartInput } from '@/lib/input';
import { addHistory, addXp } from '@/lib/client/storage';
import styles from './smart-intake.module.css';

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

type AnalysisResult = {
  kind: 'message' | 'email-header';
  risk: number;
  verdict: string;
  reasonCodes: string[];
  actions?: string[];
  authentication?: Record<string, string>;
  requestId: string;
};

type BarcodeDetectorType = new (options: { formats: string[] }) => {
  detect(source: ImageBitmap): Promise<Array<{ rawValue: string }>>;
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
  URGENCY: 'Pesan mendorong tindakan yang sangat mendesak.',
  CREDENTIAL_REQUEST: 'Pesan meminta password, PIN, OTP, atau kode rahasia.',
  MONEY_REQUEST: 'Pesan meminta uang atau transaksi.',
  PRIZE_OR_REFUND: 'Pesan menawarkan hadiah, bonus, atau pengembalian dana.',
  IMPERSONATION: 'Pesan mengaku sebagai pihak berwenang atau organisasi tepercaya.',
  SHORT_LINK: 'Pesan memakai tautan pendek yang menyamarkan tujuan.',
  SPF_FAIL: 'Pemeriksaan SPF gagal.',
  DKIM_FAIL: 'Pemeriksaan DKIM gagal.',
  DMARC_FAIL: 'Pemeriksaan DMARC gagal.',
  FROM_REPLY_TO_MISMATCH: 'Alamat balasan berbeda dari domain pengirim.',
  NO_RECEIVED_CHAIN: 'Rantai server penerima tidak ditemukan.',
};

function actions(verdict: LookupResult['verdict']) {
  if (verdict === 'high-risk') return ['Jangan buka atau unduh.', 'Ganti sandi jika sudah terlanjur masuk.', 'Hubungi pihak terkait bila ada transaksi.'];
  if (verdict === 'suspicious') return ['Tunda interaksi.', 'Cek pengirim lewat kanal resmi.', 'Jangan kirim OTP atau data pembayaran.'];
  if (verdict === 'no-indication') return ['Cek kembali pengirim dan tujuan.', 'Jangan beri data sensitif jika terasa janggal.'];
  return ['Coba lagi nanti.', 'Verifikasi manual lewat kanal resmi.'];
}

export default function Home() {
  const [fileName, setFileName] = useState('');
  const [value, setValue] = useState(''); const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LookupResult | null>(null); const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [saveLocal, setSaveLocal] = useState(true); const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false); const [requestId, setRequestId] = useState('');
  const indicator = useMemo(() => classifySmartInput(value), [value]);
  const canSubmit = Boolean(value.trim()) && indicator.endpoint !== null && !loading;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get('ioc');
    if (query) {
      setValue(query);
    }
  }, []);

  async function ingestFile(file: File) {
    setFileName(file.name);
    setNotice('');
    setResult(null);
    setAnalysisResult(null);
    if (file.type.startsWith('image/')) {
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorType }).BarcodeDetector;
      if (Detector) {
        try {
          const codes = await new Detector({ formats: ['qr_code'] }).detect(await createImageBitmap(file));
          if (codes[0]?.rawValue) {
            setValue(codes[0].rawValue);
            setFileName(`QR · ${file.name}`);
            return;
          }
        } catch {
          // If the image cannot be decoded as QR, safely fall back to local hashing.
        }
      }
    }
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    setValue([...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await ingestFile(file);
  }

  async function dropFile(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) await ingestFile(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setNotice(''); setResult(null); setAnalysisResult(null); setRequestId(''); setLoading(true);
    try {
      const endpoint = indicator.endpoint === 'message'
        ? '/api/analyze/message'
        : indicator.endpoint === 'email-header'
          ? '/api/analyze/email-header'
          : '/api/lookups';
      const body = indicator.endpoint === 'message'
        ? { text: value }
        : indicator.endpoint === 'email-header'
          ? { headers: value }
          : { indicator: value };
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({ error: 'LOOKUP_FAILED' }));
      setRequestId(typeof data.requestId === 'string' ? data.requestId : '');
      if (!response.ok) throw new Error(data.error ?? 'LOOKUP_FAILED');
      if (indicator.endpoint === 'message' || indicator.endpoint === 'email-header') {
        setAnalysisResult({ ...data, kind: indicator.endpoint });
        addXp(15);
      } else {
        setResult(data);
        if (saveLocal) addHistory({ id: crypto.randomUUID(), type: data.indicator.type, displayValue: data.indicator.displayValue, verdict: data.verdict, checkedAt: data.checkedAt });
        addXp(10);
      }
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
          <div className="mode-rail" aria-label="Jenis yang dideteksi otomatis">
            <button type="button" className="active" aria-disabled="true"><b>01</b><span>OTOMATIS</span><small>URL / IP / DOMAIN</small></button>
            <button type="button" aria-disabled="true"><b>02</b><span>FILE / QR</span><small>PROSES LOKAL</small></button>
            <button type="button" aria-disabled="true"><b>03</b><span>PESAN</span><small>PHISHING</small></button>
            <button type="button" aria-disabled="true"><b>04</b><span>EMAIL</span><small>HEADER</small></button>
          </div>
          <div className="console-stage">
            <div className="stage-heading"><p>SMART INTAKE</p><h2>Tempel atau masukkan apa saja.</h2></div>
            <form className="scan-form desk-form" onSubmit={submit} onDrop={dropFile} onDragOver={(event) => event.preventDefault()}>
              <div className="direct-mode">
                <label htmlFor="indicator">URL, DOMAIN, IP, HASH, PESAN, ATAU EMAIL HEADER</label>
                <textarea
                  id="indicator"
                  className={styles.intakeText}
                  value={value}
                  onChange={(event) => { setValue(event.target.value); setFileName(''); }}
                  placeholder="Tempel link, indikator, pesan, atau header email di sini"
                  autoComplete="off"
                  spellCheck="false"
                  rows={6}
                />
                <div className="search">
                  <label className={`${styles.fileButton} button-quiet`} htmlFor="indicator-file">{fileName ? 'GANTI FILE / QR' : 'PILIH ATAU TARIK FILE / QR'}</label>
                  <input id="indicator-file" type="file" onChange={selectFile} hidden />
                  <button type="submit" disabled={!canSubmit}>{loading ? 'MENGANALISIS…' : 'ANALISIS →'}</button>
                </div>
                <small className="detected-type">TERDETEKSI / <strong>{indicator.label}</strong>{fileName && <> · {fileName}</>}</small>
                <small>File dan gambar QR diproses di browser. Data tidak dikirim sebelum Anda menekan Analisis.</small>
              </div>
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

    {analysisResult && <section id="lookup-result" className="result result-suspicious" aria-live="polite">
      <header className="result-header">
        <div><p className="eyebrow">/// HASIL {analysisResult.kind === 'message' ? 'PESAN' : 'EMAIL HEADER'}</p><h2>{analysisResult.verdict.toUpperCase().replace('-', ' ')}</h2><p>Ini adalah sinyal risiko, bukan vonis otomatis.</p></div>
        <div className="risk-gauge"><strong>{analysisResult.risk}</strong><span>/100</span><small>RISIKO</small></div>
      </header>
      <div className="result-columns">
        <details open><summary>ALASAN</summary><ul>{analysisResult.reasonCodes.length
          ? analysisResult.reasonCodes.map((code) => <li key={code}>{reasonLabels[code] ?? code}</li>)
          : <li>Tidak ada pola risiko kuat yang terdeteksi.</li>}</ul>
          {analysisResult.authentication && <dl>{Object.entries(analysisResult.authentication).map(([key, state]) => <div key={key}><dt>{key.toUpperCase()}</dt><dd>{state}</dd></div>)}</dl>}
          <p>ID: <code>{analysisResult.requestId}</code></p>
        </details>
        <aside className="safe-actions"><strong>LANGKAH BERIKUTNYA</strong><ol>{(analysisResult.actions ?? ['Verifikasi pengirim melalui kanal resmi.', 'Jangan membagikan data sensitif sebelum terverifikasi.']).map((action) => <li key={action}>{action}</li>)}</ol></aside>
      </div>
    </section>}

    <section className="quick-links"><Link href="/dashboard"><strong>RIWAYAT</strong><span>Lihat hasil tersimpan →</span></Link><Link href="/methodology"><strong>CARA KERJA</strong><span>Pahami sumber dan skor →</span></Link><Link href="/emergency"><strong>TERLANJUR KLIK?</strong><span>Buka panduan darurat →</span></Link></section>
  </main>;
}
