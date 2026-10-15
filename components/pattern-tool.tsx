'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { InvestigationNav } from './investigation-nav';
import { downloadJson } from '@/lib/analyst/snapshot';
import { readPatternResult, type PatternResult } from '@/lib/analyst/tool-results';
import { resultFindings } from '@/lib/presentation/result';
const samples = { message: 'PENTING! Akun Anda akan diblokir hari ini. Kirim kode OTP untuk verifikasi.', 'email-header': 'From: "Layanan Akun" <security@example.com>\nReply-To: helpdesk@different.example\nAuthentication-Results: mx.example; spf=fail; dkim=fail; dmarc=fail\nReceived: from unknown.example (192.0.2.10) by mx.example' };
export function PatternTool({ kind }: { kind: 'message' | 'email-header' }) {
  const isHeader = kind === 'email-header'; const router = useRouter();
  const [input, setInput] = useState(''); const [result, setResult] = useState<PatternResult | null>(null); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const controller = useRef<AbortController | null>(null); const mounted = useRef(true); const resultHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  function update(value: string) { setInput(value); setResult(null); setNotice(''); }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy || !input.trim()) return;
    setBusy(true); setResult(null); setNotice('Analisis berjalan.'); const abort = new AbortController(); controller.current = abort; const timer = setTimeout(() => abort.abort(), 15_000);
    try {
      const response = await fetch(`/api/analyze/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(isHeader ? { headers: input } : { text: input }), signal: abort.signal });
      if (!response.ok) throw new Error(response.status === 429 ? 'Batas analisis tercapai. Tunggu sebelum mencoba lagi.' : `Analisis gagal (HTTP ${response.status}).`);
      const safe = readPatternResult(await response.json()); if (!mounted.current) return;
      setResult(safe); setNotice('Analisis selesai. Hasil tidak dipublikasikan atau disimpan sebagai kasus.');
      requestAnimationFrame(() => { resultHeading.current?.focus({ preventScroll: true }); resultHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); });
    } catch (e) { if (mounted.current) setNotice(e instanceof Error && e.name === 'AbortError' ? 'Analisis dibatalkan atau waktu tunggu habis.' : e instanceof Error ? e.message : 'Koneksi gagal. Coba kembali.'); }
    finally { clearTimeout(timer); if (mounted.current) setBusy(false); controller.current = null; }
  }
  const findings = result ? resultFindings({ ...result, analysisKind: kind }) : [];
  return <main className="compact-page batch-page analyst-page investigation-tool">
    <InvestigationNav current="tools" /><Link href="/tools">← Semua alat</Link><header className="batch-heading"><p className="batch-eyebrow">{isHeader ? 'ANALISIS HEADER EMAIL · HEURISTIK' : 'ANALISIS POLA PESAN · HEURISTIK'}</p><h1>{isHeader ? 'Tinjau sinyal pada header email.' : 'Pisahkan pola mencurigakan dari dugaan.'}</h1><p>{isHeader ? 'Membaca field autentikasi dan jalur pengiriman yang Anda masukkan; bukan memverifikasi tanda tangan DKIM atau identitas pengirim secara independen.' : 'Analisis pola bahasa dapat membantu triage, tetapi tidak memastikan identitas, niat, atau kebenaran pesan.'}</p></header>
    <section className="batch-card"><h2>{isHeader ? 'Tempel header email' : 'Isi pesan'}</h2><p>Teks dikirim ke server untuk analisis sementara, bukan ke model AI atau riwayat komunitas melalui alat ini. Hapus nama, alamat pribadi, sandi, OTP, dan token sebelum mengirim.</p><form onSubmit={submit}><label htmlFor={isHeader ? 'headers' : 'message'}>{isHeader ? 'Header lengkap: From, Reply-To, Received, Authentication-Results' : 'Salin kalimat lengkap tanpa data pribadi'}</label><textarea id={isHeader ? 'headers' : 'message'} rows={8} value={input} disabled={busy} maxLength={isHeader ? 50000 : 10000} onChange={(e) => update(e.target.value)} /><div className="batch-actions"><button type="submit" className="batch-primary" disabled={busy || !input.trim()}>{busy ? 'Menganalisis…' : isHeader ? 'Periksa email' : 'Analisis pesan'}</button><button type="button" disabled={busy} onClick={() => update(samples[kind])}>Gunakan contoh</button><button type="button" disabled={!busy} onClick={() => controller.current?.abort()}>Batalkan analisis</button><button type="button" className="batch-danger-text" disabled={busy || (!input && !result)} onClick={() => update('')}>Hapus input dan hasil</button></div></form>
      {isHeader && <details><summary>Cara mengambil header dan batas kepercayaannya</summary><p>Gmail: Tampilkan asli. Outlook: lihat sumber/detail pesan. Salin hanya header. Field Authentication-Results dapat dipalsukan; kepercayaan bergantung pada server penerima. Gunakan layanan email resmi untuk verifikasi lanjutan.</p></details>}
    </section><p role="status" aria-live="polite" className="batch-notice">{notice}</p>
    {result && <section className="batch-card"><h2 ref={resultHeading} tabIndex={-1} className="evidence-selection-heading">{result.risk >= 40 ? 'Ada pola yang perlu ditinjau' : 'Belum ada sinyal kuat pada pola ini'}</h2><p><strong>Skor sinyal: {result.risk}/100</strong> · bukan probabilitas serangan.</p><p>Verdict heuristik: {result.verdict} · Request ID: <span className="analyst-indicator">{result.requestId}</span></p>
      <h3>Observasi</h3>{findings.length ? <ul>{findings.map((f, i) => <li key={i}>{f.text}</li>)}</ul> : <p>Tidak ada pola yang dikenali. Ini bukan jaminan pesan aman.</p>}
      {isHeader && <><h3>Autentikasi yang tertulis pada header</h3><dl className="analyst-facts">{['spf', 'dkim', 'dmarc'].map((key) => <div key={key}><dt>{key.toUpperCase()}</dt><dd>{result.authentication?.[key] ?? 'unknown'}</dd></div>)}</dl><p className="batch-alert">Nilai pass tidak membuktikan niat baik, dan alat ini tidak memvalidasi DKIM secara kriptografis.</p></>}
      <h3>Tindakan berikutnya</h3><ul>{(result.actions.length ? result.actions : ['Verifikasi lewat kanal resmi yang Anda cari sendiri, bukan tautan dalam pesan.', 'Jangan kirim kredensial atau transfer sebelum konteks dipastikan.']).map((s) => <li key={s}>{s}</li>)}</ul><details><summary>Reason codes</summary><ul>{result.reasonCodes.map((code) => <li key={code}><code>{code}</code></li>)}</ul></details>
      <div className="batch-actions"><button type="button" onClick={() => { try { downloadJson('jagawarga-pattern-analysis.json', { schemaVersion: 1, analysisKind: kind, ...result }); setNotice('Analisis diekspor tanpa teks input. Bukan paket kasus atau bukti verifikasi identitas.'); } catch { setNotice('Ekspor analisis gagal.'); } }}>Ekspor analisis JSON</button><button type="button" onClick={() => { try { sessionStorage.setItem('jagawarga:last-result', JSON.stringify({ ...result, analysisKind: kind, confidence: 'low' })); router.push('/result'); } catch { setNotice('Sesi browser tidak tersedia. Hasil tetap dapat dibaca di halaman ini.'); } }}>Buka ringkasan hasil</button><Link className="batch-secondary" href="/emergency">Saya sudah terlanjur</Link></div><p>Ekspor dan ringkasan tidak membawa teks asli. Analisis pola bukan snapshot reputasi IoC yang dapat dilampirkan otomatis ke kasus.</p>
    </section>}
  </main>;
}
