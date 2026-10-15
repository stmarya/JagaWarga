'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProgressBreadcrumb } from '@/components/page-navigation';
import { downloadJson } from '@/lib/analyst/snapshot';
import { displayTechnical, engineRows, normalizedDetailExport, providerAttributes, readDetailResult, type DetailResult } from '@/lib/presentation/details';
import { resultLimitations } from '@/lib/presentation/result';
import { severityFor } from '@/lib/security/severity-policy';

export default function DetailsPage() {
  const [result, setResult] = useState<DetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publicId, setPublicId] = useState('');
  const [filter, setFilter] = useState('');
  const [enginePage, setEnginePage] = useState(0);
  const [exportNotice, setExportNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const id = new URLSearchParams(window.location.search).get('id'); setPublicId(id ?? '');
    async function load() {
      try {
        let raw: unknown;
        if (id) {
          const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' });
          if (!response.ok) throw new Error('Publikasi tidak tersedia, kedaluwarsa, atau dinonaktifkan.');
          const body = await response.text(); if (body.length > 1_000_000) throw new Error('Respons terlalu besar untuk ditampilkan.');
          raw = JSON.parse(body)?.result;
        } else {
          const body = sessionStorage.getItem('jagawarga:last-result');
          if (!body) throw new Error('Tidak ada hasil IoC pada sesi ini.');
          if (body.length > 1_000_000) throw new Error('Data sesi terlalu besar untuk ditampilkan.');
          raw = JSON.parse(body);
        }
        const parsed = readDetailResult(raw);
        if (!controller.signal.aborted) setResult(parsed);
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof SyntaxError ? 'Data sesi atau respons tidak valid. Lakukan pemeriksaan baru.' : e instanceof Error ? e.message : 'Detail gagal dimuat.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, []);
  const resultHref = publicId ? `/result?id=${encodeURIComponent(publicId)}` : '/result';
  if (loading) return <main className="compact-page batch-page"><h1>Bukti teknis</h1><p role="status">Memuat detail…</p></main>;
  if (!result) return <main className="compact-page batch-page"><ProgressBreadcrumb current="detail" resultHref={resultHref} /><section className="batch-card"><h1>Detail tidak tersedia</h1><p role="alert">{error}</p><p>Data pribadi lain tidak digunakan sebagai pengganti publikasi yang gagal dimuat.</p><Link className="batch-primary" href="/periksa">Periksa indikator baru</Link></section></main>;
  const severity = severityFor(result);
  const reputation = result.evidence.find((item) => item.provider === 'virustotal');
  const attributes = reputation ? providerAttributes(reputation) : {};
  const stats = attributes.last_analysis_stats && typeof attributes.last_analysis_stats === 'object' && !Array.isArray(attributes.last_analysis_stats)
    ? Object.entries(attributes.last_analysis_stats).filter(([, value]) => typeof value === 'number' && Number.isFinite(value) && value >= 0).slice(0, 20) : [];
  const rows = engineRows(attributes);
  const filtered = rows.filter((row) => [row.engine_name, row.category, row.result].some((value) => String(value ?? '').toLowerCase().includes(filter.toLowerCase())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
  const currentPage = Math.min(enginePage, pageCount - 1);
  const visibleRows = filtered.slice(currentPage * 20, (currentPage + 1) * 20);
  const normalized = normalizedDetailExport(result);
  const limitations = resultLimitations(result);
  async function exportEvidence() {
    if (!normalized) return;
    try { downloadJson('jagawarga-evidence.json', normalized); setExportNotice('Evidence normalisasi diekspor. Metadata mentah tidak disertakan.'); }
    catch { setExportNotice('Ekspor gagal. Browser mungkin memblokir unduhan.'); }
  }
  return <main className="compact-page batch-page technical-page">
    <div className="no-print"><ProgressBreadcrumb current="detail" resultHref={resultHref} /></div>
    <div className="print-only"><strong>JagaWarga — ringkasan bukti teknis</strong><p>Bantuan awal, bukan laporan resmi, sertifikasi keamanan, atau atribusi pelaku. Cetakan memuat tabel mesin yang sedang ditampilkan; metadata mentah tidak dicetak.</p></div>
    <header className="batch-heading"><p className="batch-eyebrow">BUKTI TEKNIS · {publicId ? 'PUBLIKASI KOMUNITAS' : 'SESI PRIBADI'}</p><h1>Baca bukti, pahami batasnya.</h1><p>Observasi sumber, waktu, dan cakupan dipisahkan dari interpretasi. Skor menunjukkan tingkat sinyal, bukan probabilitas serangan.</p><div className="batch-actions no-print"><Link className="batch-secondary" href={resultHref}>Kembali ke hasil</Link>{!publicId && <Link className="batch-secondary" href="/analyst?session=1">Buka Mode Analis</Link>}<button onClick={() => window.print()}>Cetak / simpan PDF</button></div><p className="no-print"><small>Gunakan dialog cetak browser untuk menyimpan PDF. Tinjau indikator sebelum membagikan; cetakan bukan laporan resmi.</small></p></header>
    <section className={`batch-card technical-summary result-summary result-${severity.tone}`} aria-labelledby="technical-summary-title"><h2 id="technical-summary-title">{severity.level === 'low' ? 'Belum ada indikasi ancaman' : severity.label}</h2><p>{severity.summary}</p><p className="batch-indicator">{result.indicator.type} · {result.indicator.displayValue}</p><dl className="batch-facts"><div><dt>Skor sinyal</dt><dd>{result.risk}/100 · bukan probabilitas</dd></div><div><dt>Confidence (heuristik)</dt><dd>{result.confidence}</dd></div><div><dt>Diperiksa</dt><dd>{result.checkedAt}</dd></div><div><dt>Request ID</dt><dd>{result.requestId}</dd></div><div><dt>Cakupan sumber</dt><dd>{result.coverage ? `${result.coverage.assessed} dapat menilai / ${result.coverage.requested} diminta · ${result.coverage.failed} gagal` : 'Tidak tersedia pada hasil ini'}</dd></div><div><dt>Kebijakan scoring</dt><dd>{result.scoringVersion || 'Tidak tersedia'}</dd></div></dl>
      {result.partial && <p className="technical-warning">Hasil parsial: sebagian sumber gagal. Penilaian belum lengkap.</p>}{limitations.map((item) => <p className="technical-warning" key={item}>{item}</p>)}{result.conflictingEvidence && <p className="technical-warning">Sumber memberi sinyal yang bertentangan. Tinjau bukti per sumber, jangan hanya mengandalkan skor.</p>}
    </section>
    <section className="batch-card" aria-labelledby="source-title"><h2 id="source-title">Bukti per sumber ({result.evidence.length})</h2><p>DNS yang berhasil bukan bukti reputasi baik. Confidence sumber bukan probabilitas bahwa objek aman atau berbahaya.</p>{!result.evidence.length && <p>Belum ada observasi sumber pada hasil ini.</p>}<div className="technical-sources">{result.evidence.map((item, index) => <article key={`${item.provider}-${index}`}><h3>{item.provider}</h3><dl className="technical-source-facts"><div><dt>Verdict sumber</dt><dd>{item.verdict}</dd></div><div><dt>Confidence sumber</dt><dd>{Math.round(item.confidence * 100)}% · heuristik</dd></div><div><dt>Kesegaran saat lookup</dt><dd>{item.freshness}</dd></div><div><dt>Waktu observasi</dt><dd>{item.observedAt || 'Tidak tersedia'}</dd></div><div><dt>Waktu pengambilan</dt><dd>{item.fetchedAt}</dd></div></dl><p><strong>Reason codes</strong></p><ul className="technical-codes">{item.reasonCodes.length ? item.reasonCodes.map((code, n) => <li key={`${code}-${n}`}><code>{code}</code></li>) : <li>Tidak tersedia</li>}</ul>
      {Object.keys(providerAttributes(item)).length > 0 && <details className="no-print"><summary>Metadata mentah {item.provider} (tinjau sebelum berbagi)</summary><p>Data dari provider, bukan verifikasi independen. Metadata dapat memuat URL dan informasi sensitif; tidak disertakan pada ekspor normalisasi maupun cetakan.</p><div className="technical-metadata">{Object.entries(providerAttributes(item)).filter(([key]) => !['last_analysis_results', 'last_analysis_stats'].includes(key)).slice(0, 100).map(([key, value]) => <details key={key}><summary>{key}</summary><pre tabIndex={0} aria-label={`Nilai metadata ${key}`}>{displayTechnical(value)}</pre></details>)}</div><p>Tampilan dibatasi maksimal 100 bidang dan 30.000 karakter per nilai.</p></details>}
    </article>)}</div></section>
    <section className="batch-card"><h2>Analisis mesin reputasi</h2>{!reputation ? <p>Sumber VirusTotal tidak ada pada hasil ini. Hal ini tidak membuktikan provider nonaktif atau objek aman.</p> : <><p>Hitungan berikut berasal dari respons provider. Mesin tidak selalu independen; jangan menyamakan persentase deteksi dengan probabilitas serangan.</p>{stats.length ? <dl className="technical-stats">{stats.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{String(value)}</dd></div>)}</dl> : <p>Statistik mesin tidak tersedia. Snapshot normalisasi tidak membawa metadata mentah.</p>}
      {rows.length > 0 ? <><div className="no-print"><label htmlFor="engine-filter">Cari mesin, kategori, atau hasil</label><input id="engine-filter" className="technical-filter" value={filter} onChange={(event) => { setFilter(event.target.value); setEnginePage(0); }} /></div><p role="status">{filtered.length} mesin cocok · halaman {currentPage + 1} dari {pageCount}. Tampilan dibatasi 2.000 mesin.</p><div className="technical-table-scroll" role="region" aria-label="Hasil mesin reputasi, geser horizontal bila diperlukan" tabIndex={0}><table><caption>Hasil setiap mesin · halaman yang sedang ditampilkan</caption><thead><tr><th scope="col">Mesin</th><th scope="col">Kategori</th><th scope="col">Hasil</th><th scope="col">Pembaruan</th></tr></thead><tbody>{visibleRows.map((row, index) => <tr key={index}><th scope="row">{displayTechnical(row.engine_name)}</th><td>{displayTechnical(row.category)}</td><td>{displayTechnical(row.result)}</td><td>{displayTechnical(row.engine_update)}</td></tr>)}</tbody></table></div>{!filtered.length && <p>Tidak ada mesin yang cocok dengan pencarian.</p>}<div className="batch-actions no-print"><button disabled={currentPage === 0} onClick={() => setEnginePage(currentPage - 1)}>Halaman sebelumnya</button><button disabled={currentPage + 1 >= pageCount} onClick={() => setEnginePage(currentPage + 1)}>Halaman berikutnya</button></div></> : <p>Hasil per mesin tidak tersedia pada data ini; jangan menganggap tidak ada deteksi.</p>}</> }</section>
    <section className="batch-card no-print"><h2>Ekspor evidence normalisasi</h2><p>Hanya indikator, skor, cakupan, waktu, dan observasi terpilih. Tidak menyertakan metadata mentah, source URL, pesan, atau komentar. Indikator sendiri tetap dapat sensitif.</p><button className="batch-primary" disabled={!normalized} onClick={exportEvidence}>Ekspor evidence JSON</button>{!normalized && <p>Ekspor tidak tersedia: data tidak memenuhi kontrak snapshot atau indikator memuat pola rahasia yang ditolak. Lakukan pemeriksaan baru dengan indikator yang sudah dibersihkan.</p>}<p role="status">{exportNotice}</p></section>
  </main>;
}
