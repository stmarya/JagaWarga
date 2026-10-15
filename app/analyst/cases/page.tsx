'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { casePackage, deleteAllCases, deleteCase, listCases, parseCaseImport, saveCase, type InvestigationCase } from '@/lib/analyst/cases';
import { downloadJson, type LookupSnapshot } from '@/lib/analyst/snapshot';
import { EvidenceExplorer } from '@/components/evidence-explorer';
import '../analyst.css';

export default function CasesPage() {
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [draft, setDraft] = useState<InvestigationCase | null>(null);
  const [selected, setSelected] = useState<LookupSnapshot | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() { setCases(await listCases()); }
  useEffect(() => { refresh().catch(() => setMessage('IndexedDB tidak tersedia. Tidak ada fallback ke server.')); }, []);
  function create() {
    if (draft && !window.confirm('Buang perubahan formulir yang belum disimpan?')) return;
    const now = new Date().toISOString();
    setDraft({ id: crypto.randomUUID(), title: '', summary: '', notes: '', conclusion: '', status: 'open', createdAt: now, updatedAt: now, snapshots: [] });
    setSelected(null);
  }
  async function perform(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); await refresh(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Operasi gagal.'); } finally { setBusy(false); }
  }
  return <main className="compact-page analyst-page">
    <header className="page-heading"><div><p className="kicker">LOCAL-FIRST CASE WORKSPACE</p><h1>Kasus investigasi lokal.</h1><p>Kasus disimpan di IndexedDB pada browser ini, tidak disinkronkan ke server dan tidak dikirim ke AI. Penyimpanan dan ekspor tidak dienkripsi oleh aplikasi.</p></div></header>
    <p><Link href="/analyst">← Kembali ke triage</Link></p>
    <aside className="privacy-banner"><strong>Gunakan perangkat pribadi</strong><p>Jangan masukkan kredensial atau data pribadi yang tidak diperlukan. Ekspor sebelum menghapus data browser. Snapshot adalah salinan saat pemeriksaan, bukan verdict terkini.</p></aside>
    <section className="content-card"><h2>Daftar kasus</h2>
      <button type="button" disabled={busy} onClick={create}>Kasus baru</button>
      <label htmlFor="case-import">Impor satu paket kasus JSON (maksimal 1 MB)</label>
      <input id="case-import" type="file" accept=".json,application/json" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        if (file.size > 1024 * 1024) { setMessage('Paket kasus maksimal 1 MB.'); return; }
        await perform(async () => {
          const c = parseCaseImport(await file.text());
          // Imported identifiers never overwrite an existing local case.
          const imported = { ...c, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
          await saveCase(imported); setDraft(imported); setSelected(null); setMessage('Paket diimpor sebagai kasus baru.');
        });
      }} />
      <ul className="case-list">{cases.map((c) => <li key={c.id}>
        <button type="button" disabled={busy} onClick={() => {
          if (draft && !window.confirm('Buang perubahan formulir yang belum disimpan?')) return;
          setDraft(c); setSelected(null);
        }}>{c.title}</button> · {c.status} · {c.snapshots.length} snapshot
      </li>)}</ul>
      {!cases.length && <p>Belum ada kasus tersimpan.</p>}
      <button type="button" disabled={busy || !cases.length} onClick={() => {
        if (window.confirm('Hapus semua kasus lokal secara permanen?')) perform(async () => { await deleteAllCases(); setDraft(null); setSelected(null); setMessage('Semua kasus lokal dihapus.'); });
      }}>Hapus semua kasus lokal</button>
    </section>
    {draft && <form className="content-card" onSubmit={(e) => {
      e.preventDefault();
      perform(async () => {
        const saved = { ...draft, updatedAt: new Date().toISOString() };
        await saveCase(saved, draft.updatedAt); setDraft(saved); setMessage('Kasus disimpan pada browser ini.');
      });
    }}>
      <h2>Detail kasus</h2>
      <label htmlFor="case-title">Judul</label><input id="case-title" required maxLength={200} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <label htmlFor="case-status">Status</label><select id="case-status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as InvestigationCase['status'] })}><option value="open">Terbuka</option><option value="investigating">Dalam investigasi</option><option value="closed">Ditutup</option></select>
      <label htmlFor="case-summary">Ringkasan dan ruang lingkup</label><textarea id="case-summary" rows={3} maxLength={4000} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
      <label htmlFor="case-notes">Catatan dan hipotesis analis (bukan fakta terverifikasi)</label><textarea id="case-notes" rows={5} maxLength={8000} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
      <label htmlFor="case-conclusion">Kesimpulan dan tindakan mitigasi</label><textarea id="case-conclusion" rows={3} maxLength={4000} value={draft.conclusion} onChange={(e) => setDraft({ ...draft, conclusion: e.target.value })} />
      <button type="submit" disabled={busy}>Simpan kasus lokal</button>
      <button type="button" disabled={busy || !draft.title.trim()} onClick={() => {
        try { downloadJson('jagawarga-case.json', casePackage(draft)); setMessage('Paket diekspor. Tinjau catatan dan indikator sebelum berbagi.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Ekspor gagal.'); }
      }}>Ekspor paket kasus</button>
      <button type="button" disabled={busy} onClick={() => {
        if (window.confirm('Hapus kasus ini secara permanen?')) perform(async () => { await deleteCase(draft.id); setDraft(null); setSelected(null); setMessage('Kasus lokal dihapus.'); });
      }}>Hapus kasus ini</button>
      <h3>Timeline pemeriksaan</h3><p>Urutan waktu lookup, bukan rekonstruksi waktu serangan.</p>
      <ol className="case-list">{[...draft.snapshots].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)).map((s, i) => <li key={`${s.requestId}-${i}`}>
        <time dateTime={s.checkedAt}>{s.checkedAt}</time> · {s.indicator.displayValue} · {s.verdict}
        <button type="button" onClick={() => setSelected(s)}>Lihat snapshot {i + 1}</button>
        <button type="button" onClick={() => { setDraft({ ...draft, snapshots: draft.snapshots.filter((old) => old !== s) }); if (selected === s) setSelected(null); }}>Lepas snapshot {i + 1}</button>
      </li>)}</ol>
    </form>}
    <p role="status" aria-live="polite">{message}</p>
    {selected && <EvidenceExplorer result={selected} />}
  </main>;
}