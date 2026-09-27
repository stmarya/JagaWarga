'use client';

import { FormEvent, useMemo, useState } from 'react';
import { classifyInput } from '@/lib/input';

export default function Home() {
  const [value, setValue] = useState('');
  const [notice, setNotice] = useState('');
  const indicator = useMemo(() => classifyInput(value), [value]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setNotice(
      indicator.type === 'unknown'
        ? 'Input belum dikenali. Gunakan URL, domain, IP, MD5, SHA-1, atau SHA-256.'
        : `Siap memeriksa ${indicator.label}. Integrasi provider akan diaktifkan setelah readiness gate lulus.`,
    );
  }

  return (
    <main>
      <nav><span className="brand">🛡️ JagaWarga</span><a href="#prinsip">Cara kerja</a></nav>
      <section className="hero">
        <p className="eyebrow">SECURITY LOOKUP & AWARENESS</p>
        <h1>Ada link mencurigakan?<br />Cek sebelum klik.</h1>
        <p className="lead">Periksa URL, domain, IP, atau hash—lalu pahami risikonya dengan bahasa sederhana.</p>
        <form onSubmit={submit}>
          <label htmlFor="indicator">Masukkan objek yang ingin diperiksa</label>
          <div className="search">
            <input id="indicator" value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://contoh.id atau alamat IP" autoComplete="off" />
            <button type="submit" disabled={!value.trim()}>Periksa</button>
          </div>
          <small>Terdeteksi: <strong>{indicator.label}</strong>. Pilot hanya memakai metadata dan hasil yang sudah tersedia.</small>
        </form>
        {notice && <div className="notice" role="status">{notice}</div>}
      </section>
      <section id="prinsip" className="cards">
        <article><span>1</span><h2>Cek</h2><p>Kami mengenali jenis input tanpa langsung mengirimkannya ke pihak ketiga.</p></article>
        <article><span>2</span><h2>Pahami</h2><p>Hasil menampilkan alasan, sumber, freshness, dan tingkat keyakinan.</p></article>
        <article><span>3</span><h2>Bertindak</h2><p>Dapatkan langkah aman berikutnya—bukan sekadar skor teknis.</p></article>
      </section>
      <footer>Belum ada indikasi berbahaya bukan berarti 100% aman.</footer>
    </main>
  );
}
