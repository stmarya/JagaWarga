'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type HistoryItem = {
  id: string;
  indicator: { type: string; displayValue: string };
  verdict: string;
  risk: number;
  confidence: string;
  checkedAt: string;
  comments: Array<{ id: string; author: string; message: string; createdAt: string }>;
};

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/history')
      .then((response) => response.ok ? response.json() : [])
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => history.filter((item) => {
    const matchesText = item.indicator.displayValue.toLowerCase().includes(query.toLowerCase())
      || item.indicator.type.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === 'all' || item.verdict === filter);
  }), [history, query, filter]);

  return (
    <main className="compact-page history-page">
      <header className="page-heading">
        <div><p className="kicker">RIWAYAT KOMUNITAS</p><h1>Hasil yang sudah diperiksa</h1><p>Temukan indikator yang pernah dicek dan baca konteks dari warga lain.</p></div>
        <Link className="primary-action" href="/#scanner">+ Cek indikator</Link>
      </header>

      <section className="history-toolbar">
        <label><span className="sr-only">Cari indikator</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari URL, domain, IP, atau hash…" /></label>
        <label><span className="sr-only">Filter status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="high-risk">Risiko tinggi</option><option value="suspicious">Mencurigakan</option><option value="no-indication">Belum ada sinyal</option><option value="insufficient-data">Data kurang</option></select></label>
      </section>

      <section className="history-summary">
        <span><strong>{history.length}</strong> pemeriksaan</span>
        <span><strong>{history.reduce((total, item) => total + item.comments.length, 0)}</strong> komentar</span>
        <span><strong>{history.filter((item) => item.verdict === 'high-risk').length}</strong> risiko tinggi</span>
      </section>

      {loading ? <div className="empty-card"><p>Memuat riwayat…</p></div> : rows.length ? (
        <div className="history-table">
          <div className="history-row history-head"><span>Indikator</span><span>Status</span><span>Skor</span><span>Komentar</span><span>Waktu</span></div>
          {rows.map((item) => (
            <Link className="history-row" href={`/details?id=${encodeURIComponent(item.id)}`} key={item.id}>
              <span className="history-indicator"><strong>{item.indicator.displayValue}</strong><small>{item.indicator.type.toUpperCase()}</small></span>
              <span><b className={`status-chip status-${item.verdict}`}>{item.verdict.replaceAll('-', ' ')}</b></span>
              <span>{item.risk}/100</span>
              <span>{item.comments.length ? `${item.comments.length} komentar` : 'Belum ada'}</span>
              <time>{new Date(item.checkedAt).toLocaleString('id-ID')}</time>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-card"><h2>Belum ada hasil yang cocok</h2><p>Coba kata kunci lain atau mulai pemeriksaan baru.</p><Link className="primary-action" href="/#scanner">Mulai cek</Link></div>
      )}

      <aside className="privacy-banner"><strong>Catatan komunitas</strong><p>Jangan masukkan data pribadi, token, kata sandi, atau rahasia organisasi ke kolom pemeriksaan maupun komentar.</p></aside>
    </main>
  );
}