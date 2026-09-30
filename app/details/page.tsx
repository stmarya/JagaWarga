'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Evidence = {
  provider: string;
  verdict: string;
  confidence: number;
  observedAt: string | null;
  fetchedAt: string;
  reasonCodes: string[];
  sourceUrl?: string;
  details?: {
    resourceId?: string | null;
    resourceType?: string | null;
    attributes?: Record<string, unknown>;
  };
};

type Result = {
  indicator: { type: string; displayValue: string };
  risk: number;
  verdict: string;
  confidence: string;
  checkedAt: string;
  requestId: string;
  evidence: Evidence[];
  providers: { requested: string[]; succeeded: string[]; failed: string[] };
};

type Comment = { id: string; author: string; message: string; createdAt: string };

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

export default function DetailsPage() {
  const [result, setResult] = useState<Result | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    const local = sessionStorage.getItem('jagawarga:last-result');
    if (local) {
      const parsed = JSON.parse(local);
      if (!id || parsed.historyId === id) {
        setResult(parsed);
        setLoading(false);
        return;
      }
    }
    if (id) fetch(`/api/history?id=${encodeURIComponent(id)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((item) => {
        setResult(item?.result ?? null);
        setComments(item?.comments ?? []);
      })
      .finally(() => setLoading(false));
    else setLoading(false);
  }, []);

  if (loading) return <main className="compact-page"><p>Memuat detail…</p></main>;
  if (!result?.evidence) return <main className="compact-page"><div className="empty-card"><h1>Detail tidak tersedia</h1><Link className="primary-action" href="/#scanner">Periksa indikator</Link></div></main>;

  const vt = result.evidence.find((item) => item.provider === 'virustotal');
  const attributes = vt?.details?.attributes ?? {};
  const stats = (attributes.last_analysis_stats ?? {}) as Record<string, number>;
  const engines = Object.values((attributes.last_analysis_results ?? {}) as Record<string, Record<string, unknown>>);
  const metadata = Object.entries(attributes).filter(([key]) => !['last_analysis_results', 'last_analysis_stats'].includes(key));

  return (
    <main className="compact-page detail-page">
      <nav className="breadcrumb"><Link href="/dashboard">Riwayat</Link><span>→</span><Link href="/result">Hasil</Link><span>→</span><span>Detail</span></nav>
      <header className="detail-header">
        <div><p className="step-label">DETAIL TEKNIS IOC</p><h1>Respons sumber lengkap</h1><p>Data teknis dipisahkan dari ringkasan agar hasil utama tetap mudah dipahami.</p></div>
        <span className="verdict-pill">{result.verdict.replaceAll('-', ' ')}</span>
      </header>
      <section className="facts-grid">
        <div><span>Indikator</span><strong>{result.indicator.displayValue}</strong></div>
        <div><span>Tipe</span><strong>{result.indicator.type}</strong></div>
        <div><span>Skor</span><strong>{result.risk}/100</strong></div>
        <div><span>Keyakinan</span><strong>{result.confidence}</strong></div>
        <div><span>Waktu</span><strong>{new Date(result.checkedAt).toLocaleString('id-ID')}</strong></div>
        <div><span>Request ID</span><strong>{result.requestId}</strong></div>
      </section>

      {!vt ? <section className="content-card"><h2>VirusTotal belum aktif</h2><p>Konfigurasikan provider dan API key VirusTotal untuk memperoleh detail reputasi.</p></section> : (
        <>
          <section className="content-card">
            <div className="section-title"><div><p className="step-label">VIRUSTOTAL</p><h2>Ringkasan analisis mesin</h2></div>{vt.sourceUrl && <a className="secondary-action" href={vt.sourceUrl} target="_blank" rel="noreferrer">Buka di VirusTotal ↗</a>}</div>
            <div className="stat-grid">{Object.entries(stats).map(([name, count]) => <div key={name} className={`stat stat-${name}`}><strong>{count}</strong><span>{name}</span></div>)}</div>
          </section>
          <section className="content-card">
            <h2>Metadata</h2>
            <div className="metadata-table">{metadata.map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><pre>{display(value)}</pre></div>)}</div>
          </section>
          <section className="content-card">
            <h2>Hasil setiap mesin ({engines.length})</h2>
            {engines.length ? <div className="engine-table"><div className="table-row table-head"><span>Mesin</span><span>Kategori</span><span>Hasil</span><span>Pembaruan</span></div>{engines.map((engine, index) => <div className="table-row" key={`${engine.engine_name}-${index}`}><strong>{display(engine.engine_name)}</strong><span>{display(engine.category)}</span><span>{display(engine.result)}</span><span>{display(engine.engine_update)}</span></div>)}</div> : <p>Belum ada hasil per mesin pada respons ini.</p>}
          </section>
        </>
      )}

      <section className="content-card">
        <h2>Semua sumber</h2>
        <div className="provider-list">{result.evidence.map((item) => <article key={item.provider}><strong>{item.provider}</strong><span>{item.verdict} · confidence {Math.round(item.confidence * 100)}%</span><small>{item.reasonCodes.join(', ')}</small></article>)}</div>
      </section>
      <section className="content-card">
        <h2>Komentar warga ({comments.length})</h2>
        {comments.length ? <div className="comment-list">{comments.map((comment) => <article key={comment.id}><strong>{comment.author}</strong><p>{comment.message}</p><time>{new Date(comment.createdAt).toLocaleString('id-ID')}</time></article>)}</div> : <p>Belum ada komentar untuk pemeriksaan ini.</p>}
      </section>
    </main>
  );
}