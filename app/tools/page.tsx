import Link from 'next/link';
import { Icon, type IconName } from '@/components/icon';

const categories: Array<{
  title: string;
  description: string;
  tools: Array<{ name: string; href: string; copy: string; icon: IconName; meta: string }>;
}> = [
  {
    title: 'Analisis komunikasi',
    description: 'Baca pola manipulasi pada pesan dan autentikasi email.',
    tools: [
      { name: 'Analisis pesan', href: '/tools/message', copy: 'Temukan urgensi, permintaan OTP, transaksi, dan penyamaran identitas.', icon: 'message', meta: 'Teks · diproses sementara' },
      { name: 'Pemeriksaan email', href: '/tools/email-header', copy: 'Periksa SPF, DKIM, DMARC, jalur penerimaan, dan ketidaksesuaian Reply-To.', icon: 'email', meta: 'Header email · tanpa penyimpanan' },
    ],
  },
  {
    title: 'Pemeriksaan berkas',
    description: 'Periksa identitas berkas tanpa mengunggah isinya.',
    tools: [
      { name: 'Hash berkas lokal', href: '/tools/file-hash', copy: 'Hitung sidik jari SHA-256 untuk APK, dokumen, gambar, atau arsip.', icon: 'hash', meta: 'Semua format · proses lokal' },
      { name: 'Pembaca kode QR', href: '/tools/qr', copy: 'Baca alamat tujuan QR tanpa membuka tautan secara otomatis.', icon: 'qr', meta: 'Gambar atau kamera · proses lokal' },
    ],
  },
];

export default function ToolsPage() {
  return (
    <main className="compact-page tools-page">
      <header className="page-heading"><div><p className="kicker">ALAT BANTU KEAMANAN</p><h1>Pilih alat sesuai kebutuhan.</h1><p>Setiap alat menjelaskan data yang diproses dan tindakan yang dapat dilakukan setelahnya.</p></div></header>
      {categories.map((category) => <section className="tool-category" key={category.title}><div className="tool-category-head"><h2>{category.title}</h2><p>{category.description}</p></div><div className="tool-card-grid">{category.tools.map((tool) => <Link className="tool-card" href={tool.href} key={tool.href}><span className="tool-card-icon"><Icon name={tool.icon} size={28} /></span><span className="tool-card-content"><small>{tool.meta}</small><strong>{tool.name}</strong><p>{tool.copy}</p></span><span className="tool-card-arrow"><Icon name="arrow" /></span></Link>)}</div></section>)}
      <aside className="privacy-banner"><strong>Privasi menjadi default</strong><p>Jangan masukkan kata sandi, OTP, token, atau data pribadi yang tidak diperlukan.</p></aside>
    </main>
  );
}