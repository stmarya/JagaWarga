'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addHistory, addXp } from '@/lib/client/storage';
import { Icon } from '@/components/icon';

const verdictLabels: Record<string, string> = {
  'high-risk': 'Risiko tinggi',
  suspicious: 'Mencurigakan',
  'no-indication': 'Belum ada tanda bahaya',
  'insufficient-data': 'Data belum cukup',
};

const indicatorLabels: Record<string, string> = {
  url: 'Tautan',
  domain: 'Domain',
  ipv4: 'Alamat IP',
  ipv6: 'Alamat IP',
  hash: 'Kode berkas',
  message: 'Pesan',
  'email-header': 'Header email',
};

function labelForIndicator(type: string) {
  return indicatorLabels[type.toLowerCase()] ?? type.replaceAll('-', ' ');
}

function labelForVerdict(verdict: string) {
  return verdictLabels[verdict] ?? verdict.replaceAll('-', ' ');
}

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
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupNotice, setLookupNotice] = useState('');
  const [openComments, setOpenComments] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then((response) => {
        if (!response.ok) throw new Error('HISTORY_LOAD_FAILED');
        return response.json();
      })
      .then(setHistory)
      .catch(() => setHistoryError('Riwayat belum dapat dimuat. Periksa koneksi lalu coba lagi.'))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => history.filter((item) => {
    const matchesText = item.indicator.displayValue.toLowerCase().includes(historyQuery.toLowerCase())
      || item.indicator.type.toLowerCase().includes(historyQuery.toLowerCase());
    return matchesText && (filter === 'all' || item.verdict === filter);
  }), [history, historyQuery, filter]);

  async function lookup(event: FormEvent) {
    event.preventDefault();
    if (!lookupValue.trim() || lookupLoading) return;
    setLookupLoading(true);
    setLookupNotice('');
    try {
      const response = await fetch('/api/lookups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicator: lookupValue }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'LOOKUP_FAILED');
      const shared = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result }),
      });
      const historyId = shared.ok ? (await shared.json()).id : '';
      addHistory({
        id: historyId || crypto.randomUUID(),
        type: result.indicator.type,
        displayValue: result.indicator.displayValue,
        verdict: result.verdict,
        checkedAt: result.checkedAt,
      });
      addXp(10);
      sessionStorage.setItem('jagawarga:last-result', JSON.stringify({ ...result, historyId }));
      router.push(historyId ? `/result?id=${encodeURIComponent(historyId)}` : '/result');
    } catch {
      setLookupNotice('Indikator tidak dapat diperiksa. Pastikan format URL, domain, IP, atau hash sudah benar.');
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <main className="compact-page history-page">
      <header className="page-heading">
        <div><p className="kicker">RIWAYAT KOMUNITAS</p><h1>Temukan pemeriksaan sebelumnya</h1><p>Cari tautan, alamat, atau berkas yang pernah diperiksa dan baca konteks dari warga lain.</p></div>
        <Link className="secondary-action" href="/periksa#scanner">Periksa sesuatu yang baru</Link>
      </header>


      <div className="history-section-heading"><div><p className="kicker">ARSIP PEMERIKSAAN</p><h2>Cari riwayat sebelumnya</h2></div></div>
      <section className="history-toolbar" aria-label="Cari dan filter riwayat">
        <label><span className="sr-only">Cari indikator</span><input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Cari di riwayat sebelumnya…" /></label>
        <label><span className="sr-only">Filter status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="high-risk">Risiko tinggi</option><option value="suspicious">Mencurigakan</option><option value="no-indication">Belum ada sinyal</option><option value="insufficient-data">Data kurang</option></select></label>
      </section>

      <section className="history-summary">
        <span><strong>{history.length}</strong> pemeriksaan tersimpan</span>
        <span><strong>{history.reduce((total, item) => total + item.comments.length, 0)}</strong> komentar warga</span>
        <span><strong>{history.filter((item) => item.verdict === 'high-risk').length}</strong> perlu diperhatikan</span>
      </section>

      {loading ? <div className="empty-card" role="status"><p>Memuat riwayat pemeriksaan…</p></div> : historyError ? <div className="empty-card" role="alert"><h2>Riwayat belum tersedia</h2><p>{historyError}</p><button type="button" className="primary-action" onClick={() => window.location.reload()}>Coba lagi</button></div> : rows.length ? (
        <div className="history-table">
          <div className="history-row history-head"><span>Indikator</span><span>Status</span><span>Skor</span><span>Komentar</span><span>Waktu</span></div>
          {rows.map((item) => <article className="history-entry" key={item.id}>
            <div className="history-row">
              <Link className="history-indicator" href={`/details?id=${encodeURIComponent(item.id)}`}><strong>{item.indicator.displayValue}</strong><small>{labelForIndicator(item.indicator.type)} · buka detail</small></Link>
              <span><b className={`status-chip status-${item.verdict}`}>{labelForVerdict(item.verdict)}</b></span>
              <span aria-label={`Tingkat risiko ${item.risk} dari 100`}>{item.risk}/100</span>
              <button className="comment-toggle" type="button" disabled={!item.comments.length} onClick={() => setOpenComments(openComments === item.id ? null : item.id)}>{item.comments.length ? `${item.comments.length} komentar` : 'Belum ada'}</button>
              <time>{new Date(item.checkedAt).toLocaleString('id-ID')}</time>
            </div>
            <div className="history-mobile-meta"><span><small>Tingkat risiko</small><strong>{item.risk}/100</strong></span><button className="comment-toggle" type="button" disabled={!item.comments.length} onClick={() => setOpenComments(openComments === item.id ? null : item.id)}>{item.comments.length ? `${item.comments.length} komentar` : 'Belum ada komentar'}</button><time>{new Date(item.checkedAt).toLocaleString('id-ID')}</time></div>
            {openComments === item.id && <div className="history-comments">{item.comments.map((comment) => <article key={comment.id}><div><strong>{comment.author}</strong><time>{new Date(comment.createdAt).toLocaleString('id-ID')}</time></div><p>{comment.message}</p></article>)}</div>}
          </article>)}
        </div>
      ) : (
        <div className="empty-card"><h2>Belum ada pemeriksaan</h2><p>Mulai dari tautan, alamat, atau berkas pertama Anda.</p><Link className="primary-action" href="/periksa#scanner">Mulai pemeriksaan</Link></div>
      )}

      <section className="dashboard-lookup dashboard-lookup-secondary" aria-labelledby="quick-lookup-title">
        <div className="dashboard-lookup-copy"><Icon name="search" size={26} /><div><h2 id="quick-lookup-title">Periksa sesuatu yang baru</h2><p>Tempel tautan atau alamat yang ingin diperiksa. Hasilnya dapat dibaca kembali oleh warga lain.</p></div></div>
        <form onSubmit={lookup}>
          <label className="sr-only" htmlFor="dashboard-lookup">Indikator yang ingin diperiksa</label>
          <input id="dashboard-lookup" value={lookupValue} onChange={(event) => setLookupValue(event.target.value)} placeholder="contoh.id atau alamat yang ingin diperiksa" autoComplete="off" spellCheck="false" />
          <button type="submit" disabled={!lookupValue.trim() || lookupLoading}>{lookupLoading ? 'Memeriksa…' : <>Periksa <Icon name="arrow" /></>}</button>
        </form>
        {lookupNotice && <p className="inline-alert" role="alert">{lookupNotice}</p>}
      </section>


      <aside className="privacy-banner"><strong>Catatan komunitas</strong><p>Jangan masukkan data pribadi, token, kata sandi, atau rahasia organisasi ke kolom pemeriksaan maupun komentar.</p></aside>
    </main>
  );
}
