'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { deleteAllCases, listCases } from '@/lib/analyst/cases';
import { downloadJson } from '@/lib/analyst/snapshot';
import { clearAllLocalData, exportLocalData, getHistory, getProgress, getWatchlist, remembersHistory, setRememberHistory } from '@/lib/client/storage';
import { deletePublication, getPublicationReceipts, type PublicationReceipt } from '@/lib/client/publications';

export default function PrivacyPage() {
  const [counts, setCounts] = useState({ history: 0, watchlist: 0, cases: 0, xp: 0 });
  const [receipts, setReceipts] = useState<PublicationReceipt[]>([]);
  const [remember, setRemember] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  async function refresh() {
    setCounts({ history: getHistory().length, watchlist: getWatchlist().length, cases: (await listCases()).length, xp: getProgress().xp });
    setReceipts(getPublicationReceipts()); setRemember(remembersHistory());
  }
  useEffect(() => { refresh().catch(() => setNotice('Sebagian penyimpanan browser tidak tersedia. Ekspor lengkap memerlukan akses ke penyimpanan lokal dan IndexedDB.')); }, []);
  async function exportAll() {
    setBusy(true);
    try {
      const cases = await listCases();
      const sharedPublications = getPublicationReceipts().map(({ id, expiresAt }) => ({ id, expiresAt }));
      downloadJson('jagawarga-private-data.json', { exportSchemaVersion: 1, exportedAt: new Date().toISOString(),
        local: JSON.parse(exportLocalData()), cases, sharedPublications,
        note: 'Bukti penghapusan/token, percakapan AI, dan hasil sesi sementara tidak diekspor. File ini tidak dienkripsi; tinjau sebelum berbagi.' });
      setNotice('Data lokal dan kasus diekspor. Token penghapusan tidak disertakan; jangan hapus browser sebelum menghapus publikasi server bila diperlukan.');
    } catch { setNotice('Ekspor lengkap gagal. Data tidak dihapus; periksa akses penyimpanan browser.'); }
    finally { setBusy(false); }
  }
  async function clearLocal() {
    const active = getPublicationReceipts().length;
    if (!window.confirm(`Hapus data lokal, kasus, pengaturan, dan sesi tab ini? ${active ? `${active} bukti penghapusan publikasi akan hilang. Hapus publikasi server terlebih dahulu; jika tidak, record tetap berlaku maksimal 24 jam.` : 'Publikasi server dan file ekspor tidak ikut dihapus.'}`)) return;
    setBusy(true);
    try {
      await deleteAllCases(); clearAllLocalData();
      ['jagawarga:ai-assistant:v1', 'jagawarga:ai-conversation', 'jagawarga:last-result'].forEach((key) => sessionStorage.removeItem(key));
      await refresh(); setNotice('Data persisten di browser ini dan sesi tersimpan pada tab ini dihapus. Muat ulang/ tutup tab lain untuk menghapus salinan memori. Publikasi server dan file ekspor tidak ikut dihapus.');
    } catch { setNotice('Penghapusan belum lengkap. Periksa penyimpanan browser dan coba lagi.'); } finally { setBusy(false); }
  }
  async function clearShared() {
    if (!window.confirm('Hapus publikasi server yang masih memiliki bukti penghapusan di browser ini? Salinan yang sudah diunduh orang lain tidak dapat ditarik kembali.')) return;
    setBusy(true); let removed = 0; let failed = 0;
    for (const receipt of getPublicationReceipts()) {
      try { await deletePublication(receipt); removed += 1; } catch { failed += 1; }
    }
    try { await refresh(); } catch { /* Report deletion outcomes even if another storage is unavailable. */ }
    setNotice(`${removed} publikasi dihapus dari server; ${failed} belum berhasil. Bukti yang gagal tetap disimpan. Record kedaluwarsa otomatis maksimal 24 jam.`); setBusy(false);
  }
  return <main className="compact-page batch-page privacy-v2">
    <header className="batch-heading"><p className="batch-eyebrow">PRIVASI & KONTROL DATA</p><h1>Ketahui data Anda. Tentukan apa yang disimpan.</h1><p>Pemeriksaan tidak dipublikasikan otomatis. “Tidak mengunggah file” bukan berarti tidak ada data yang dikirim: lookup tetap mengirim indikator ke server dan provider aktif.</p></header>
    <section className="batch-card"><h2>Data pada browser ini</h2><dl className="batch-facts"><div><dt>Riwayat pribadi</dt><dd>{counts.history} pemeriksaan</dd></div><div><dt>Watchlist lokal</dt><dd>{counts.watchlist} indikator</dd></div><div><dt>Kasus investigasi</dt><dd>{counts.cases} kasus</dd></div><div><dt>Progres belajar</dt><dd>{counts.xp} XP</dd></div></dl>
      <label className="batch-check"><input type="checkbox" checked={remember} disabled={busy} onChange={(e) => {
        try { setRememberHistory(e.target.checked); setRemember(e.target.checked); setNotice('Preferensi riwayat lokal diperbarui; hasil yang sudah tersimpan tidak otomatis dihapus.'); }
        catch { setNotice('Preferensi tidak dapat disimpan.'); }
      }} /> Simpan hasil IoC berikutnya di browser ini (opsional, tidak terenkripsi)</label>
      <p>Riwayat, watchlist, progres, dan kasus bertahan sampai Anda menghapusnya atau browser menghapus data. Hasil sesi/percakapan tersimpan sementara pada tab. Jangan gunakan perangkat bersama untuk data sensitif.</p>
      <div className="batch-actions"><button className="batch-primary" type="button" disabled={busy} onClick={exportAll}>Ekspor seluruh data lokal</button><button className="batch-danger-text" type="button" disabled={busy} onClick={clearLocal}>Hapus data lokal dan sesi</button><Link className="batch-secondary" href="/analyst/cases">Kelola kasus</Link></div>
      <p>Ekspor menyertakan riwayat, watchlist, progres, data legacy yang masih ada, dan kasus. Tidak menyertakan token penghapusan atau chat AI. File tidak dienkripsi; hapus file ekspor secara terpisah.</p>
    </section>
    <section className="batch-card"><h2>Publikasi server berbeda dari data lokal</h2><p>Publikasi komunitas memerlukan fitur operator aktif, preview, dan persetujuan eksplisit. Untuk URL, hanya host yang dipublikasikan. Server melakukan lookup ulang; hasil dapat berbeda dari pemeriksaan URL lengkap.</p><p>Publikasi baru berlaku maksimal 24 jam. Bukti penghapusan hanya ada pada browser pembuatnya. Menghapus data lokal tidak menghapus record server dan dapat menghilangkan bukti tersebut.</p><p>{receipts.length} publikasi masih memiliki bukti penghapusan pada browser ini.</p><div className="batch-actions"><button type="button" className="batch-danger-text" disabled={busy || !receipts.length} onClick={clearShared}>Hapus publikasi server saya</button><Link className="batch-secondary" href="/dashboard">Lihat riwayat saya dan komunitas</Link></div></section>
    <section className="batch-card"><h2>Bagaimana setiap fitur mengelola data?</h2><dl className="privacy-data-flow">
      <div><dt>URL, domain, IP, hash</dt><dd>Indikator dikirim ke server JagaWarga dan provider lookup aktif. Cache operasional memiliki TTL. Tidak ada file mentah atau submission analisis baru. Publikasi terpisah dan opsional.</dd></div>
      <div><dt>Pesan dan header email</dt><dd>Isi dianalisis sementara di server, tidak disimpan sebagai riwayat komunitas. Hapus informasi pribadi yang tidak diperlukan. Pembacaan autentikasi header bukan verifikasi DKIM independen.</dd></div>
      <div><dt>File dan gambar QR</dt><dd>Hash/dekode dilakukan di browser. Saat Anda memilih lookup lanjutan, hash atau indikator hasil dekode dikirim seperti lookup biasa.</dd></div>
      <div><dt>Penelusur pengalihan aktif</dt><dd>Nonaktif secara default. Jika operator mengaktifkannya dan Anda menyetujui, server mengirim HEAD ke situs tujuan. Pemilik situs dapat mencatat koneksi atau token unik; jangan masukkan URL sekali pakai, reset sandi, atau rahasia. Tidak ada jaminan reputasi dari hasil penelusuran.</dd></div>
      <div><dt>Asisten AI</dt><dd>Percakapan dan konteks yang diizinkan dapat dikirim ke model eksternal jika aktif, dengan redaksi pola rahasia. Redaksi tidak mendeteksi semua rahasia. Kasus lokal tidak otomatis dikirim ke AI.</dd></div>
    </dl></section>
    <section className="batch-card"><h2>Batas kontrol dan perlindungan</h2><ul><li>Penyimpanan lokal dan file ekspor tidak dienkripsi oleh aplikasi.</li><li>Menghapus record server tidak menghapus salinan yang sudah dibagikan atau diunduh.</li><li>Salinan dalam memori tab lain perlu dihapus dengan menutup atau memuat ulang tab tersebut.</li><li>Kebijakan ini bukan jaminan keamanan mutlak atau sertifikasi kepatuhan hukum.</li></ul><p><Link href="/transparency">Transparansi</Link> · <Link href="/methodology">Metode pemeriksaan</Link> · <Link href="/support">Bantuan dan laporan masalah</Link></p></section>
    <p className="batch-notice" role="status" aria-live="polite">{notice}</p>
  </main>;
}
