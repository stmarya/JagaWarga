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
    link.href = URL.createObjectURL(new Blob([exportLocalData()], { type: 'application/json' }));
    link.download = 'jagawarga-local-data.json'; link.click(); URL.revokeObjectURL(link.href);
  }
  return <main className="page"><Link href="/">← Beranda</Link><p className="eyebrow">DASHBOARD LOKAL</p><h1>Progress dan data Anda.</h1><div className="grid"><section className="panel"><h2>{progress.xp} XP</h2><p>Badge: {progress.badges.join(', ') || 'Belum ada'}</p></section><section className="panel"><h2>Privasi</h2><button onClick={download}>Export data lokal</button> <button className="button-muted" onClick={() => { clearHistory(); refresh(); }}>Hapus riwayat</button> <button className="button-danger" onClick={() => { clearAllLocalData(); refresh(); }}>Hapus seluruh data lokal</button></section></div><section className="panel"><h2>Riwayat</h2>{history.length ? <ul>{history.map((item) => <li key={item.id}><strong>{item.displayValue}</strong> — {item.verdict} <button onClick={() => { addWatchlist(item.displayValue); refresh(); }}>Watch</button></li>)}</ul> : <p>Belum ada riwayat tersimpan.</p>}</section><section className="panel"><h2>Watchlist lokal</h2>{watchlist.length ? <ul>{watchlist.map((item) => <li key={item}>{item} <button className="button-danger" onClick={() => { removeWatchlist(item); refresh(); }}>Hapus</button></li>)}</ul> : <p>Belum ada item.</p>}</section></main>;
}