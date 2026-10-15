'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EvidenceExplorer } from '@/components/evidence-explorer';
import { InvestigationNav } from '@/components/investigation-nav';
import { MAX_BATCH, MAX_INPUT_BYTES, parseBatch } from '@/lib/analyst/indicators';
import { downloadJson, readSnapshot, type LookupSnapshot } from '@/lib/analyst/snapshot';
import { listCases, saveCase } from '@/lib/analyst/cases';
import { mergeSnapshots, nextCaseUpdatedAt, retryDelayMs, rowLabels, triageCounts, type TriageRow } from '@/lib/analyst/workflow';
import './analyst.css';

export default function AnalystPage() {
  const [text, setText] = useState(''); const [csv, setCsv] = useState(false);
  const [rows, setRows] = useState<TriageRow[]>([]); const [consent, setConsent] = useState(false);
  const [running, setRunning] = useState(false); const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); const [selected, setSelected] = useState<LookupSnapshot | null>(null);
  const [caseOptions, setCaseOptions] = useState<{ id: string; title: string }[]>([]); const [caseId, setCaseId] = useState('');
  const [attachScope, setAttachScope] = useState('selected'); const [attaching, setAttaching] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0); const [clock, setClock] = useState(Date.now());
  const controller = useRef<AbortController | null>(null); const paused = useRef(false); const mounted = useRef(true); const activeRun = useRef(false);
  const evidenceHeading = useRef<HTMLHeadingElement>(null); const inputDetails = useRef<HTMLDetailsElement>(null);
  async function refreshCases() { try { const cases = await listCases(); if (mounted.current) setCaseOptions(cases); } catch { setMessage('Kasus lokal tidak dapat dibaca. IndexedDB mungkin tidak tersedia; tidak ada fallback ke server.'); } }
  useEffect(() => {
    mounted.current = true; void refreshCases();
    if (new URLSearchParams(window.location.search).get('session') === '1') {
      try { const raw = sessionStorage.getItem('jagawarga:last-result'); if (raw) setSelected(readSnapshot(JSON.parse(raw))); else setMessage('Tidak ada hasil pada sesi ini. Mulai dengan preview lokal.'); }
      catch { setMessage('Hasil sesi tidak kompatibel atau memuat parameter rahasia. Ulangi lookup tanpa data sensitif.'); }
    }
    return () => { mounted.current = false; paused.current = true; controller.current?.abort(); };
  }, []);
  useEffect(() => { if (!cooldownUntil) return; const timer = setInterval(() => { const now = Date.now(); setClock(now); if (now >= cooldownUntil) setCooldownUntil(0); }, 500); return () => clearInterval(timer); }, [cooldownUntil]);
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));
  function preview() {
    if (rows.length && !window.confirm('Ganti batch ini? Hasil sesi yang belum disimpan atau diekspor akan dibuang.')) return;
    try {
      const parsed = parseBatch(text, csv); if (!parsed.length) throw new Error('Masukkan minimal satu indikator.');
      setRows(parsed.map((row) => ({ ...row, status: row.error ? 'invalid' : 'ready' })));
      setText(''); setConsent(false); setSelected(null); setFilter('all');
      if (inputDetails.current) inputDetails.current.open = false;
      setMessage('Preview lokal siap. Input asli sudah dibuang dari form. Tinjau antrean lalu berikan persetujuan.');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Input tidak valid.'); }
  }
  async function run() {
    if (activeRun.current || !consent || Date.now() < cooldownUntil) return;
    activeRun.current = true; paused.current = false; setRunning(true); setMessage('Lookup berjalan satu per satu.');
    const current = [...rows];
    try {
      for (let i = 0; i < current.length; i += 1) {
        if (paused.current || !mounted.current) break; if (current[i].status !== 'ready') continue;
        current[i] = { ...current[i], status: 'running', error: undefined }; setRows([...current]);
        const abort = new AbortController(); controller.current = abort;
        const timeout = setTimeout(() => abort.abort(), 20_000);
        try {
          const response = await fetch('/api/lookups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ indicator: current[i].value }), signal: abort.signal });
          if (response.status === 429) {
            current[i] = { ...current[i], status: 'ready' }; paused.current = true;
            const until = Date.now() + retryDelayMs(response.headers.get('Retry-After')); setCooldownUntil(until); setClock(Date.now());
            setMessage('Batas lookup tercapai. Antrean dijeda; lanjutkan secara manual setelah waktu tunggu.'); break;
          }
          if (!response.ok) throw new Error(`Lookup gagal (HTTP ${response.status}).`);
          const result = readSnapshot(await response.json()); current[i] = { ...current[i], status: 'done', result };
        } catch (e) {
          current[i] = { ...current[i], status: paused.current ? 'ready' : 'failed', error: paused.current ? undefined : e instanceof Error && e.name === 'AbortError' ? 'Waktu tunggu habis. Anda dapat menyiapkan ulang indikator ini.' : e instanceof Error ? e.message : 'Lookup gagal.' };
        } finally { clearTimeout(timeout); controller.current = null; }
        if (mounted.current) setRows([...current]);
      }
    } finally {
      activeRun.current = false;
      if (mounted.current) { setRows([...current]); setRunning(false); if (!paused.current) setMessage('Batch selesai. Tidak ada hasil yang otomatis disimpan sebagai kasus.'); }
    }
  }
  function viewEvidence(result: LookupSnapshot) { setSelected(result); requestAnimationFrame(() => { evidenceHeading.current?.focus({ preventScroll: true }); evidenceHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }); }
  const snapshots = attachScope === 'selected' ? selected ? [selected] : [] : rows.flatMap((row) => row.result ? [row.result] : []);
  async function attach() {
    if (attaching) return; setAttaching(true);
    try {
      const c = (await listCases()).find((item) => item.id === caseId); if (!c) throw new Error('Pilih atau buat kasus terlebih dahulu.');
      if (!snapshots.length) throw new Error('Belum ada bukti pada lingkup yang dipilih.');
      const combined = mergeSnapshots(c.snapshots, snapshots);
      if (combined.length === c.snapshots.length) { setMessage('Semua evidence pilihan sudah ada di kasus ini; tidak ada duplikasi.'); return; }
      await saveCase({ ...c, snapshots: combined, updatedAt: nextCaseUpdatedAt(c.updatedAt) }, c.updatedAt, true);
      setMessage(`${combined.length - c.snapshots.length} evidence tersimpan di kasus lokal pada browser ini.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Gagal menyimpan.'); } finally { setAttaching(false); }
  }
  const counts = triageCounts(rows); const visible = rows.filter((row) => filter === 'all' || row.status === filter || row.result?.verdict === filter);
  const evidenceButton = (r: TriageRow) => r.result && <button type="button" className="batch-secondary" onClick={() => viewEvidence(r.result!)}>Lihat bukti {rows.indexOf(r) + 1}</button>;
  return <main className="compact-page analyst-page batch-page">
    <InvestigationNav current="triage" /><header className="batch-heading"><p className="batch-eyebrow">MODE ANALIS · BULK IOC TRIAGE</p><h1>Tinjau indikator. Telusuri buktinya.</h1><p>Severity, confidence, dan coverage dipisahkan. Hasil bukan jaminan aman atau atribusi pelaku.</p></header>
    <aside className="batch-alert"><strong>Hasil batch hanya di memori halaman.</strong><p>Simpan ke kasus atau ekspor sebelum meninggalkan halaman. Tidak ada publikasi komunitas, penyimpanan kasus, atau submission analisis baru secara otomatis.</p></aside>
    <section className="content-card batch-card triage-input"><h2>Bulk IoC triage</h2><details ref={inputDetails} open><summary>1. Masukkan atau impor indikator</summary>
      <label htmlFor="batch-input">Satu URL, domain, IP publik, atau hash per baris (maksimal {MAX_BATCH})</label><textarea id="batch-input" rows={5} value={text} disabled={running} onChange={(e) => setText(e.target.value)} maxLength={MAX_INPUT_BYTES} placeholder={'example.org\nhxxps://example[.]com/path'} />
      <label htmlFor="batch-file">Impor TXT / CSV satu kolom bernama indicator</label><input id="batch-file" type="file" accept=".txt,.csv,text/plain,text/csv" disabled={running} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; if (file.size > MAX_INPUT_BYTES) { setMessage('Berkas maksimal 64 KB.'); return; } try { setText(await file.text()); setCsv(file.name.toLowerCase().endsWith('.csv')); } catch { setMessage('Berkas tidak dapat dibaca.'); } }} />
      <label className="analyst-check"><input type="checkbox" checked={csv} disabled={running} onChange={(e) => setCsv(e.target.checked)} /> Format CSV satu kolom</label><button className="batch-primary" type="button" onClick={preview} disabled={running || !text.trim()}>Preview lokal</button><p>Preview dan deduplikasi berlangsung di browser. Hapus data pribadi, kredensial, dan token sebelum lookup. Parameter rahasia yang dikenali ditolak; pemeriksaan ini tidak mendeteksi semua rahasia.</p>
    </details></section>
    {rows.length > 0 && <section className="content-card batch-card" aria-labelledby="queue-title"><h2 id="queue-title">2. Tinjau dan jalankan antrean</h2>
      <p>{counts.valid} indikator valid · {counts.invalid} ditolak · {counts.ready} menunggu · {counts.failed} gagal</p><label htmlFor="triage-progress">{counts.done} / {counts.valid} indikator valid selesai</label><progress id="triage-progress" max={Math.max(1, counts.valid)} value={counts.done + counts.failed} /><p>Kemajuan menghitung hasil selesai atau gagal; bukan persentase indikator aman.</p>
      <label className="analyst-check"><input type="checkbox" checked={consent} disabled={running} onChange={(e) => setConsent(e.target.checked)} /> Saya menyetujui pengiriman indikator valid ke server JagaWarga dan provider lookup yang aktif. Tidak ada file mentah atau submission baru.</label>
      <div className="analyst-actions"><button className="batch-primary" type="button" disabled={running || !consent || !counts.ready || cooldown > 0} onClick={run}>Mulai / lanjutkan lookup</button><button type="button" disabled={!running} onClick={() => { paused.current = true; setMessage('Jeda setelah indikator aktif selesai.'); }}>Jeda</button><button type="button" disabled={!running} onClick={() => { paused.current = true; controller.current?.abort(); setMessage('Dibatalkan. Permintaan yang sudah diterima server mungkin tetap selesai.'); }}>Batalkan</button></div>
      {cooldown > 0 && <p className="batch-alert">Tunggu {cooldown} detik sebelum melanjutkan. Tidak ada retry otomatis.</p>}
      <details><summary>Pemulihan, ekspor, dan pembersihan sesi</summary><div className="analyst-actions"><button type="button" disabled={running || !counts.failed} onClick={() => { setRows(rows.map((r) => r.status === 'failed' ? { ...r, status: 'ready', error: undefined } : r)); setMessage('Indikator gagal siap dicoba ulang. Persetujuan dan waktu tunggu tetap berlaku.'); }}>Siapkan ulang yang gagal</button><button type="button" disabled={running || !counts.done} onClick={() => { try { downloadJson('jagawarga-triage.json', { schemaVersion: 1, results: rows.flatMap((r) => r.result ? [readSnapshot(r.result)] : []) }); setMessage('Hasil selesai diekspor; baris gagal atau ditolak tidak disertakan.'); } catch { setMessage('Ekspor hasil gagal.'); } }}>Ekspor hasil JSON</button><button className="batch-danger-text" type="button" disabled={running} onClick={() => { if (window.confirm('Hapus hasil sesi? Kasus yang sudah disimpan tidak ikut dihapus.')) { setRows([]); setSelected(null); setConsent(false); setMessage('Hasil sesi dibuang. Kasus lokal tidak dihapus.'); if (inputDetails.current) inputDetails.current.open = true; } }}>Hapus hasil sesi</button></div></details>
      <label htmlFor="triage-filter">Filter hasil</label><select id="triage-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>{Object.entries({ all: 'Semua hasil', ready: 'Menunggu', running: 'Sedang diperiksa', done: 'Selesai', failed: 'Gagal', invalid: 'Ditolak', 'high-risk': 'Bahaya tinggi', suspicious: 'Mencurigakan', 'no-indication': 'Belum ada indikasi', 'insufficient-data': 'Data belum cukup' }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <div className="triage-desktop analyst-scroll" tabIndex={0} role="region" aria-label="Tabel triage"><table><caption>{counts.done} / {rows.length} indikator selesai · menampilkan {visible.length} baris</caption><thead><tr><th scope="col">Indikator</th><th scope="col">Tipe</th><th scope="col">Status</th><th scope="col">Verdict</th><th scope="col">Evidence</th></tr></thead><tbody>{visible.map((r) => <tr key={rows.indexOf(r)}><th scope="row" className="analyst-indicator">{r.value}</th><td>{r.type}</td><td>{rowLabels[r.status]} ({r.status}){r.error && <p>{r.error}</p>}</td><td>{r.result?.verdict ?? 'Belum ada hasil'}</td><td>{evidenceButton(r)}</td></tr>)}</tbody></table></div>
      <ul className="triage-mobile-list" aria-label="Hasil triage">{visible.map((r) => <li key={rows.indexOf(r)}><strong className="analyst-indicator">{r.value}</strong><p>{r.type} · {rowLabels[r.status]} ({r.status})</p>{r.error && <p className="triage-error">{r.error}</p>}<p>Verdict: {r.result?.verdict ?? 'Belum ada hasil'}</p>{evidenceButton(r)}</li>)}</ul>{!visible.length && <p>Tidak ada hasil yang cocok dengan filter ini.</p>}
    </section>}
    <p role="status" aria-live="polite" className="batch-notice">{message}</p>
    {selected && <div><h2 ref={evidenceHeading} tabIndex={-1} className="evidence-selection-heading">3. Evidence pilihan</h2><EvidenceExplorer result={selected} /></div>}
    {(counts.done > 0 || selected) && <section className="content-card batch-card"><h2>Simpan evidence ke kasus lokal</h2><p>Hanya setelah Anda menekan tombol simpan. Data tidak terenkripsi oleh aplikasi; jangan gunakan browser bersama.</p>
      <label htmlFor="attach-scope">Evidence yang disimpan</label><select id="attach-scope" value={attachScope} onChange={(e) => setAttachScope(e.target.value)}><option value="selected">Hanya evidence pilihan ({selected ? 1 : 0})</option><option value="batch">Semua hasil batch yang selesai ({counts.done})</option></select><p>{snapshots.length} snapshot akan ditinjau untuk ditambahkan; request ID yang sama tidak diduplikasi.</p>
      <label htmlFor="case-select">Kasus tujuan</label><select id="case-select" value={caseId} onChange={(e) => setCaseId(e.target.value)}><option value="">Pilih kasus</option>{caseOptions.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select><div className="batch-actions"><button className="batch-primary" type="button" onClick={attach} disabled={!caseId || !snapshots.length || running || attaching}>Simpan evidence ke kasus</button><button type="button" onClick={refreshCases} disabled={attaching}>Muat ulang daftar kasus</button><Link className="batch-secondary" href="/analyst/cases" target="_blank" rel="noopener noreferrer">Buat kasus di tab baru ↗</Link></div>
    </section>}
  </main>;
}
