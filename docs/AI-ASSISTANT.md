# Standar AI Asisten JagaWarga

## Tujuan

AI Asisten adalah lapisan penjelas dan pemandu. AI tidak menghitung skor, tidak mengganti verdict mesin, dan tidak boleh menyebut hasil pemeriksaan sebagai jaminan aman.

## Arsitektur

1. **Safety boundary** memvalidasi JSON, role, panjang percakapan, dan menyamarkan data rahasia.
2. **Intent router** membedakan penjelasan hasil, keadaan darurat, edukasi, alat bantu, dan pertanyaan umum.
3. **Trusted context** hanya memuat hasil pemeriksaan yang dinormalisasi, materi edukasi internal, dan kanal resmi yang telah diverifikasi.
4. **Deterministic severity policy** menjadi satu-satunya sumber label risiko.
5. **Grounded model** menyusun bahasa natural dalam JSON terstruktur. Model tidak menghitung skor.
6. **Output validator** membatasi panjang, jumlah item, dan tujuan tautan.
7. **Local advisor** mengambil alih ketika model cloud tidak aktif, timeout, atau mengembalikan respons tidak valid.

## Kebijakan keamanan

- Endpoint hanya menerima role `user` dan `assistant`; role `system` dari client ditolak.
- Maksimal 10 pesan, 1.600 karakter per pesan, 8.000 karakter total, dan payload 24 KB.
- Rate limit: 12 permintaan per lima menit per client hash.
- Timeout provider: 12 detik.
- OTP, PIN, kata sandi, CVV, nomor kartu, token, dan string rahasia panjang disamarkan sebelum keluar dari server.
- Respons menggunakan `Cache-Control: no-store` dan request ID.
- Tautan keluaran hanya dapat menuju route internal atau kanal resmi dalam allowlist.
- Nomor telepon darurat tidak boleh di-hardcode. Pengguna diarahkan ke aplikasi, kartu, atau situs resmi.

## Sumber dan pembaruan

Kanal resmi disimpan di `lib/ai/knowledge.ts` bersama tanggal verifikasi. Periksa tautan dan tanggal tersebut sebelum setiap release. Materi edukasi diambil dari katalog `lib/education.ts`.

## UX dan aksesibilitas

- Gunakan identitas `JW`, bukan ikon AI generik.
- Dialog mendukung fokus awal, focus trap, tombol Escape, pemulihan fokus, `aria-live`, dan viewport `100dvh`.
- Bahasa harus natural, singkat, tidak menyalahkan korban, dan mudah dipahami orang awam.
- Jawaban disusun dalam status, alasan, tindakan, hal yang harus dihindari, eskalasi, sumber, dan tautan tindakan.
- Pengguna selalu melihat peringatan agar tidak mengirim data rahasia.

## Observability dan QA

Metrics yang dicatat: `ai_chat_model`, `ai_chat_fallback`, dan feedback kategori `ai-*`. Jangan mencatat isi percakapan atau indikator mentah.

Sebelum release:

```bash
npm run build
npm test
npm run security:secrets
npm run test:responsive
```

Kasus wajib: system-role injection, redaksi rahasia, negasi keadaan darurat, context normalization, allowlist tautan, timeout, fallback, keyboard, 320 px, 390 px, dan desktop.