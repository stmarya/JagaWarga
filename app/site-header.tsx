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
      <div className="footer-brand"><strong>JAGA/WARGA</strong><p>Periksa sinyalnya, pahami risikonya, lalu ambil langkah aman.</p><small>Hasil pemeriksaan adalah bantuan awal, bukan jaminan keamanan mutlak.</small></div>
      <nav aria-label="Pelajari JagaWarga"><strong>Pelajari</strong><Link href="/education">Edukasi keamanan</Link><Link href="/methodology">Cara penilaian</Link><Link href="/privacy">Privasi data</Link><Link href="/support">Bantuan</Link></nav>
      <nav aria-label="Laporkan ancaman"><strong>Laporkan ancaman</strong><a href="https://aduankonten.id/" target="_blank" rel="noreferrer">Konten berbahaya · Komdigi</a><a href="https://patrolisiber.id/" target="_blank" rel="noreferrer">Kejahatan siber · Polri</a><a href="https://iasc.ojk.go.id/" target="_blank" rel="noreferrer">Penipuan transaksi · IASC</a><Link href="/emergency">Panduan darurat</Link></nav>
      <div className="footer-report-note"><strong>Simpan bukti sebelum melapor</strong><p>Catat alamat, akun, waktu kejadian, nominal, dan tangkapan layar. Jangan sebarkan OTP atau data pribadi.</p></div>
    </footer>
  );
}
