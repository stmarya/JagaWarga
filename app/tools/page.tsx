'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icon';

const categories: Array<{
  title: string;
  description: string;
  tools: Array<{ name: string; href: string; copy: string; icon: IconName; meta: string }>;
}> = [
  {
    title: 'Investigasi advanced',
    description: 'Triage banyak indikator, telusuri evidence, dan susun kasus lokal.',
    tools: [
      { name: 'Mode Analis', href: '/analyst', copy: 'Preview, deduplikasi, bulk lookup, dan perbandingan evidence. Maksimal 20 indikator per batch.', icon: 'shield', meta: 'IoC · existing lookup only' },
      { name: 'Case Workspace lokal', href: '/analyst/cases', copy: 'Simpan snapshot, catatan, hipotesis, dan kesimpulan pada browser pribadi.', icon: 'file', meta: 'IndexedDB · tanpa sinkronisasi server' },
    ],
  },
  {
    title: 'Analisis komunikasi',
    description: 'Analisis pola pesan/header di server. Penelusuran tautan berbeda: koneksi aktif hanya jika diizinkan operator.',
    tools: [
      { name: 'Pemeriksa tautan singkat', href: '/tools/unshorten', copy: 'Observasi HEAD aktif dengan persetujuan; nonaktif secara default dan bukan pemeriksaan reputasi.', icon: 'link', meta: 'Tautan · koneksi aktif dibatasi operator' },
      { name: 'Analisis pesan', href: '/tools/message', copy: 'Temukan urgensi, permintaan OTP, transaksi, dan penyamaran identitas.', icon: 'message', meta: 'Teks · diproses sementara' },
      { name: 'Pemeriksaan email', href: '/tools/email-header', copy: 'Baca field SPF/DKIM/DMARC dan Reply-To; bukan verifikasi tanda tangan independen.', icon: 'email', meta: 'Header email · tanpa penyimpanan' },
    ],
  },
  {
    title: 'Pemeriksaan berkas',
    description: 'Periksa identitas berkas tanpa mengunggah isinya.',
    tools: [
      { name: 'Hash berkas lokal', href: '/tools/file-hash', copy: 'Hitung sidik jari SHA-256 untuk APK, dokumen, gambar, atau arsip.', icon: 'hash', meta: 'Maksimal 25 MB · proses lokal' },
      { name: 'Pembaca kode QR', href: '/tools/qr', copy: 'Baca alamat tujuan QR tanpa membuka tautan secara otomatis.', icon: 'qr', meta: 'Maksimal 10 MB · proses lokal' },
    ],
  },
];

export default function ToolsPage() {
  const [query, setQuery] = useState('');
  const visible = categories.map(category => ({ ...category, tools: category.tools.filter(tool => `${tool.name} ${tool.copy} ${tool.meta}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter(category => category.tools.length);
  return (
    <main className="compact-page tools-page experience-page">
      <header className="page-heading"><div><p className="kicker">ALAT BANTU KEAMANAN</p><h1>Pilih alat sesuai kebutuhan.</h1><p>Mulai dari kebutuhan Anda. Bedakan pemrosesan lokal, analisis server, dan koneksi aktif sebelum memasukkan data.</p></div></header>
      <div className="v4-tool-intro"><strong>Belum tahu harus mulai dari mana?</strong><p>Untuk satu objek gunakan <Link href="/periksa">pemeriksaan terpandu</Link>. Untuk banyak indikator gunakan <Link href="/analyst">Bulk triage</Link>. Jika sudah terdampak, dahulukan <Link href="/emergency">langkah darurat</Link>.</p></div>
      <label className="v4-label" htmlFor="tool-search">Cari nama atau kebutuhan alat</label><input id="tool-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Misalnya: pesan, lokal, hash" /><p role="status">{visible.reduce((sum, category) => sum + category.tools.length, 0)} alat ditampilkan.</p>
      {!visible.length && <section className="v4-card"><h2>Tidak ada alat yang cocok.</h2><button className="v4-secondary" onClick={() => setQuery('')}>Hapus pencarian</button></section>}
      {visible.map((category) => <section className="tool-category" key={category.title}><div className="tool-category-head"><h2>{category.title}</h2><p>{category.description}</p></div><div className="tool-card-grid">{category.tools.map((tool) => <Link className="tool-card" href={tool.href} key={tool.href}><span className="tool-card-icon"><Icon name={tool.icon} size={28} /></span><span className="tool-card-content"><small>{tool.meta}</small><strong>{tool.name}</strong><p>{tool.copy}</p></span><span className="tool-card-arrow"><Icon name="arrow" /></span></Link>)}</div></section>)}
      <aside className="privacy-banner"><strong>Periksa alur data sebelum mengirim</strong><p>Jangan masukkan kata sandi, OTP, token, atau data pribadi yang tidak diperlukan. Lokal tidak berarti terenkripsi; lookup tetap mengirim indikator ke server dan provider aktif.</p><Link href="/privacy">Baca privasi & kontrol data →</Link></aside>
    </main>
  );
}