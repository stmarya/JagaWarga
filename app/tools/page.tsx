import Link from 'next/link';

const tools = [
  ['Analisis pesan', '/tools/message', 'Temukan tanda urgensi, permintaan OTP, uang, dan impersonasi.'],
  ['QR aman', '/tools/qr', 'Baca isi QR di perangkat tanpa membuka target.'],
  ['Email header', '/tools/email-header', 'Periksa SPF, DKIM, DMARC, dan Reply-To.'],
  ['Hash file lokal', '/tools/file-hash', 'Hitung SHA-256 tanpa mengunggah file.'],
];

export default function ToolsPage() {
  return <main className="page"><Link href="/">← Beranda</Link><p className="eyebrow">ALAT KEAMANAN</p><h1>Periksa tanpa mengambil risiko tambahan.</h1><section className="grid">{tools.map(([name, href, copy]) => <article className="panel" key={href}><h2>{name}</h2><p>{copy}</p><Link className="button" href={href}>Buka alat</Link></article>)}</section></main>;
}