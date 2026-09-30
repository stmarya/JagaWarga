import Link from 'next/link';

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
    <footer className="site-footer">
      <div><strong>JAGA/WARGA</strong><p>Cek sinyal ancaman. Ambil langkah aman.</p></div>
      <nav aria-label="Tautan informasi">
        <Link href="/methodology">Metode</Link><Link href="/education">Edukasi</Link><Link href="/privacy">Privasi</Link><Link href="/support">Bantuan</Link>
      </nav>
      <p className="footer-caution">Hasil “bersih” bukan jaminan 100% aman.</p>
    </footer>
  );
}
