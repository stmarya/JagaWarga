'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export function SiteHeader() {
  const [query, setQuery] = useState('');
  function search(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (value) window.location.href = `/?ioc=${encodeURIComponent(value)}#scanner`;
  }
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Navigasi utama">
        <Link className="wordmark" href="/" aria-label="JagaWarga, beranda">
          <span className="wordmark-mark" aria-hidden="true">JW</span>
          <span><strong>JAGA/WARGA</strong></span>
        </Link>
        <form className="global-search" onSubmit={search}>
          <label className="sr-only" htmlFor="global-ioc">Cari URL, domain, IP, atau hash</label>
          <span aria-hidden="true">⌕</span>
          <input id="global-ioc" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="URL, domain, IP, atau hash" />
        </form>
        <div className="nav-links">
          <Link href="/dashboard">Riwayat</Link>
          <Link href="/status">Status</Link>
        </div>
        <Link className="nav-emergency" href="/emergency" aria-label="Bantuan darurat"><span aria-hidden="true">!</span></Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div><strong>JAGA/WARGA</strong><p>Cek sinyal ancaman. Ambil langkah aman.</p></div>
      <nav aria-label="Tautan informasi">
        <Link href="/methodology">Metode</Link><Link href="/privacy">Privasi</Link><Link href="/status">Status</Link><Link href="/support">Bantuan</Link>
      </nav>
      <p className="footer-caution">Hasil “bersih” bukan jaminan 100% aman.</p>
    </footer>
  );
}
