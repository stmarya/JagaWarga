# Standard Responsif JagaWarga

Dokumen ini menjadi acuan wajib saat membuat atau mengubah halaman JagaWarga.

## Breakpoint dan perangkat uji

| Kelas | Lebar wajib diuji | Contoh |
| --- | --- | --- |
| Ponsel kecil | 320, 360 px | Android ringkas |
| Ponsel umum | 375, 390, 414 px | iPhone/Android |
| Tablet | 768, 820 px | Tablet portrait |
| Laptop | 1024, 1280 px | Laptop dan tablet landscape |
| Desktop | 1440 px | Monitor desktop |

Konten tidak boleh mempunyai horizontal overflow pada semua ukuran tersebut.

## Aturan implementasi

1. Gunakan container `min(1120px, 100% - 32px)`; pada ponsel sisakan minimal
   12 px pada setiap sisi.
2. Gunakan `clamp()` untuk judul besar. Hindari ukuran tetap yang lebih lebar
   dari viewport.
3. Grid harus berubah menjadi satu kolom sebelum isi terpotong. Tabel harus
   disederhanakan atau dapat digulir tanpa menggeser seluruh halaman.
4. Tombol utama minimal 44 × 44 px. Jarak antar-target sentuh minimal 8 px.
5. Input menggunakan `font-size` minimal 16 px di ponsel agar browser tidak
   melakukan zoom otomatis.
6. Teks isi maksimal 75 karakter per baris dan minimal 14 px.
7. Informasi tidak boleh bergantung pada warna saja; selalu sertakan label,
   ikon, atau penjelasan.
8. Animasi wajib menghormati `prefers-reduced-motion`.
9. Tombol mengambang tidak boleh menutup tombol submit, footer, atau isi penting.
10. Uji keyboard, fokus terlihat, pembesaran 200%, serta orientasi portrait dan
    landscape.

## Pola komponen

- **Status:** label bahasa manusia + warna severity + skor sebagai informasi
  pendukung.
- **KPI:** warna semantik konsisten: merah berbahaya, oranye mencurigakan,
  hijau tidak terdeteksi, abu-abu belum dinilai, ungu timeout.
- **Card:** padding 16–24 px, radius 8–14 px, dan tidak memakai lebar tetap pada
  ponsel.
- **Navigasi:** dapat digulir horizontal pada ponsel tanpa membuat halaman
  overflow.
- **Footer:** empat kolom desktop, dua kolom tablet, satu kolom ponsel.

## Pemeriksaan otomatis

Setelah production build berjalan:

```bash
npm run build
npm start
BASE_URL=http://127.0.0.1:3000 npm run test:responsive
```

Script menguji halaman utama pada seluruh breakpoint, mendeteksi horizontal
overflow, error console, serta elemen yang keluar dari viewport. Tambahkan route
baru ke `scripts/responsive-qa.mjs` setiap kali membuat halaman publik.

## Checklist review

- [ ] Tidak ada horizontal overflow.
- [ ] Semua fungsi dapat digunakan pada 320 px.
- [ ] Tombol dan input nyaman disentuh.
- [ ] Judul tidak terpotong.
- [ ] Grid dan tabel berubah bentuk dengan benar.
- [ ] Fokus keyboard terlihat.
- [ ] Warna mempunyai label teks.
- [ ] Animasi dapat dimatikan oleh preferensi perangkat.
- [ ] Halaman lolos build, unit test, secret scan, dan responsive QA.