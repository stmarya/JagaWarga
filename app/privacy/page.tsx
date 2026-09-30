'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';

export default function PrivacyPage() {
  const [localHistoryCount, setLocalHistoryCount] = useState<number>(0);
  const [hasAiSession, setHasAiSession] = useState<boolean>(false);
  const [clearedNotice, setClearedNotice] = useState<string>('');

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('jagawarga:history');
      if (historyStr) {
        const parsed = JSON.parse(historyStr);
        if (Array.isArray(parsed)) setLocalHistoryCount(parsed.length);
      }
      const aiSession = sessionStorage.getItem('jagawarga:ai-assistant:v1');
      if (aiSession) setHasAiSession(true);
    } catch {
      // Storage access may be restricted
    }
  }, []);

  const handleClearLocalData = () => {
    try {
      localStorage.removeItem('jagawarga:history');
      localStorage.removeItem('jagawarga:user-xp');
      sessionStorage.removeItem('jagawarga:ai-assistant:v1');
      sessionStorage.removeItem('jagawarga:last-result');
      setLocalHistoryCount(0);
      setHasAiSession(false);
      setClearedNotice('Semua data lokal dan riwayat sesi browser berhasil dibersihkan!');
      setTimeout(() => setClearedNotice(''), 4000);
    } catch {
      setClearedNotice('Gagal menghapus penyimpanan lokal browser.');
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        history: JSON.parse(localStorage.getItem('jagawarga:history') || '[]'),
        xp: localStorage.getItem('jagawarga:user-xp') || '0',
        platform: 'JagaWarga Security Suite',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jagawarga-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Tidak ada data riwayat yang dapat diekspor.');
    }
  };

  return (
    <main className="compact-page privacy-page">
      <Link className="back-link" href="/">
        ← Kembali ke Beranda
      </Link>

      <header className="page-heading">
        <div>
          <p className="kicker">KEBIJAKAN & TRANSPARANSI PRIVASI</p>
          <h1>Privasi Mutlak untuk Keamanan Warga</h1>
          <p>
            JagaWarga dibangun dengan filosofi <strong>Privacy by Design</strong>: kami tidak membuat profil pengguna, tidak melacak identitas, dan memproses data secara anonim dengan kontrol penuh di tangan Anda.
          </p>
        </div>
      </header>

      {/* Control Panel: User Data Status */}
      <section className="content-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--ui-blue)' }}>
        <div className="section-title">
          <div>
            <p className="step-label">KONTROL DATA MANDIRI</p>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>Data yang Tersimpan di Browser Anda</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ui-muted)' }}>
              Data pemeriksaan disimpan hanya di memori peramban Anda dan tidak pernah dikirim ke database profil kami.
            </p>
          </div>
        </div>

        <div className="facts-grid" style={{ margin: '18px 0 16px' }}>
          <div>
            <span>Riwayat Pencarian Lokal</span>
            <strong>{localHistoryCount} pemeriksaan tersimpan</strong>
          </div>
          <div>
            <span>Sesi Chat AI Asisten</span>
            <strong>{hasAiSession ? 'Tersimpan sementara di tab ini' : 'Kosong / Tidak ada sesi'}</strong>
          </div>
          <div>
            <span>Pelacak Pihak Ketiga</span>
            <strong style={{ color: '#08795a' }}>0 Pelacak (Bebas Iklan/Tracker)</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-action"
            onClick={handleClearLocalData}
            disabled={localHistoryCount === 0 && !hasAiSession}
          >
            <Icon name="close" size={16} /> Bersihkan Semua Data Lokal
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={handleExportData}
            disabled={localHistoryCount === 0}
          >
            <Icon name="file" size={16} /> Ekspor Data Saya (JSON)
          </button>
        </div>

        {clearedNotice && (
          <p className="inline-alert" style={{ marginTop: '12px', color: '#08795a', fontWeight: 700 }}>
            ✓ {clearedNotice}
          </p>
        )}
      </section>

      {/* Transparency Matrix */}
      <section className="content-card" style={{ marginBottom: '24px' }}>
        <div className="section-title">
          <div>
            <p className="step-label">MATRIKS TRANSPARANSI</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem' }}>Bagaimana Setiap Fitur Mengelola Data</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '14px', marginTop: '16px' }}>
          <article style={{ padding: '16px', borderRadius: '8px', background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--ui-blue)' }}><Icon name="search" size={20} /></span>
              <strong style={{ fontSize: '0.95rem' }}>Pemindai Indikator (URL, Domain, IP)</strong>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#334155' }}>
              <strong>Data yang dikirim:</strong> Hanya string indikator yang Anda ketik. Alamat IP asli Anda tidak diteruskan ke penyedia pihak ketiga (VirusTotal atau DNS); semua kueri dilakukan melalui proksi server JagaWarga.
            </p>
            <small style={{ color: 'var(--ui-muted)', fontSize: '0.74rem' }}>
              Penyimpanan: Hasil di-cache sementara di memori Redis dengan masa berlaku (TTL) maksimal 15 menit untuk efisiensi beban.
            </small>
          </article>

          <article style={{ padding: '16px', borderRadius: '8px', background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--ui-blue)' }}><Icon name="hash" size={20} /></span>
              <strong style={{ fontSize: '0.95rem' }}>Pemeriksaan Berkas (Hash SHA-256) & Kode QR</strong>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#334155' }}>
              <strong>100% Pemrosesan Lokal:</strong> Berkas dokumen, APK, atau gambar QR Anda <em>TIDAK PERNAH</em> diunggah ke server kami. Penghitungan sidik jari SHA-256 dan dekode barcode dikerjakan langsung oleh mesin peramban Anda menggunakan Web Crypto API.
            </p>
            <small style={{ color: 'var(--ui-muted)', fontSize: '0.74rem' }}>
              Penyimpanan: Nol bit disimpan di server JagaWarga.
            </small>
          </article>

          <article style={{ padding: '16px', borderRadius: '8px', background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--ui-blue)' }}><Icon name="message" size={20} /></span>
              <strong style={{ fontSize: '0.95rem' }}>Analisis Pesan & Header Email</strong>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#334155' }}>
              <strong>Diproses Sementara:</strong> Teks chat atau header email dianalisis secara in-memory untuk mendeteksi indikasi rekayasa sosial atau verifikasi SPF/DKIM, dan langsung dibuang dari memori saat hasil dikirimkan.
            </p>
            <small style={{ color: 'var(--ui-muted)', fontSize: '0.74rem' }}>
              Penyimpanan: Tanpa penyimpanan di disk atau basis data log percakapan.
            </small>
          </article>

          <article style={{ padding: '16px', borderRadius: '8px', background: '#f8f9fb', border: '1px solid #e2e6ed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--ui-blue)' }}><Icon name="spark" size={20} /></span>
              <strong style={{ fontSize: '0.95rem' }}>AI Asisten Siaga (Groq Cloud)</strong>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#334155' }}>
              <strong>Sanitasi Otomatis:</strong> Sistem kami menerapkan filter keamanan otomatis untuk menyamarkan nomor rekening, nomor telepon, dan pola NIK sebelum dikirim ke model AI. Percakapan hanya disimpan di sesi peramban Anda selama tab aktif.
            </p>
            <small style={{ color: 'var(--ui-muted)', fontSize: '0.74rem' }}>
              Peringatan: Jangan pernah menuliskan PIN, kode OTP, atau kata sandi Anda ke dalam kolom chat.
            </small>
          </article>
        </div>
      </section>

      {/* UU Perlindungan Data Pribadi (PDP) */}
      <section className="content-card" style={{ marginBottom: '24px' }}>
        <div className="section-title">
          <div>
            <p className="step-label">KEPATUHAN HUKUM</p>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>Kepatuhan terhadap UU Perlindungan Data Pribadi (UU No. 27/2022)</h2>
          </div>
        </div>
        <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
          Sebagai platform keamanan publik di Indonesia, JagaWarga menghormati dan menjunjung hak-hak subjek data sesuai amanat Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi:
        </p>
        <ul style={{ margin: '12px 0 0', paddingLeft: '22px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
          <li><strong>Hak Mendapatkan Kejelasan:</strong> Anda berhak mengetahui tujuan spesifik pemrosesan data (dijelaskan secara transparan di halaman ini).</li>
          <li><strong>Hak Menghapus Data:</strong> Anda dapat menghapus seluruh jejak riwayat lokal seketika melalui tombol di atas.</li>
          <li><strong>Minimisasi Data:</strong> Kami tidak meminta nama lengkap, NIK, alamat rumah, atau data perbankan untuk menggunakan seluruh layanan pemeriksaan.</li>
          <li><strong>Keamanan Transmisi:</strong> Seluruh komunikasi dilindungi enkripsi standar industri HTTPS / TLS 1.3 dengan kebijakan keamanan HTTP ketat (CSP, HSTS, no-sniff, deny-iframe).</li>
        </ul>
      </section>

      {/* FAQ Privasi */}
      <section className="content-card">
        <div className="section-title">
          <div>
            <p className="step-label">PERTANYAAN UMUM</p>
            <h2 style={{ margin: '0 0 12px', fontSize: '1.25rem' }}>Tanya Jawab Mengenai Privasi Anda</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <details style={{ background: '#f8f9fb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e6ed' }}>
            <summary style={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.86rem' }}>
              Apakah pihak bank atau pengirim tautan tahu bahwa saya memeriksa mereka di JagaWarga?
            </summary>
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
              <strong>Tidak.</strong> JagaWarga tidak pernah menghubungi server pemilik situs secara langsung dengan identitas peramban Anda. Kami memeriksa catatan publik (DNS global, basis data reputasi ancaman). Pemilik domain tidak akan menerima notifikasi bahwa domain mereka sedang diperiksa.
            </p>
          </details>

          <details style={{ background: '#f8f9fb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e6ed' }}>
            <summary style={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.86rem' }}>
              Apakah JagaWarga meminta izin lokasi ponsel (GPS)?
            </summary>
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
              <strong>Tidak sama sekali.</strong> Kebijakan keamanan peramban kami secara aktif menolak akses ke sensor lokasi, kamera latar, dan mikrofon melalui header HTTP <code>Permissions-Policy: geolocation=(), camera=()</code>. Kamera hanya diakses bila Anda secara sukarela menggunakan fitur Pembaca QR.
            </p>
          </details>

          <details style={{ background: '#f8f9fb', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e6ed' }}>
            <summary style={{ fontWeight: 800, cursor: 'pointer', fontSize: '0.86rem' }}>
              Bagaimana cara memastikan data saya benar-benar bersih?
            </summary>
            <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
              Cukup tekan tombol <strong>"Bersihkan Semua Data Lokal"</strong> di bagian atas halaman ini, atau hapus cache dan cookies browser Anda. Seluruh catatan riwayat di perangkat Anda akan seketika terhapus permanen.
            </p>
          </details>
        </div>
      </section>
    </main>
  );
}