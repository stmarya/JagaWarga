'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icon';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('ioc') ?? [params.get('url'), params.get('text'), params.get('title')].filter(Boolean).join('\n').trim();
    if (shared) {
      router.replace(`/periksa?ioc=${encodeURIComponent(shared)}`);
    }
  }, [router]);

  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-kicker">PUSAT CEK DIGITAL UNTUK WARGA</p>
          <h1 id="landing-title">Berhenti sejenak.<br /><span>Periksa sebelum bertindak.</span></h1>
          <p className="landing-lead">JagaWarga membantu Anda memahami tautan, pesan, berkas, dan kode QR yang mencurigakan—dengan bahasa sederhana dan langkah yang jelas.</p>
          <div className="landing-hero-actions">
            <Link className="landing-primary" href="/periksa">Mulai periksa</Link>
            <Link className="landing-secondary" href="/emergency">Saya sudah terlanjur</Link>
          </div>
          <ul className="landing-trust" aria-label="Prinsip utama JagaWarga">
            <li><Icon name="shield" /> Data seperlunya</li>
            <li><Icon name="check" /> Bahasa mudah dipahami</li>
            <li><Icon name="users" /> Tanpa publikasi otomatis</li>
          </ul>
        </div>

        <div className="landing-signal-card" aria-label="Contoh cara JagaWarga membantu mengambil keputusan">
          <div className="signal-card-top">
            <span>CONTOH EDUKASI · BUKAN HASIL PEMERIKSAAN</span>
            <b>Pesan masuk</b>
          </div>
          <blockquote>
            “Paket Anda tertahan. Bayar Rp2.000 melalui tautan ini agar paket tidak dikembalikan.”
          </blockquote>
          <div className="signal-findings">
            <span><b>01</b> Mendesak Anda bertindak cepat</span>
            <span><b>02</b> Meminta pembayaran tak terduga</span>
            <span><b>03</b> Mengarahkan ke tautan asing</span>
          </div>
          <div className="signal-decision">
            <span className="signal-level">PERLU WASPADA</span>
            <strong>Jangan bayar atau buka tautannya.</strong>
            <p>Verifikasi status paket dari aplikasi atau situs kurir resmi.</p>
          </div>
        </div>
      </section>

      <section className="landing-orientation" aria-labelledby="orientation-title">
        <div className="orientation-heading">
          <p className="kicker">MULAI DARI SITUASI ANDA</p>
          <h2 id="orientation-title">Apa yang ingin Anda lakukan?</h2>
        </div>
        <div className="orientation-grid">
          <Link href="/periksa" className="orientation-card orientation-check">
            <span className="orientation-icon"><Icon name="search" size={24} /></span>
            <small>01 · PERIKSA</small>
            <strong>Saya menerima sesuatu yang mencurigakan</strong>
            <p>Periksa tautan, pesan, domain, IP, hash, berkas, atau kode QR.</p>
            <b>Mulai pemeriksaan <Icon name="arrow" /></b>
          </Link>
          <Link href="/emergency" className="orientation-card orientation-emergency">
            <span className="orientation-icon"><Icon name="alert" size={24} /></span>
            <small>02 · BERTINDAK</small>
            <strong>Saya sudah klik, transfer, atau memberi data</strong>
            <p>Ikuti langkah darurat untuk menghentikan kerugian dan mengamankan akun.</p>
            <b>Buka panduan darurat <Icon name="arrow" /></b>
          </Link>
          <Link href="/education" className="orientation-card orientation-learn">
            <span className="orientation-icon"><Icon name="book" size={24} /></span>
            <small>03 · BELAJAR</small>
            <strong>Saya ingin lebih siap menghadapi penipuan</strong>
            <p>Pelajari modus dengan contoh sederhana, evaluasi, dan tingkat bertahap.</p>
            <b>Mulai belajar <Icon name="arrow" /></b>
          </Link>
        </div>
      </section>

      <section className="landing-next" aria-labelledby="next-title">
        <div>
          <p className="kicker">LEBIH DARI PEMERIKSAAN</p>
          <h2 id="next-title">Bangun kebiasaan digital yang lebih aman.</h2>
          <p>Gunakan hasil pemeriksaan sebagai awal. Pelajari modus, pahami bukti teknis, lalu pilih alat sesuai pengalaman Anda. Hasil pemeriksaan adalah bantuan awal, bukan jaminan aman.</p>
        </div>
        <nav aria-label="Jelajahi fitur JagaWarga">
          <Link href="/dashboard"><Icon name="users" /><span><strong>Riwayat pemeriksaan</strong><small>Data pribadi dan publik dipisahkan</small></span><Icon name="arrow" /></Link>
          <Link href="/tools"><Icon name="work" /><span><strong>Alat bantu keamanan</strong><small>Pesan, email, hash, QR, dan tautan pendek</small></span><Icon name="arrow" /></Link>
        <Link href="/analyst"><Icon name="shield" /><span><strong>Mode Analis</strong><small>Bulk IoC, evidence, dan kasus lokal</small></span><Icon name="arrow" /></Link>
        </nav>
      </section>
    </main>
  );
}