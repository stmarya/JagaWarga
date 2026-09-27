import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navigasi utama">
        <Link className="wordmark" href="/" aria-label="JagaWarga, beranda">
          <span className="wordmark-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            <strong>JagaWarga</strong>
            <small>Keamanan digital bersama</small>
          </span>
        </Link>
        <div className="nav-links">
          <Link href="/tools">Alat keamanan</Link>
          <Link href="/dashboard">Aktivitas</Link>
          <Link href="/status">Status sistem</Link>
        </div>
        <Link className="nav-emergency" href="/emergency">
          <span aria-hidden="true">!</span>
          Bantuan darurat
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>JagaWarga</strong>
        <p>Alat bantu keamanan digital yang transparan dan mengutamakan privasi.</p>
      </div>
      <nav aria-label="Tautan informasi">
        <Link href="/methodology">Metodologi</Link>
        <Link href="/transparency">Transparansi</Link>
        <Link href="/privacy">Privasi</Link>
        <Link href="/support">Dukungan</Link>
      </nav>
      <p className="footer-caution">Belum ada indikasi berbahaya bukan berarti 100% aman.</p>
    </footer>
  );
}