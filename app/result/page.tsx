'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProgressBreadcrumb } from '@/components/page-navigation';
import { severityFor } from '@/lib/security/severity-policy';
import { resultActions, resultFindings, resultLimitations, type DisplayResult } from '@/lib/presentation/result';
import { publicationIndicator } from '@/lib/publication';
import { savePublicationReceipt } from '@/lib/client/publications';

export default function ResultPage() {
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [communityEnabled, setCommunityEnabled] = useState(false);
  const [consent, setConsent] = useState(false);
  const [published, setPublished] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const id = new URLSearchParams(window.location.search).get('id');
    async function load() {
      try {
        if (id) {
          const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, { signal: controller.signal });
          if (!response.ok) throw new Error();
          const item = await response.json(); setResult({ ...item.result, historyId: item.id });
        } else {
          const raw = sessionStorage.getItem('jagawarga:last-result');
          if (raw) { const parsed = JSON.parse(raw); if (typeof parsed.risk === 'number' && typeof parsed.verdict === 'string') { const { historyId: legacyPublication, ...privateResult } = parsed; setResult(privateResult); } }
        }
      } catch { if (!controller.signal.aborted) setNotice('Hasil tidak tersedia, kedaluwarsa, atau sesi tidak valid.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    fetch('/api/policy', { signal: controller.signal }).then((r) => r.json()).then((p) => setCommunityEnabled(p.features?.communityReporting === true)).catch(() => {});
    return () => controller.abort();
  }, []);
  async function feedback(helpful: boolean) {
    if (!result || busy) return; setBusy(true);
    try {
      const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ helpful, category: result.verdict }) });
      setNotice(response.ok ? 'Masukan tersimpan tanpa isi pesan atau indikator.' : 'Masukan belum terkirim. Coba lagi.');
    } catch { setNotice('Jaringan bermasalah. Masukan belum terkirim.'); } finally { setBusy(false); }
  }
  let candidate = '';
  try { if (result?.indicator) candidate = publicationIndicator(result.indicator.displayValue); } catch { /* Sensitive or unsupported indicator cannot be published. */ }
  async function publish() {
    if (!consent || !candidate || busy || published) return; setBusy(true);
    try {
      const response = await fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ indicator: candidate, consent: true }) });
      if (!response.ok) throw new Error(response.status === 403 ? 'Publikasi komunitas belum diaktifkan operator.' : 'Publikasi belum berhasil. Tidak ada hasil lokal yang dihapus.');
      const saved = await response.json(); setPublished(true);
      try {
        savePublicationReceipt({ id: saved.item.id, deletionToken: saved.deletionToken, expiresAt: saved.item.expiresAt });
        setNotice('Dipublikasikan maksimal 24 jam. Anda dapat menghapusnya melalui tab Riwayat komunitas atau halaman Privasi.');
      } catch {
        // No deletion capability may be lost silently: immediately roll back publication.
        const rollback = await fetch('/api/history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: saved.item.id, deletionToken: saved.deletionToken }) });
        setPublished(!rollback.ok);
        setNotice(rollback.ok ? 'Publikasi dibatalkan karena bukti penghapusan tidak dapat disimpan di browser.' : 'Publikasi berlaku maksimal 24 jam; bukti penghapusan lokal gagal disimpan dan rollback belum berhasil.');
      }
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Publikasi gagal.'); } finally { setBusy(false); }
  }
  async function share() {
    if (!result) return;
    const text = `Hasil JagaWarga: ${result.indicator?.displayValue ?? 'analisis pola'} — ${result.verdict}. Bukan jaminan aman; periksa bukti dan konteks.`;
    try { if (navigator.share) await navigator.share({ title: 'Hasil pemeriksaan JagaWarga', text }); else { await navigator.clipboard.writeText(text); setNotice('Ringkasan disalin. Tinjau indikator sebelum membagikan.'); } }
    catch { setNotice('Berbagi dibatalkan atau tidak didukung.'); }
  }
  if (loading) return <main className="compact-page batch-page"><p role="status">Memuat hasil…</p></main>;
  if (!result) return <main className="compact-page batch-page"><section className="batch-card"><h1>Hasil tidak ditemukan</h1><p>{notice || 'Sesi tidak memiliki hasil pemeriksaan.'}</p><Link className="batch-primary" href="/periksa">Mulai pemeriksaan</Link></section></main>;
  const severity = severityFor(result);
  const findings = resultFindings(result);
  const isLookup = Boolean(result.indicator && result.evidence);
  return <main className="compact-page batch-page result-v2">
    <ProgressBreadcrumb current="result" />
    <section className={`batch-card result-summary result-${severity.tone}`}>
      <p className="batch-eyebrow">HASIL PEMERIKSAAN · {result.historyId ? 'PUBLIKASI KOMUNITAS' : 'SESI PRIBADI'}</p>
      <h1>{severity.level === 'low' ? 'Belum ada indikasi ancaman' : severity.label}</h1>
      <p>{severity.summary}</p>
      {result.indicator && <p className="batch-indicator">{result.indicator.type.toUpperCase()} · {result.indicator.displayValue}</p>}
      <dl className="batch-facts"><div><dt>Skor sinyal</dt><dd>{result.risk}/100 · bukan probabilitas</dd></div><div><dt>Confidence</dt><dd>{result.confidence ?? 'Tidak tersedia'}</dd></div><div><dt>Waktu pemeriksaan</dt><dd>{result.checkedAt ?? 'Tidak tersedia'}</dd></div></dl>
      {result.partial && <p className="batch-alert">Hasil parsial: sebagian sumber belum tersedia. Jangan anggap hasil lengkap.</p>}
      {result.storageNotice && <p className="batch-alert">{result.storageNotice}</p>}
    </section>
    <section className="batch-card batch-action"><p className="batch-eyebrow">LAKUKAN TERLEBIH DAHULU</p><h2>Langkah yang disarankan</h2><ol>{resultActions(result).map((step) => <li key={step}>{step}</li>)}</ol>
      <div className="batch-actions"><Link className="batch-primary" href="/periksa">Periksa objek lain</Link><Link className="batch-secondary" href="/emergency">Saya sudah terlanjur</Link></div>
    </section>
    <section className="batch-card"><h2>Bukti yang ditemukan</h2><p>Berikut observasi pada data yang diperiksa, bukan dugaan berdasarkan tipe URL, IP, atau berkas.</p>
      {findings.length ? <ul className="batch-evidence">{findings.map((f, i) => <li key={`${f.source}-${i}`}><strong>{f.source}</strong><p>{f.text || 'Tidak ada alasan tambahan dari sumber.'}</p><small>Status sumber: {f.status} · freshness: {f.freshness}{f.fetchedAt ? ` · diambil ${f.fetchedAt}` : ''}</small></li>)}</ul> : <p>Belum ada bukti teknis yang cukup. Ini tidak membuktikan objek aman.</p>}
    </section>
    <section className="batch-card"><h2>Apa yang belum dapat disimpulkan?</h2><ul>{resultLimitations(result).map((text) => <li key={text}>{text}</li>)}</ul>
      <details><summary>Risiko umum untuk dipahami — bukan temuan pada objek ini</summary><p>Phishing, penyamaran, dan malware merupakan risiko umum. Jenis input saja tidak membuktikan salah satunya terjadi. Keputusan harus mengacu pada bukti di atas dan konteks Anda.</p></details>
    </section>
    {isLookup && <section className="batch-card"><h2>Butuh detail teknis?</h2><p>Lihat metadata dan sumber lengkap, atau buka evidence explorer di Mode Analis.</p><div className="batch-actions"><Link className="batch-secondary" href={result.historyId ? `/details?id=${encodeURIComponent(result.historyId)}` : '/details'}>Buka detail IoC</Link>{!result.historyId && <Link className="batch-secondary" href="/analyst?session=1">Buka Mode Analis</Link>}</div></section>}
    {isLookup && !result.historyId && <section className="batch-card"><h2>Berbagi ke komunitas (opsional)</h2>
      {!communityEnabled ? <p>Fitur komunitas belum diaktifkan operator. Hasil ini tidak dipublikasikan otomatis.</p> : !candidate ? <p>Indikator ini tidak dapat dipublikasikan. Hapus parameter sensitif sebelum pemeriksaan baru.</p> : <>
        <p>Preview publik: <strong className="batch-indicator">{candidate}</strong>. Untuk URL, hanya host yang dibagikan—tanpa path, query, atau fragmen.</p>
        <p>Server akan melakukan lookup ulang objek publik tersebut. Hasilnya dapat berbeda dari hasil sesi ini. Indikator dan evidence ternormalisasi dapat dibaca orang lain maksimal 24 jam. Nama file, pesan, header, dan metadata mentah tidak dipublikasikan.</p>
        <label className="batch-check"><input type="checkbox" checked={consent} disabled={busy || published} onChange={(e) => setConsent(e.target.checked)} /> Saya telah meninjau preview, menghapus data sensitif, dan menyetujui publikasi selama maksimal 24 jam.</label>
        <button className="batch-secondary" type="button" disabled={!consent || busy || published} onClick={publish}>{published ? 'Sudah dipublikasikan' : 'Publikasikan setelah persetujuan'}</button>
      </>}
    </section>}
    <section className="batch-card"><h2>Apakah penjelasan ini membantu?</h2><div className="batch-actions"><button type="button" disabled={busy} onClick={() => feedback(true)}>Ya, membantu</button><button type="button" disabled={busy} onClick={() => feedback(false)}>Belum membantu</button><button type="button" onClick={share}>Bagikan ringkasan secara manual</button></div><p>Berbagi manual mengikuti pilihan Anda; tidak menambahkan hasil ke riwayat komunitas.</p></section>
    <p className="batch-notice" role="status" aria-live="polite">{notice}</p>
  </main>;
}
