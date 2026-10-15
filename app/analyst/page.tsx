'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EvidenceExplorer } from '@/components/evidence-explorer';
import { MAX_BATCH, MAX_INPUT_BYTES, parseBatch, type PreviewItem } from '@/lib/analyst/indicators';
import { downloadJson, readSnapshot, type LookupSnapshot } from '@/lib/analyst/snapshot';
import { listCases, saveCase } from '@/lib/analyst/cases';
import './analyst.css';

type Row = PreviewItem & { status: 'ready' | 'invalid' | 'running' | 'done' | 'failed'; result?: LookupSnapshot };

export default function AnalystPage() {
  const [text, setText] = useState('');
  const [csv, setCsv] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [consent, setConsent] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<LookupSnapshot | null>(null);
  const [caseOptions, setCaseOptions] = useState<{ id: string; title: string }[]>([]);
  const [caseId, setCaseId] = useState('');
  const controller = useRef<AbortController | null>(null);
  const paused = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    listCases().then((cases) => { if (mounted.current) setCaseOptions(cases); }).catch(() => {});
    if (new URLSearchParams(window.location.search).get('session') === '1') {
      try {
        const raw = sessionStorage.getItem('jagawarga:last-result');
        if (raw) setSelected(readSnapshot(JSON.parse(raw)));
      } catch { setMessage('Hasil sesi tidak kompatibel atau memuat parameter rahasia. Ulangi lookup tanpa data sensitif.'); }
    }
    return () => { mounted.current = false; paused.current = true; controller.current?.abort(); };
  }, []);

  function preview() {
    try {
      const parsed = parseBatch(text, csv);
      setRows(parsed.map((row) => ({ ...row, status: row.error ? 'invalid' : 'ready' })));
      setText(''); setConsent(false); setSelected(null); setMessage('Preview lokal siap. Input asli sudah dibuang dari form.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Input tidak valid.'); }
  }
  async function run() {
    if (running || !consent) return;
    paused.current = false; setRunning(true); setMessage('Lookup berjalan satu per satu.');
    const current = [...rows];
    try {
      for (let i = 0; i < current.length; i += 1) {
        if (paused.current || !mounted.current) break;
        if (current[i].status !== 'ready') continue;
        current[i] = { ...current[i], status: 'running', error: undefined };
        setRows([...current]);
        const abort = new AbortController(); controller.current = abort;
        const timeout = setTimeout(() => abort.abort(), 20_000);
        try {
          const response = await fetch('/api/lookups', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ indicator: current[i].value }), signal: abort.signal,
          });
          if (response.status === 429) {
            current[i] = { ...current[i], status: 'ready' };
            paused.current = true;
            setMessage('Batas lookup tercapai. Tunggu setidaknya satu menit sebelum melanjutkan.');
            break;
          }
          if (!response.ok) throw new Error(`Lookup gagal (HTTP ${response.status}).`);
          const result = readSnapshot(await response.json());
          current[i] = { ...current[i], status: 'done', result };
        } catch (e) {
          current[i] = { ...current[i], status: paused.current ? 'ready' : 'failed',
            error: paused.current ? undefined : e instanceof Error ? e.message : 'Lookup gagal.' };
        } finally { clearTimeout(timeout); controller.current = null; }
        if (mounted.current) setRows([...current]);
      }
    } finally {
      if (mounted.current) {
        setRows([...current]); setRunning(false);
        if (!paused.current) setMessage('Batch selesai. Tidak ada hasil yang otomatis disimpan sebagai kasus.');
      }
    }
  }
  async function attach() {
    try {
      const c = (await listCases()).find((item) => item.id === caseId);
      if (!c) throw new Error('Pilih atau buat kasus terlebih dahulu.');
      const snapshots = rows.flatMap((row) => row.result ? [row.result] : []);
      if (selected && !snapshots.some((s) => s.requestId === selected.requestId)) snapshots.push(selected);
      if (!snapshots.length) throw new Error('Belum ada hasil yang dapat disimpan.');
      const combined = [...c.snapshots];
      snapshots.forEach((s) => { if (!combined.some((old) => old.requestId === s.requestId)) combined.push(s); });
      await saveCase({ ...c, snapshots: combined, updatedAt: new Date().toISOString() }, c.updatedAt);
      setMessage('Evidence tersimpan di kasus lokal pada browser ini.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Gagal menyimpan.'); }
  }
  const visible = rows.filter((row) => filter === 'all' || row.status === filter || row.result?.verdict === filter);
  return <main className="compact-page analyst-page">
    <header className="page-heading"><div><p className="kicker">MODE ANALIS · ADVANCED MVP</p><h1>Investigasi berbasis bukti.</h1><p>Severity, confidence, dan coverage dipisahkan. Hasil bukan jaminan aman atau atribusi pelaku.</p></div></header>
    <p><Link href="/analyst/cases">Buka Case Workspace lokal →</Link></p>
    <section className="content-card">
      <h2>Bulk IoC triage</h2>
      <label htmlFor="batch-input">Satu URL, domain, IP publik, atau hash per baris (maksimal {MAX_BATCH})</label>
      <textarea id="batch-input" rows={6} value={text} disabled={running} onChange={(e) => setText(e.target.value)} maxLength={MAX_INPUT_BYTES} placeholder={'example.org\nhxxps://example[.]com/path'} />
      <label htmlFor="batch-file">Impor TXT / CSV satu kolom bernama indicator</label>
      <input id="batch-file" type="file" accept=".txt,.csv,text/plain,text/csv" disabled={running} onChange={async (e) => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        if (file.size > MAX_INPUT_BYTES) { setMessage('Berkas maksimal 64 KB.'); return; }
        try { setText(await file.text()); setCsv(file.name.toLowerCase().endsWith('.csv')); } catch { setMessage('Berkas tidak dapat dibaca.'); }
      }} />
      <label className="analyst-check"><input type="checkbox" checked={csv} disabled={running} onChange={(e) => setCsv(e.target.checked)} /> Format CSV satu kolom</label>
      <button type="button" onClick={preview} disabled={running || !text.trim()}>Preview lokal</button>
      <p>Preview dan deduplikasi berlangsung di browser. Hapus data pribadi, kredensial, dan token sebelum lookup. Parameter rahasia yang dikenali ditolak; pemeriksaan ini tidak mendeteksi semua rahasia.</p>
      {rows.length > 0 && <>
        <label className="analyst-check"><input type="checkbox" checked={consent} disabled={running} onChange={(e) => setConsent(e.target.checked)} /> Saya menyetujui pengiriman indikator valid ke server JagaWarga dan provider lookup yang aktif. Tidak ada file mentah atau submission baru.</label>
        <div className="analyst-actions">
          <button type="button" disabled={running || !consent || !rows.some((r) => r.status === 'ready')} onClick={run}>Mulai / lanjutkan lookup</button>
          <button type="button" disabled={!running} onClick={() => { paused.current = true; setMessage('Jeda setelah indikator aktif selesai.'); }}>Jeda</button>
          <button type="button" disabled={!running} onClick={() => { paused.current = true; controller.current?.abort(); setMessage('Dibatalkan. Permintaan yang sudah diterima server mungkin tetap selesai.'); }}>Batalkan</button>
          <button type="button" disabled={running || !rows.some((r) => r.status === 'failed')} onClick={() => setRows(rows.map((r) => r.status === 'failed' ? { ...r, status: 'ready', error: undefined } : r))}>Siapkan ulang yang gagal</button>
          <button type="button" disabled={running} onClick={() => { setRows([]); setSelected(null); setConsent(false); }}>Hapus hasil sesi</button>
          <button type="button" disabled={!rows.some((r) => r.result)} onClick={() => downloadJson('jagawarga-triage.json', { schemaVersion: 1, results: rows.flatMap((r) => r.result ? [r.result] : []) })}>Ekspor hasil JSON</button>
        </div>
        <label htmlFor="triage-filter">Filter hasil</label>
        <select id="triage-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {['all', 'ready', 'failed', 'invalid', 'high-risk', 'suspicious', 'no-indication', 'insufficient-data'].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <div className="analyst-scroll" tabIndex={0} role="region" aria-label="Tabel triage">
          <table><caption>{rows.filter((r) => r.status === 'done').length} / {rows.length} indikator selesai</caption><thead><tr><th scope="col">Indikator</th><th scope="col">Tipe</th><th scope="col">Status</th><th scope="col">Verdict</th><th scope="col">Evidence</th></tr></thead>
            <tbody>{visible.map((r, i) => <tr key={`${r.value}-${i}`}><th scope="row" className="analyst-indicator">{r.value}</th><td>{r.type}</td><td>{r.status}{r.error && <p>{r.error}</p>}</td><td>{r.result?.verdict ?? '—'}</td><td>{r.result && <button type="button" onClick={() => setSelected(r.result!)}>Lihat bukti {i + 1}</button>}</td></tr>)}</tbody>
          </table>
        </div>
      </>}
    </section>
    <p role="status" aria-live="polite">{message}</p>
    {selected && <EvidenceExplorer result={selected} />}
    {(rows.some((r) => r.result) || selected) && <section className="content-card">
      <h2>Simpan evidence ke kasus lokal</h2>
      <p>Hanya setelah Anda menekan tombol simpan. Data tidak terenkripsi oleh aplikasi; jangan gunakan browser bersama.</p>
      <label htmlFor="case-select">Kasus tujuan</label><select id="case-select" value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Pilih kasus</option>{caseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <button type="button" onClick={attach} disabled={!caseId || running}>Simpan evidence ke kasus</button>
    </section>}
  </main>;
}