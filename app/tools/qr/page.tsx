'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { InvestigationNav } from '@/components/investigation-nav';
import { MAX_QR_FILE } from '@/lib/analyst/tool-results';
import { normalizeIndicator } from '@/lib/analyst/indicators';
import '../../analyst/analyst.css';
type BarcodeDetectorType = new (options: { formats: string[] }) => { detect(source: ImageBitmap): Promise<Array<{ rawValue: string }>> };
export default function QrTool() {
  const [value, setValue] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false); const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; const id = ++generation.current; setValue(''); setNotice('');
    if (file.size > MAX_QR_FILE) { setNotice('Gambar maksimal 10 MB.'); return; }
    if (!file.type.startsWith('image/')) { setNotice('Pilih berkas gambar.'); return; }
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorType }).BarcodeDetector;
    if (!Detector) { setNotice('Browser ini belum mendukung pembacaan QR lokal. Gunakan browser yang mendukung BarcodeDetector atau salin tujuan dari aplikasi tepercaya tanpa membukanya.'); return; }
    setBusy(true); let bitmap: ImageBitmap | undefined;
    try { bitmap = await createImageBitmap(file); if (bitmap.width * bitmap.height > 24_000_000) throw new Error('Gambar terlalu besar. Gunakan versi di bawah 24 megapiksel.');
      const codes = await new Detector({ formats: ['qr_code'] }).detect(bitmap); if (id !== generation.current) return;
      const decoded = codes[0]?.rawValue ?? ''; if (!decoded) throw new Error('Kode QR tidak ditemukan pada gambar.'); if (decoded.length > 4096) throw new Error('Isi QR terlalu panjang untuk ditampilkan.');
      setValue(decoded); setNotice('QR dibaca lokal. Tidak ada tujuan yang dibuka atau dikirim otomatis.');
    } catch (e) { if (id === generation.current) setNotice(e instanceof Error ? e.message : 'Gambar tidak dapat dibaca.'); }
    finally { bitmap?.close(); if (id === generation.current) setBusy(false); }
  }
  let lookup: string | null = null; if (value) { try { lookup = normalizeIndicator(value).value; } catch { /* Non-IoC or secret-bearing content stays local. */ } }
  return <main className="compact-page batch-page analyst-page investigation-tool"><InvestigationNav current="tools" /><Link href="/tools">← Semua alat</Link><header className="batch-heading"><p className="batch-eyebrow">PEMBACA QR · LOKAL</p><h1>Baca isinya sebelum bertindak.</h1><p>Gambar dibaca di perangkat. QR dapat berisi URL, teks, Wi-Fi, atau data pembayaran; hasil decode bukan verifikasi penerima maupun jaminan aman.</p></header>
    <section className="batch-card"><h2>Pilih gambar QR</h2><label htmlFor="qr">Gambar maksimal 10 MB · 24 megapiksel</label><input id="qr" type="file" accept="image/*" capture="environment" disabled={busy} onChange={select} /><p role="status">{busy ? 'Membaca gambar lokal…' : notice}</p>{value && <><label htmlFor="qr-value">Isi QR (teks, bukan tautan aktif)</label><textarea id="qr-value" rows={4} value={value} readOnly /><div className="batch-actions">{lookup && <Link className="batch-primary" href={`/periksa?ioc=${encodeURIComponent(lookup)}`}>Periksa tujuan ini</Link>}<button onClick={async () => { try { await navigator.clipboard.writeText(value); setNotice('Isi QR disalin. Tinjau sebelum menempel di tempat lain.'); } catch { setNotice('Clipboard tidak tersedia. Salin dari kolom isi QR.'); } }}>Salin isi QR</button><button className="batch-danger-text" onClick={() => { setValue(''); setNotice('Hasil decode dibuang. Gambar asli tidak dihapus.'); }}>Hapus hasil lokal</button></div>{!lookup && <p>Isi ini bukan IoC yang dapat diperiksa atau mengandung pola rahasia. Data tetap lokal; jangan mengirim kredensial Wi-Fi, token, atau data pembayaran.</p>}</>}</section><aside className="batch-alert">Tautan tidak dibuka otomatis. Untuk pembayaran, cocokkan nama penerima di aplikasi resmi. Jangan memasang APK atau mengirim OTP karena instruksi pada QR.</aside>
  </main>;
}
