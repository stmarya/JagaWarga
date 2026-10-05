'use client';

import { useState } from 'react';
import { Icon, type IconName } from '@/components/icon';

const cases: Array<{ id: string; title: string; prompt: string; icon: IconName; urgency: string; steps: string[] }> = [
  { id: 'clicked', title: 'Terlanjur membuka tautan', prompt: 'Saya klik link, tetapi belum mengisi apa pun.', icon: 'link', urgency: 'Lakukan sekarang', steps: ['Tutup halaman dan jangan unduh apa pun.', 'Hapus unduhan yang muncul tanpa Anda minta.', 'Perbarui browser dan jalankan pemeriksaan keamanan perangkat.', 'Pantau notifikasi login dan transaksi selama beberapa hari.'] },
  { id: 'credential', title: 'Memberikan password atau OTP', prompt: 'Saya sudah memasukkan data login atau kode rahasia.', icon: 'key', urgency: 'Sangat mendesak', steps: ['Gunakan perangkat lain yang tepercaya.', 'Ganti kata sandi akun terdampak dan akun lain yang memakai sandi sama.', 'Keluar dari semua sesi atau perangkat.', 'Aktifkan ulang MFA dan periksa email/nomor pemulihan.', 'Hubungi layanan resmi jika akses akun sudah hilang.'] },
  { id: 'money', title: 'Sudah transfer uang', prompt: 'Saya mengirim uang atau menyetujui transaksi.', icon: 'transaction', urgency: 'Hubungi bank sekarang', steps: ['Telepon bank atau e-wallet dari nomor resmi.', 'Minta pemblokiran transaksi, rekening, atau kartu.', 'Simpan bukti transfer, chat, nomor rekening, dan waktu kejadian.', 'Laporkan melalui IASC OJK dan kepolisian.', 'Abaikan pihak yang meminta biaya untuk mengembalikan dana.'] },
  { id: 'app', title: 'Memasang APK atau aplikasi', prompt: 'Saya memasang aplikasi dari chat atau situs.', icon: 'device', urgency: 'Putuskan koneksi', steps: ['Aktifkan mode pesawat atau putuskan Wi-Fi.', 'Jangan membuka aplikasi bank atau email dari perangkat tersebut.', 'Hapus aplikasi mencurigakan dan cabut izin aksesibilitas/admin.', 'Jalankan pemeriksaan keamanan atau reset perangkat bila perlu.', 'Ganti kredensial dari perangkat lain yang bersih.'] },
  { id: 'account', title: 'Akun sudah diambil alih', prompt: 'Saya tidak bisa masuk atau akun mengirim pesan sendiri.', icon: 'privacy', urgency: 'Pulihkan dan beri tahu kontak', steps: ['Gunakan halaman pemulihan resmi layanan.', 'Amankan email utama dan nomor telepon terlebih dahulu.', 'Beri tahu keluarga atau rekan agar mengabaikan pesan dari akun.', 'Periksa perubahan profil, forwarding, perangkat, dan transaksi.', 'Simpan nomor laporan dukungan sebagai bukti.'] },
];

export default function Emergency() {
  const [selected, setSelected] = useState(cases[0]);
  return <main className="compact-page emergency-page">
    <header className="emergency-hero"><span><Icon name="alert" size={30} /></span><div><p className="kicker">PERTOLONGAN PERTAMA DIGITAL</p><h1>Apa yang sudah terjadi?</h1><p>Pilih kondisi yang paling mirip. Ikuti langkah dari atas ke bawah. Tidak perlu melakukan semuanya sekaligus.</p></div></header>
    <div className="emergency-layout">
      <nav className="emergency-cases" aria-label="Pilih kondisi darurat">{cases.map((item) => <button type="button" aria-pressed={selected.id === item.id} className={selected.id === item.id ? 'active' : ''} onClick={() => setSelected(item)} key={item.id}><Icon name={item.icon} /><span><strong>{item.title}</strong><small>{item.prompt}</small></span></button>)}</nav>
      <section className="emergency-steps">
        <div className="urgency-label"><Icon name="alert" size={16} /> Lakukan sekarang · {selected.urgency}</div><h2>{selected.title}</h2>
        <ol>{selected.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
        <div className="report-actions"><a href="https://patrolisiber.id/" target="_blank" rel="noreferrer">Lapor ke Patrolisiber</a><a href="https://iasc.ojk.go.id/" target="_blank" rel="noreferrer">Lapor transaksi ke IASC</a></div>
      </section>
    </div>
    <aside className="privacy-banner"><strong>Jangan membayar jasa pemulihan yang menghubungi Anda lebih dulu.</strong><p>Pelaku sering menyamar sebagai petugas setelah penipuan pertama terjadi.</p></aside>
  </main>;
}
