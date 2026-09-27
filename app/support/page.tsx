import Link from 'next/link';

export default function SupportPage() {
  return (
    <main className="page">
      <Link href="/">← Beranda</Link>
      <p className="eyebrow">DUKUNGAN & ESKALASI</p>
      <h1>Dapatkan bantuan tanpa membagikan data sensitif.</h1>
      <section className="panel">
        <h2>Masalah hasil atau penggunaan</h2>
        <p>Catat ID permintaan yang tampil di hasil, jenis input, waktu kejadian, dan langkah reproduksi. Jangan sertakan indikator mentah, password, OTP, isi pesan pribadi, atau API key.</p>
        <p><a href="https://github.com/stmarya/JagaWarga/issues/new" target="_blank" rel="noreferrer">Buat issue non-sensitif</a></p>
      </section>
      <section className="panel">
        <h2>Kerentanan atau kebocoran data</h2>
        <p>Jangan membuka issue publik. Gunakan private security advisory agar detail tidak terekspos.</p>
        <p><a href="https://github.com/stmarya/JagaWarga/security/advisories/new" target="_blank" rel="noreferrer">Laporkan secara privat</a></p>
      </section>
      <section className="panel">
        <h2>Keadaan darurat</h2>
        <p>Jika akun atau transaksi sudah terdampak, ikuti panduan tindakan segera.</p>
        <Link href="/emergency">Buka panduan darurat</Link>
      </section>
    </main>
  );
}