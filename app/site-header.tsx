import Link from 'next/link';
import { Icon } from '@/components/icon';

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navigasi utama">
        <Link className="wordmark" href="/" aria-label="JagaWarga, beranda">
          <span className="wordmark-mark" aria-hidden="true">JW</span>
          <span><strong>JAGA/WARGA</strong><small>Pusat cek digital</small></span>
        </Link>
        <div className="nav-links">
          <Link href="/#scanner">Mulai cek</Link>
          <Link href="/dashboard">Riwayat</Link>
          <Link href="/education">Edukasi</Link>
          <Link href="/tools">Alat Bantu</Link>
        </div>
        <Link className="nav-emergency" href="/emergency"><span aria-hidden="true">!</span> Darurat</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-shell">
      <div className="footer-action-band"><div><span className="footer-action-icon"><Icon name="users" size={25} /></span><div><strong>Bantu lindungi warga lain</strong><p>Periksa, simpan bukti, lalu laporkan ancaman melalui kanal resmi.</p></div></div><Link href="/dashboard">Lihat laporan komunitas <Icon name="arrow" size={17} /></Link></div>
      <div className="site-footer">
        <div className="footer-brand"><span className="footer-logo">JW</span><div><strong>JAGA/WARGA</strong><p>Periksa sinyalnya. Pahami risikonya. Ambil langkah aman.</p></div><small>Hasil pemeriksaan adalah bantuan awal, bukan jaminan keamanan mutlak.</small></div>
        <nav aria-label="Jelajahi JagaWarga"><strong>Jelajahi</strong><Link href="/#scanner">Mulai periksa</Link><Link href="/dashboard">Riwayat komunitas</Link><Link href="/education">Belajar keamanan</Link><Link href="/tools">Alat bantu</Link></nav>
        <div className="footer-report-column"><strong>Laporkan ancaman</strong><a className="report-link report-komdigi" href="https://aduankonten.id/" target="_blank" rel="noreferrer"><Icon name="alert" /><span><b>Konten berbahaya</b><small>Komdigi · Aduan Konten</small></span></a><a className="report-link report-polri" href="https://patrolisiber.id/" target="_blank" rel="noreferrer"><Icon name="shield" /><span><b>Kejahatan siber</b><small>Polri · Patrolisiber</small></span></a><a className="report-link report-ojk" href="https://iasc.ojk.go.id/" target="_blank" rel="noreferrer"><Icon name="transaction" /><span><b>Penipuan transaksi</b><small>OJK · IASC</small></span></a></div>
        <div className="footer-proof-card"><span><Icon name="clipboard" /></span><div><strong>Sebelum melapor</strong><p>Simpan alamat, akun, waktu, nominal, dan tangkapan layar.</p><Link href="/emergency">Buka panduan darurat <Icon name="arrow" size={15} /></Link></div></div>
      </div>
      <div className="footer-bottom"><span>© 2026 JagaWarga</span><div><Link href="/privacy">Privasi</Link><Link href="/methodology">Metode</Link><Link href="/support">Bantuan</Link></div><span>Dibuat untuk keamanan digital warga</span></div>
    </footer>
  );
}
