'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { clearHistory, exportLocalData, getHistory, removeHistory, type LocalHistoryItem } from '@/lib/client/storage';
import { deletePublication, getPublicationReceipts, type PublicationReceipt } from '@/lib/client/publications';
import { downloadJson, readSnapshot } from '@/lib/analyst/snapshot';

type PublicItem = { id: string; indicator: { type: string; displayValue: string }; verdict: string; checkedAt: string; expiresAt: string };
export default function Dashboard() {
  const [tab, setTab] = useState<'private' | 'community'>('private');
  const [history, setHistory] = useState<LocalHistoryItem[]>([]);
  const [community, setCommunity] = useState<PublicItem[]>([]);
  const [receipts, setReceipts] = useState<PublicationReceipt[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  function refreshLocal() { setHistory(getHistory()); setReceipts(getPublicationReceipts()); }
  useEffect(() => { refreshLocal(); const update = () => refreshLocal(); window.addEventListener('storage', update); return () => window.removeEventListener('storage', update); }, []);
  useEffect(() => {
    if (tab !== 'community') return;
    const controller = new AbortController(); setLoading(true);
    fetch('/api/history', { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error();
      setEnabled(response.headers.get('X-Community-Enabled') === 'true');
      const rows = await response.json(); if (!Array.isArray(rows)) throw new Error(); setCommunity(rows);
    }).catch(() => { if (!controller.signal.aborted) setNotice('Riwayat komunitas belum dapat dimuat. Riwayat pribadi tetap tersedia.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [tab]);
  const rows = useMemo(() => (tab === 'private' ? history.map((h) => ({ id: h.id, indicator: { type: h.type, displayValue: h.displayValue }, verdict: h.verdict, checkedAt: h.checkedAt })) : community)
    .filter((r) => `${r.indicator.displayValue} ${r.indicator.type}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || r.verdict === filter)), [tab, history, community, query, filter]);
  function openLocal(id: string) {
    try {
      const item = history.find((h) => h.id === id);
      if (!item?.snapshot) throw new Error('Riwayat lama hanya berisi ringkasan. Jalankan pemeriksaan baru untuk bukti terkini.');
      sessionStorage.setItem('jagawarga:last-result', JSON.stringify(readSnapshot(item.snapshot))); window.location.assign('/result');
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Hasil lokal tidak dapat dibuka.'); }
  }
  async function deleteShared(receipt: PublicationReceipt) {
    if (!window.confirm('Hapus publikasi ini dari server? Salinan yang sudah diunduh orang lain tidak dapat ditarik kembali.')) return;
    setBusy(true);
    try { await deletePublication(receipt); setCommunity((items) => items.filter((item) => item.id !== receipt.id)); refreshLocal(); setNotice('Publikasi dihapus dari server.'); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Penghapusan gagal.'); } finally { setBusy(false); }
  }
  return <main className="compact-page batch-page history-v2">
    <header className="batch-heading"><p className="batch-eyebrow">RIWAYAT PEMERIKSAAN</p><h1>Pribadi dan publik, dipisahkan.</h1><p>Pemeriksaan baru tidak dipublikasikan otomatis. Riwayat pribadi hanya disimpan jika Anda memilihnya di halaman Periksa.</p><Link className="batch-primary" href="/periksa">Mulai pemeriksaan</Link></header>
    <div className="batch-tabs" role="group" aria-label="Pilih jenis riwayat"><button type="button" aria-pressed={tab === 'private'} onClick={() => { setTab('private'); setNotice(''); }}>Riwayat saya (lokal)</button><button type="button" aria-pressed={tab === 'community'} onClick={() => { setTab('community'); setNotice(''); }}>Riwayat komunitas (publik)</button></div>
    <section className="batch-card"><h2>{tab === 'private' ? 'Hanya di browser ini' : 'Publikasi dengan persetujuan'}</h2>
      <p>{tab === 'private' ? 'Data tidak terenkripsi oleh aplikasi dan dapat hilang saat browser dibersihkan. Menghapus riwayat lokal tidak menghapus publikasi server.' : 'Hanya publikasi yang disetujui pemiliknya yang ditampilkan. Data kedaluwarsa maksimal 24 jam; bukan daftar semua pemeriksaan JagaWarga.'}</p>
      {tab === 'community' && !loading && !enabled && <p className="batch-alert">Fitur komunitas belum diaktifkan operator. Tidak ada publikasi otomatis.</p>}
      <div className="batch-filter"><label htmlFor="history-search">Cari indikator<input id="history-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Domain, IP, URL, atau hash" /></label><label htmlFor="history-verdict">Filter verdict<select id="history-verdict" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Semua verdict</option>{['high-risk', 'suspicious', 'no-indication', 'insufficient-data'].map((v) => <option key={v} value={v}>{v}</option>)}</select></label></div>
      {loading ? <p role="status">Memuat publikasi…</p> : <>
        <p>Menampilkan {rows.length} dari {tab === 'private' ? history.length : community.length} record.</p>
        <ul className="batch-history-list">{rows.map((row) => <li key={row.id}>
          <div><strong className="batch-indicator">{row.indicator.displayValue}</strong><p>{row.indicator.type} · {row.verdict}</p><small>Diperiksa {row.checkedAt}</small></div>
          <div className="batch-actions">{tab === 'private' ? <><button type="button" onClick={() => openLocal(row.id)}>Buka hasil lokal</button><button className="batch-danger-text" type="button" onClick={() => { removeHistory(row.id); refreshLocal(); }}>Hapus riwayat ini</button></> : <Link className="batch-secondary" href={`/result?id=${encodeURIComponent(row.id)}`}>Buka publikasi</Link>}</div>
        </li>)}</ul>
        {!rows.length && <div className="batch-empty"><strong>{query || filter !== 'all' ? 'Tidak ada hasil yang cocok.' : tab === 'private' ? 'Belum ada riwayat pribadi.' : 'Belum ada publikasi tersedia.'}</strong><p>{tab === 'private' ? 'Aktifkan “Simpan hasil IoC di riwayat browser ini” saat memeriksa bila Anda membutuhkannya.' : 'Pemeriksaan privat tidak otomatis masuk ke daftar ini.'}</p></div>}
      </>}
      {tab === 'private' && <div className="batch-actions"><button type="button" disabled={!history.length} onClick={() => { try { downloadJson('jagawarga-local-history.json', JSON.parse(exportLocalData())); } catch { setNotice('Ekspor belum berhasil.'); } }}>Ekspor data lokal</button><button className="batch-danger-text" type="button" disabled={!history.length} onClick={() => { if (window.confirm('Hapus seluruh riwayat pribadi di browser ini? Publikasi server dan kasus tidak ikut dihapus.')) { clearHistory(); refreshLocal(); setNotice('Riwayat pribadi dihapus.'); } }}>Hapus semua riwayat pribadi</button></div>}
    </section>
    {tab === 'community' && receipts.length > 0 && <section className="batch-card"><h2>Publikasi saya yang masih berlaku</h2><p>Bukti penghapusan hanya ada di browser ini. Penghapusan tetap tersedia saat operator menonaktifkan publikasi baru.</p><ul className="batch-history-list">{receipts.map((receipt) => <li key={receipt.id}><div><strong>Publikasi {receipt.id.slice(0, 8)}</strong><p>Kedaluwarsa {receipt.expiresAt}</p></div><button type="button" className="batch-danger-text" disabled={busy} onClick={() => deleteShared(receipt)}>Hapus publikasi saya</button></li>)}</ul></section>}
    <p className="batch-notice" role="status" aria-live="polite">{notice}</p><p><Link href="/privacy">Kelola seluruh data dan pengaturan privasi →</Link></p>
  </main>;
}
