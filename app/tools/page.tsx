import Link from 'next/link';
import { Icon, type IconName } from '@/components/icon';

const categories: Array<{
  title: string;
  description: string;
  tools: Array<{ name: string; href: string; copy: string; icon: IconName; meta: string }>;
}> = [
  {
    title: 'Analisis komunikasi',
    description: 'Baca pola manipulasi pada pesan, tautan tersembunyi, dan autentikasi email.',
    tools: [
      { name: 'Lihat alamat asli tanpa mengeklik', href: '/tools/unshorten', copy: 'Buka alamat di balik bit.ly, s.id, dan tinyurl dengan aman.', icon: 'link', meta: 'Tautan · pelacakan pengalihan' },
      { name: 'Cari tanda penipuan dalam pesan', href: '/tools/message', copy: 'Temukan tekanan, permintaan OTP, transaksi, dan penyamaran identitas.', icon: 'message', meta: 'Teks · diproses sementara' },
      { name: 'Cek apakah email dapat dipercaya', href: '/tools/email-header', copy: 'Periksa jalur pengiriman dan tanda bahwa alamat pengirim mungkin dipalsukan.', icon: 'email', meta: 'Header email · tanpa penyimpanan' },
    ],
  },
  {
    title: 'Pemeriksaan berkas',
    description: 'Periksa identitas berkas tanpa mengunggah isinya.',
    tools: [
      { name: 'Periksa sidik jari berkas', href: '/tools/file-hash', copy: 'Hitung sidik jari APK, dokumen, gambar, atau arsip tanpa mengunggahnya.', icon: 'hash', meta: 'Semua format · proses lokal' },
      { name: 'Baca tujuan QR tanpa membukanya', href: '/tools/qr', copy: 'Lihat alamat yang tersimpan di dalam QR sebelum mengambil tindakan.', icon: 'qr', meta: 'Gambar atau kamera · proses lokal' },
    ],
  },
];

export default function ToolsPage() {
  return (
    <main className="compact-page tools-page">
      <header className="page-heading"><div><p className="kicker">ALAT BANTU KEAMANAN</p><h1>Cari alat untuk situasi Anda.</h1><p>Pilih tindakan yang ingin Anda lakukan. Setiap alat menjelaskan data yang diproses dan langkah setelahnya.</p></div></header>
      {categories.map((category) => <section className="tool-category" key={category.title}><div className="tool-category-head"><h2>{category.title}</h2><p>{category.description}</p></div><div className="tool-card-grid">{category.tools.map((tool) => <Link className="tool-card" href={tool.href} key={tool.href}><span className="tool-card-icon"><Icon name={tool.icon} size={28} /></span><span className="tool-card-content"><small>{tool.meta}</small><strong>{tool.name}</strong><p>{tool.copy}</p></span><span className="tool-card-arrow"><Icon name="arrow" /></span></Link>)}</div></section>)}
      <aside className="privacy-banner"><strong>Privasi menjadi default</strong><p>Jangan masukkan kata sandi, OTP, token, atau data pribadi yang tidak diperlukan.</p></aside>
    </main>
  );
}
