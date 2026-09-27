'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { addWatchlist, clearAllLocalData, clearHistory, exportLocalData, getHistory, getProgress, getWatchlist, LocalHistoryItem, removeWatchlist } from '@/lib/client/storage';

export default function Dashboard() {
  const [history, setHistory] = useState<LocalHistoryItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [progress, setProgress] = useState({ xp: 0, badges: [] as string[] });
  const refresh = () => { setHistory(getHistory()); setWatchlist(getWatchlist()); setProgress(getProgress()); };
  useEffect(refresh, []);
  function download() {
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([exportLocalData()], { type: 'application/json' }));
    link.href = url;
    link.download = 'jagawarga-local-data.json'; link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return <main className="page dashboard-page">
    <Link href="/">← Beranda</Link>
    <p className="eyebrow">DASHBOARD LOKAL</p>
    <h1>Progress dan data Anda.</h1>
    <div className="dashboard-summary">
      <section className="panel stat-panel"><span>PROGRESS</span><h2>{progress.xp} XP</h2><p>Badge: {progress.badges.join(', ') || 'Belum ada'}</p></section>
      <section className="panel stat-panel"><span>RIWAYAT</span><h2>{history.length}</h2><p>Pemeriksaan tersimpan di perangkat ini.</p></section>
      <section className="panel stat-panel"><span>WATCHLIST</span><h2>{watchlist.length}</h2><p>Indikator yang sedang Anda pantau.</p></section>
    </div>
    <section className="panel privacy-panel">
      <div><p className="eyebrow">KONTROL PRIVASI</p><h2>Data tetap di perangkat Anda.</h2><p>Ekspor salinan atau hapus data lokal kapan saja.</p></div>
      <div className="panel-actions"><button onClick={download}>Ekspor data</button><button className="button-muted" onClick={() => { clearHistory(); refresh(); }}>Hapus riwayat</button><button className="button-danger" onClick={() => { clearAllLocalData(); refresh(); }}>Hapus semua</button></div>
    </section>
    <section className="panel history-panel">
      <div className="section-heading"><div><p className="eyebrow">AKTIVITAS TERBARU</p><h2>Riwayat pemeriksaan</h2></div><Link href="/#scanner">Pemeriksaan baru →</Link></div>
      {history.length ? <div className="history-list">{history.map((item) => <article key={item.id}><div className="history-main"><span className={`verdict-dot verdict-${item.verdict}`} aria-hidden="true" /><div><strong>{item.displayValue}</strong><small>{item.type} · {new Date(item.checkedAt).toLocaleString('id-ID')}</small></div></div><span className={`verdict-label verdict-${item.verdict}`}>{item.verdict}</span><button className="button-muted" onClick={() => { addWatchlist(item.displayValue); refresh(); }}>Pantau</button></article>)}</div> : <div className="empty-state"><strong>Belum ada riwayat</strong><p>Aktifkan “Simpan di perangkat ini” saat melakukan pemeriksaan.</p><Link className="button button-secondary" href="/#scanner">Mulai pemeriksaan</Link></div>}
    </section>
    <section className="panel watchlist-panel"><div className="section-heading"><div><p className="eyebrow">PEMANTAUAN</p><h2>Watchlist lokal</h2></div></div>{watchlist.length ? <ul>{watchlist.map((item) => <li key={item}><span>{item}</span><button className="button-danger" onClick={() => { removeWatchlist(item); refresh(); }}>Hapus</button></li>)}</ul> : <p>Belum ada indikator yang dipantau.</p>}</section>
  </main>;
}
