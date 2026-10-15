'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { casePackage, deleteAllCases, deleteCase, listCases, parseCaseImport, saveCase, type InvestigationCase } from '@/lib/analyst/cases';
import { downloadJson, type LookupSnapshot } from '@/lib/analyst/snapshot';
import { caseIsDirty, nextCaseUpdatedAt } from '@/lib/analyst/workflow';
import { EvidenceExplorer } from '@/components/evidence-explorer';
import { InvestigationNav } from '@/components/investigation-nav';
import '../analyst.css';
export default function CasesPage() {
  const [cases, setCases] = useState<InvestigationCase[]>([]); const [draft, setDraft] = useState<InvestigationCase | null>(null); const [baseline, setBaseline] = useState<InvestigationCase | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<LookupSnapshot | null>(null); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [storageError, setStorageError] = useState('');
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('all');
  const editorHeading = useRef<HTMLHeadingElement>(null); const evidenceHeading = useRef<HTMLHeadingElement>(null);
  const dirty = caseIsDirty(draft, baseline); const persisted = Boolean(draft && savedId === draft.id);
  async function refresh() { try { setCases(await listCases()); setStorageError(''); } catch (e) { setStorageError(e instanceof Error ? e.message : 'IndexedDB tidak tersedia.'); throw e; } finally { setLoading(false); } }
  useEffect(() => { void refresh().catch(() => {}); }, []);
  useEffect(() => {
    if (!dirty) return; let approved = false;
    const warn = (event: BeforeUnloadEvent) => { if (!approved) { event.preventDefault(); event.returnValue = ''; } };
    const guardLink = (event: MouseEvent) => {
      const a = event.target instanceof Element ? event.target.closest('a') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const to = new URL(a.href, location.href); if (to.origin !== location.origin || to.pathname === location.pathname) return;
      if (!window.confirm('Perubahan kasus belum disimpan. Tinggalkan halaman dan buang perubahan?')) { event.preventDefault(); event.stopPropagation(); }
      else approved = true;
    };
    window.addEventListener('beforeunload', warn); document.addEventListener('click', guardLink, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guardLink, true); };
  }, [dirty]);
  function allowDiscard() { return !dirty || window.confirm('Buang perubahan formulir yang belum disimpan?'); }
  function open(c: InvestigationCase) { if (!allowDiscard()) return; setDraft(c); setBaseline(c); setSavedId(c.id); setSelected(null); requestAnimationFrame(() => { editorHeading.current?.focus({ preventScroll: true }); editorHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }); }
  function create() { if (!allowDiscard()) return; const now = new Date().toISOString(); const c: InvestigationCase = { id: crypto.randomUUID(), title: '', summary: '', notes: '', conclusion: '', status: 'open', createdAt: now, updatedAt: now, snapshots: [] }; setDraft(c); setBaseline(c); setSavedId(null); setSelected(null); requestAnimationFrame(() => { editorHeading.current?.focus({ preventScroll: true }); editorHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }); }
  async function perform(action: () => Promise<void>) { if (busy) return; setBusy(true); try { await action(); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Operasi gagal.'); } finally { setBusy(false); } }
  const visible = cases.filter((c) => (status === 'all' || c.status === status) && `${c.title} ${c.summary}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="compact-page analyst-page batch-page">
    <InvestigationNav current="cases" /><header className="batch-heading"><p className="batch-eyebrow">LOCAL-FIRST CASE WORKSPACE</p><h1>Kasus investigasi lokal.</h1><p>Kasus disimpan di IndexedDB pada browser ini, tidak disinkronkan ke server dan tidak dikirim ke AI. Penyimpanan dan ekspor tidak dienkripsi oleh aplikasi.</p></header>
    <aside className="batch-alert"><strong>Gunakan perangkat pribadi</strong><p>Jangan masukkan kredensial atau data pribadi yang tidak diperlukan. Ekspor sebelum menghapus data browser. Snapshot adalah salinan saat pemeriksaan, bukan verdict terkini.</p></aside>
    {storageError && <div className="batch-card"><p role="alert">Penyimpanan lokal bermasalah: {storageError} Tidak ada fallback ke server.</p><button type="button" disabled={busy} onClick={() => void refresh().catch(() => {})}>Coba baca penyimpanan lagi</button></div>}
    <section className="content-card batch-card"><h2>Daftar kasus</h2><div className="batch-actions"><button className="batch-primary" type="button" disabled={busy || loading || Boolean(storageError)} onClick={create}>Kasus baru</button><Link className="batch-secondary" href="/analyst" target="_blank" rel="noopener noreferrer">Buka triage di tab baru ↗</Link></div>
      <details><summary>Impor paket kasus JSON</summary><p>Impor membuat kasus baru, tidak menimpa kasus yang sudah ada. Tinjau sumber file; maksimum 1 MB, 100 snapshot.</p><label htmlFor="case-import">Impor satu paket kasus JSON (maksimal 1 MB)</label><input id="case-import" type="file" accept=".json,application/json" disabled={busy || Boolean(storageError)} onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file || !allowDiscard()) return; if (file.size > 1024 * 1024) { setMessage('Paket kasus maksimal 1 MB.'); return; } await perform(async () => { const c = parseCaseImport(await file.text()); const imported = { ...c, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }; await saveCase(imported); setDraft(imported); setBaseline(imported); setSavedId(imported.id); setSelected(null); setMessage('Paket diimpor sebagai kasus baru.'); }); }} /></details>
      <div className="batch-filter"><label htmlFor="case-search">Cari judul / ringkasan<input id="case-search" value={search} onChange={(e) => setSearch(e.target.value)} /></label><label htmlFor="case-filter">Filter status<select id="case-filter" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Semua status</option><option value="open">Terbuka</option><option value="investigating">Dalam investigasi</option><option value="closed">Ditutup</option></select></label></div>
      {loading ? <p role="status">Memuat kasus lokal…</p> : !cases.length && !storageError ? <p>Belum ada kasus tersimpan.</p> : <p>{visible.length} dari {cases.length} kasus ditampilkan.</p>}
      <ul className="case-browser-list">{visible.map((c) => <li key={c.id}><div><button className="case-open" type="button" disabled={busy} aria-pressed={draft?.id === c.id} onClick={() => open(c)}>{c.title}</button><p>{({ open: 'Terbuka', investigating: 'Dalam investigasi', closed: 'Ditutup' })[c.status]} · {c.snapshots.length} snapshot</p><small>Diperbarui {c.updatedAt}</small></div></li>)}</ul>
      {cases.length > 0 && !visible.length && <p>Tidak ada kasus yang cocok. Ubah pencarian atau filter.</p>}
      <details><summary>Penghapusan semua kasus</summary><p>Penghapusan permanen hanya pada browser ini. File ekspor yang sudah diunduh tidak ikut terhapus.</p><button className="batch-danger-text" type="button" disabled={busy || !cases.length} onClick={() => { if (window.confirm('Hapus semua kasus lokal secara permanen, termasuk perubahan formulir?')) void perform(async () => { await deleteAllCases(); setDraft(null); setBaseline(null); setSavedId(null); setSelected(null); setMessage('Semua kasus lokal dihapus.'); }); }}>Hapus semua kasus lokal</button></details>
    </section>
    <p role="status" aria-live="polite" className="batch-notice">{message}</p>
    {draft && <form className="content-card batch-card case-editor" onSubmit={(e) => { e.preventDefault(); void perform(async () => { const saved = { ...draft, updatedAt: nextCaseUpdatedAt(draft.updatedAt) }; await saveCase(saved, baseline?.updatedAt, persisted); setDraft(saved); setBaseline(saved); setSavedId(saved.id); setMessage('Kasus disimpan pada browser ini.'); }); }}>
      <h2 ref={editorHeading} tabIndex={-1}>Detail kasus</h2><p className={dirty ? 'batch-alert' : 'case-save-state'}>{dirty ? 'Ada perubahan belum disimpan. Simpan sebelum berpindah halaman.' : persisted ? 'Versi tersimpan dimuat. Tidak ada perubahan formulir.' : 'Kasus baru belum disimpan.'}</p>
      <fieldset disabled={busy}><legend className="sr-only">Formulir kasus</legend>
      <label htmlFor="case-title">Judul</label><input id="case-title" required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <label htmlFor="case-status">Status</label><select id="case-status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as InvestigationCase['status'] })}><option value="open">Terbuka</option><option value="investigating">Dalam investigasi</option><option value="closed">Ditutup</option></select>
      <label htmlFor="case-summary">Ringkasan dan ruang lingkup</label><textarea id="case-summary" rows={3} maxLength={4000} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
      <label htmlFor="case-notes">Catatan dan hipotesis analis (bukan fakta terverifikasi)</label><textarea id="case-notes" rows={5} maxLength={8000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      <label htmlFor="case-conclusion">Kesimpulan dan tindakan mitigasi</label><textarea id="case-conclusion" rows={3} maxLength={4000} value={draft.conclusion} onChange={(e) => setDraft({ ...draft, conclusion: e.target.value })} />
      <div className="batch-actions"><button className="batch-primary" type="submit" disabled={busy || !draft.title.trim() || (persisted && !dirty)}>Simpan kasus lokal</button><button type="button" disabled={busy || !draft.title.trim()} onClick={() => { try { downloadJson('jagawarga-case.json', casePackage(draft)); setMessage(`Paket diekspor${dirty ? ' dari formulir yang belum disimpan' : ''}. Tinjau catatan dan indikator sebelum berbagi.`); } catch (e) { setMessage(e instanceof Error ? e.message : 'Ekspor gagal.'); } }}>Ekspor paket kasus</button></div>
      <p>Ekspor menyertakan isi formulir saat ini, termasuk perubahan yang belum disimpan. File tidak dienkripsi; tidak berarti kasus sudah disimpan di browser.</p>
      <h3>Timeline pemeriksaan ({draft.snapshots.length})</h3><p>Urutan waktu lookup, bukan rekonstruksi waktu serangan. Melepas snapshot baru berlaku setelah menyimpan kasus.</p>
      <ol className="case-timeline">{[...draft.snapshots].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)).map((s, i) => <li key={`${s.requestId}-${i}`}><time dateTime={s.checkedAt}>{s.checkedAt}</time><p className="analyst-indicator"><strong>{s.indicator.displayValue}</strong></p><p>{s.verdict} · {s.risk}/100 · {s.confidence}</p><div className="batch-actions"><button type="button" onClick={() => { setSelected(s); requestAnimationFrame(() => { evidenceHeading.current?.focus({ preventScroll: true }); evidenceHeading.current?.scrollIntoView({ block: 'start', behavior: 'instant' }); }); }}>Lihat snapshot {i + 1}</button><button className="batch-danger-text" type="button" onClick={() => { if (!window.confirm('Lepas snapshot ini dari formulir? Simpan kasus untuk menerapkan perubahan.')) return; setDraft({ ...draft, snapshots: draft.snapshots.filter((old) => old !== s) }); if (selected === s) setSelected(null); }}>Lepas snapshot {i + 1}</button></div></li>)}</ol>{!draft.snapshots.length && <p>Belum ada snapshot. Tambahkan evidence melalui Bulk triage.</p>}
      </fieldset>
      <details><summary>Muat ulang atau hapus kasus</summary><p>Muat ulang membuang perubahan formulir dan mengambil versi tersimpan terbaru. Gunakan ini bila kasus berubah di tab lain.</p><div className="batch-actions"><button type="button" disabled={busy || !persisted} onClick={() => { if (!allowDiscard()) return; void perform(async () => { const current = (await listCases()).find((c) => c.id === draft.id); if (!current) throw new Error('Kasus sudah dihapus di tab lain. Formulir tidak disimpan ulang.'); setDraft(current); setBaseline(current); setSelected(null); setMessage('Versi tersimpan terbaru dimuat.'); }); }}>Muat ulang versi tersimpan</button><button className="batch-danger-text" type="button" disabled={busy} onClick={() => { if (window.confirm('Hapus kasus ini dan perubahan formulir secara permanen?')) void perform(async () => { await deleteCase(draft.id); setDraft(null); setBaseline(null); setSavedId(null); setSelected(null); setMessage('Kasus lokal dihapus.'); }); }}>Hapus kasus ini</button></div></details>
    </form>}
    {selected && <div><h2 ref={evidenceHeading} tabIndex={-1} className="evidence-selection-heading">Snapshot pilihan</h2><EvidenceExplorer result={selected} /></div>}
  </main>;
}
