'use client';
import Link from 'next/link';
import { ChangeEvent, useEffect, useState } from 'react';
import { addWatchlist, clearAllLocalData, getHistory, getWatchlist, LocalHistoryItem, removeWatchlist } from '@/lib/client/storage';

export default function Dashboard() {
  const [history, setHistory] = useState<LocalHistoryItem[]>([]); const [watchlist, setWatchlist] = useState<string[]>([]);
  const [fileName, setFileName] = useState(''); const [fileHash, setFileHash] = useState('');
  const refresh = () => { setHistory(getHistory()); setWatchlist(getWatchlist()); }; useEffect(refresh, []);
  async function selectFile(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()); setFileHash([...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')); }
  return <main className="workspace">
    <aside className="workspace-nav"><p className="workspace-user">DW<br /><small>RUANG LOKAL</small></p><Link className="active" href="/dashboard">▦ RINGKASAN</Link><Link href="/#scanner">⌕ CEK IOC</Link><Link href="/tools/file-hash">⇧ CEK FILE</Link><Link href="/emergency">! DARURAT</Link><button className="button-danger" onClick={() => { clearAllLocalData(); refresh(); }}>HAPUS DATA</button></aside>
    <div className="workspace-main">
      <header className="workspace-header"><div><p className="eyebrow">/// RUANG SAYA</p><h1>CEK. SIMPAN. PANTAU.</h1></div><Link className="button" href="/#scanner">+ CEK IOC</Link></header>
      <section className="upload-panel"><div className="tool-tabs"><span className="active">⇧ FILE</span><Link href="/#scanner"># IOC</Link><Link href="/tools/message">↗ PESAN</Link></div><label className="dropzone" htmlFor="dashboard-file"><strong>{fileName || 'TARIK FILE KE SINI'}</strong><span>{fileHash ? 'HASH SIAP — salin untuk dicek' : 'atau klik untuk memilih · diproses lokal'}</span><b>{fileHash ? fileHash : 'PILIH FILE'}</b><input id="dashboard-file" type="file" onChange={selectFile} /></label></section>
      <section className="activity-panel"><div className="section-heading"><div><p className="eyebrow">/// AKTIVITAS</p><h2>HASIL TERBARU</h2></div><span>{history.length} TERSIMPAN</span></div>
        {history.length ? <div className="activity-table"><div className="table-head"><span>INDIKATOR</span><span>HASIL</span><span>WAKTU</span><span>AKSI</span></div>{history.map((item) => <article key={item.id}><div><strong>{item.displayValue}</strong><small>{item.type.toUpperCase()}</small></div><span className={`verdict-label verdict-${item.verdict}`}>{item.verdict.replace('-', ' ').toUpperCase()}</span><time>{new Date(item.checkedAt).toLocaleString('id-ID')}</time><button className="button-muted" onClick={() => { addWatchlist(item.displayValue); refresh(); }}>PANTAU</button></article>)}</div> : <div className="empty-state"><strong>BELUM ADA HASIL</strong><p>Simpan hasil cek IoC untuk melihatnya di sini.</p><Link className="button" href="/#scanner">CEK SEKARANG →</Link></div>}
      </section>
      <section className="watchlist-panel panel"><div className="section-heading"><div><p className="eyebrow">/// WATCHLIST</p><h2>DIPANTAU</h2></div></div>{watchlist.length ? <ul>{watchlist.map((item) => <li key={item}><span>{item}</span><button className="button-danger" onClick={() => { removeWatchlist(item); refresh(); }}>HAPUS</button></li>)}</ul> : <p>Belum ada indikator.</p>}</section>
    </div>
  </main>;
}
