# Katalog Edukasi JagaWarga

## Tujuan

Katalog menerjemahkan risiko keamanan digital menjadi keputusan praktis bagi
warga umum. Setiap topik mempunyai lima submateri dan sepuluh evaluasi. Materi
dibagi menjadi tingkat Dasar, Menengah, dan Lanjutan.

## Struktur data

- `education_topics`: identitas, urutan, deskripsi, dan emblem.
- `education_lessons`: ringkasan, tindakan aman, dan perilaku yang dihindari.
- `education_questions`: pertanyaan, pilihan, jawaban benar, dan penjelasan.
- `db/schema.sql` adalah kontrak penyimpanan relasional.
- Runtime terdistribusi menyimpan katalog yang sudah dibaca di Redis melalui
  hash `jagawarga:education-catalog:v1`.
- Browser hanya mengambil daftar ringkas dan satu topik aktif melalui
  `GET /api/education`, bukan memuat seluruh kurikulum ke bundle klien.

## Katalog

1. Phishing & Rekayasa Sosial — pesan palsu, tautan menyamar, impersonasi,
   permintaan rahasia, dan respons insiden.
2. Kata Sandi & Passkey — kredensial unik, frasa sandi, password manager,
   passkey, dan pemulihan akun.
3. MFA & Keamanan Akun — jenis MFA, MFA fatigue, OTP, sesi aktif, dan alert.
4. Keamanan Perangkat — pembaruan, kunci layar, aplikasi resmi, izin, dan
   perangkat hilang.
5. Wi-Fi & Jaringan Aman — hotspot palsu, HTTPS, transaksi, hotspot pribadi,
   dan router.
6. Privasi & Data Pribadi — data sensitif, jejak digital, pengaturan privasi,
   minimisasi, dan persetujuan.
7. Malware & File Berbahaya — ekstensi, makro, arsip, hash, dan isolasi.
8. Transaksi & Penipuan Digital — penerima, QR pembayaran, bukti transfer,
   remote access, dan salah transfer.
9. Keamanan Kerja & Kolaborasi — klasifikasi, berbagi cloud, BEC, rapat, dan
   pelaporan.
10. AI, Deepfake & Misinformasi — suara, gambar sintetis, klaim viral, akun
    tiruan, dan data ke AI.
11. Aman Menggunakan Chat — pengirim, pesan mendadak, lampiran, grup, dan
    pelaporan.
12. Menangani Insiden Digital — menghentikan dampak, mengamankan akun,
    mengumpulkan bukti, melapor, dan evaluasi.

## Prinsip editorial

1. Gunakan bahasa tindakan, bukan jargon.
2. Jangan menjanjikan keamanan mutlak.
3. Setiap evaluasi harus menjelaskan alasan jawaban.
4. Contoh tidak boleh memuat domain aktif, kredensial, atau data pribadi.
5. Perubahan materi harus memperbarui versi cache dan menjalani review.