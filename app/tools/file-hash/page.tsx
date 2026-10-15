'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { InvestigationNav } from '@/components/investigation-nav';
import { MAX_LOCAL_FILE } from '@/lib/analyst/tool-results';
import '../../analyst/analyst.css';
export default function FileHashTool() {
  const [result, setResult] = useState(''); const [name, setName] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const id = ++generation.current;
    setResult(''); setName(''); setNotice(''); if (file.size > MAX_LOCAL_FILE) { setNotice('Berkas maksimal 25 MB untuk membatasi penggunaan memori browser. Tidak ada data dikirim.'); return; }
    setBusy(true); setName(file.name);
    try { const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()); if (id !== generation.current) return; setResult([...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')); setNotice('SHA-256 dihitung lokal. Belum ada lookup jaringan.'); }
    catch { if (id === generation.current) setNotice('Berkas tidak dapat dibaca atau Web Crypto tidak tersedia.'); }
    finally { if (id === generation.current) setBusy(false); }
  }
  return <main className="compact-page batch-page analyst-page investigation-tool"><InvestigationNav current="tools" /><Link href="/tools">← Semua alat</Link><header className="batch-heading"><p className="batch-eyebrow">HASH BERKAS · LOKAL</p><h1>Hitung sidik jari, bukan jaminan aman.</h1><p>SHA-256 membantu membandingkan berkas yang identik. Menghitung hash tidak menjalankan, mengunggah, atau memindai isi berkas untuk malware.</p></header>
    <section className="batch-card"><h2>Pilih berkas</h2><label htmlFor="file">APK, dokumen, gambar, atau arsip · maksimal 25 MB</label><input id="file" type="file" disabled={busy} onChange={select} /><p>Isi berkas tetap di perangkat. Jika Anda melanjutkan ke Periksa, hanya hash yang dikirim setelah Anda menekan tombol lookup di sana.</p>{name && <p className="analyst-indicator">Berkas: {name}</p>}<p role="status">{busy ? 'Menghitung hash lokal…' : notice}</p>
      {result && <div><label htmlFor="file-sha256">SHA-256</label><textarea id="file-sha256" aria-label="SHA-256 hash" readOnly rows={3} value={result} /><div className="batch-actions"><Link className="batch-primary" href={`/periksa?ioc=${encodeURIComponent(result)}`}>Periksa hash ini</Link><button onClick={async () => { try { await navigator.clipboard.writeText(result); setNotice('Hash disalin.'); } catch { setNotice('Clipboard tidak tersedia. Salin dari kolom SHA-256.'); } }}>Salin hash</button><button className="batch-danger-text" onClick={() => { generation.current += 1; setResult(''); setName(''); setNotice('Hasil lokal dibuang. Berkas asli tidak dihapus.'); }}>Hapus hasil lokal</button></div></div>}
    </section><aside className="batch-alert">Hash yang tidak dikenal bukan berarti berkas aman. Jangan menjalankan berkas mencurigakan untuk membuat hash atau memperoleh bukti tambahan.</aside></main>;
}
