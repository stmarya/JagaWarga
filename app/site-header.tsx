'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icon';

export function SiteHeader() {
  const pathname = usePathname() || '/';

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navigasi utama">
        <Link className="wordmark" href="/" aria-label="JagaWarga, beranda">
          <span className="wordmark-mark" aria-hidden="true">JW</span>
          <span>
            <strong>JAGA/WARGA</strong>
            <small>Pusat Cek Digital</small>
          </span>
        </Link>
        <span className="system-live-pill" aria-label="Status sistem: Siaga">
          <span className="live-dot" aria-hidden="true" />
          <span>Sistem Siaga</span>
        </span>
        <div className="nav-links">
          <Link className={pathname === '/' ? 'active' : ''} href="/#scanner">Mulai Cek</Link>
          <Link className={pathname.startsWith('/dashboard') ? 'active' : ''} href="/dashboard">Riwayat</Link>
          <Link className={pathname.startsWith('/education') ? 'active' : ''} href="/education">Edukasi</Link>
          <Link className={pathname.startsWith('/tools') ? 'active' : ''} href="/tools">Alat Bantu</Link>
        </div>
        <Link className={`nav-emergency ${pathname.startsWith('/emergency') ? 'active' : ''}`} href="/emergency" title="Panduan jika sudah terlanjur klik atau transfer">
          <span className="emergency-icon" aria-hidden="true">!</span>
          <span>Darurat</span>
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer-shell">
      <div className="site-footer">
        <div className="footer-brand">
          <span className="footer-logo">JW</span>
          <div>
            <strong>JAGA/WARGA</strong>
            <p>Periksa sinyalnya. Pahami risikonya. Ambil langkah aman.</p>
          </div>
          <small>Hasil pemeriksaan adalah bantuan awal, bukan jaminan keamanan mutlak.</small>
        </div>
        <nav aria-label="Jelajahi JagaWarga">
          <strong>Jelajahi</strong>
          <Link href="/#scanner">Mulai periksa</Link>
          <Link href="/dashboard">Riwayat komunitas</Link>
          <Link href="/education">Belajar keamanan</Link>
          <Link href="/tools">Alat bantu</Link>
        </nav>
        <div className="footer-report-column">
          <strong>Laporkan ancaman</strong>
          <a className="report-link report-komdigi" href="https://aduankonten.id/" target="_blank" rel="noreferrer">
            <Icon name="alert" />
            <span><b>Konten berbahaya</b><small>Komdigi · Aduan Konten</small></span>
          </a>
          <a className="report-link report-polri" href="https://patrolisiber.id/" target="_blank" rel="noreferrer">
            <Icon name="shield" />
            <span><b>Kejahatan siber</b><small>Polri · Patrolisiber</small></span>
          </a>
          <a className="report-link report-ojk" href="https://iasc.ojk.go.id/" target="_blank" rel="noreferrer">
            <Icon name="transaction" />
            <span><b>Penipuan transaksi</b><small>OJK · IASC</small></span>
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 JagaWarga</span>
        <div>
          <Link href="/privacy">Privasi</Link>
          <Link href="/methodology">Metode</Link>
          <Link href="/support">Bantuan</Link>
        </div>
        <span>Dibuat untuk keamanan digital warga</span>
      </div>
    </footer>
  );
}
