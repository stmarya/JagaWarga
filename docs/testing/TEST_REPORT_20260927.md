# Laporan Pengujian dan Perbaikan - 27 September 2026

Dokumen ini berisi rangkuman dari pengujian dan perbaikan yang telah dilakukan pada environment pengembangan (development) aplikasi JagaWarga.

## 1. Konfigurasi API Key (File `.env`)
- **Tindakan**: Menambahkan berbagai API Key premium (VirusTotal, Censys, AbuseIPDB, VPNAPI, CriminalIP, OpenTip, FileScan, URLScan, IPQualityScore, IPHub, ProxyCheck) ke dalam file `.env`.
- **Pengaturan Fitur**: Mengubah `FEATURE_PREMIUM_PROVIDERS=false` menjadi `FEATURE_PREMIUM_PROVIDERS=true` di `.env` agar aplikasi mengizinkan pemanggilan penyedia premium.
- **Hasil**: Kredensial telah tersimpan dengan aman di *local environment*.

## 2. Uji Coba (Testing) API Key
- **Tindakan**: Melakukan pengujian langsung (menggunakan *command-line HTTP client*) ke *endpoint* API VirusTotal (`https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8`) menggunakan salah satu API Key yang dimasukkan.
- **Hasil**: **SUKSES (HTTP 200)**. API Key divalidasi sebagai sah (valid) oleh server VirusTotal dan berhasil mengembalikan data (resolusi IP Google).

## 3. Perbaikan Error CSP `eval()` di Browser
- **Masalah**: Saat menjalankan `npm run dev`, muncul *error* di *console* browser: `eval() is not supported in this environment...` karena Content Security Policy (CSP) memblokir eksekusi fitur-fitur *debugging* bawaan dari React.
- **Tindakan**: Memodifikasi file `next.config.ts`.
- **Detail Perbaikan**: Menambahkan aturan `'unsafe-eval'` pada `script-src` secara dinamis **hanya** jika aplikasi sedang dijalankan dalam mode pengembangan (`process.env.NODE_ENV !== 'production'`).
- **Hasil**: Halaman *development* dapat diakses dengan lancar tanpa terblokir oleh keamanan CSP.

## 4. Evaluasi Sistem Pencarian (Lookup API)
- **Observasi**: Meskipun API Key telah ditambahkan dan `FEATURE_PREMIUM_PROVIDERS` diset ke `true`, aplikasi (versi `0.10.0` MVP) saat ini secara bawaan (di dalam `lib/providers/` dan `lib/lookup.ts`) **hanya baru mengimplementasikan Adaptor DNS** (`CloudflareDnsAdapter` dan `GoogleDnsAdapter`).
- **Kesimpulan**: *Backend* aplikasi masih mengembalikan respon standar dan belum mengkomsumsi data dari API Key (seperti VirusTotal) karena kode integrasi adapter untuk penyedia premium tersebut belum diprogram ke dalam arsitektur aplikasi JagaWarga saat ini.
- **Langkah Lanjutan (Rekomendasi)**: Tim *engineer* perlu membangun *class adapter* baru yang mengimplementasikan *interface* `ProviderAdapter` (misalnya `VirusTotalAdapter`) ke dalam direktori `lib/providers/` untuk mulai menyajikan data intelijen ancaman tersebut ke pengguna.

## 5. Tindak Lanjut Engineering
- **Implementasi**: `VirusTotalAdapter` ditambahkan untuk existing lookup URL, domain, IPv4/IPv6, dan hash.
- **Privasi**: Adapter tidak memakai endpoint submission dan selalu mengembalikan `submissionOccurred: false`.
- **Governance**: Adapter hanya aktif ketika `FEATURE_PREMIUM_PROVIDERS=true` dan `VIRUSTOTAL_API_KEY` tersedia.
- **Keamanan**: API key dikirim melalui header `x-apikey`, tidak melalui URL atau log. Origin tetap dibatasi ke `www.virustotal.com`, dengan DNS pinning, public-IP validation, timeout, content-type check, dan response-size cap.
- **Testing**: Normalisasi malicious/benign/no-record, URL lookup ID, serta kebijakan no-submission ditutup dengan unit tests.

## 6. Kendala Deploy Lokal via Docker Compose
- **Masalah 1 (`POSTGRES_PASSWORD is missing`)**: Perintah `npm run local:up` gagal dengan *error interpolation* `DATABASE_URL` karena file `.env.local-deploy` kehilangan variabel lingkungan `POSTGRES_PASSWORD`.
  - **Penyelesaian**: Menambahkan secara manual `POSTGRES_PASSWORD=postgres` di dalam file `.env.local-deploy`.
- **Masalah 2 (`chown: Operation not permitted` pada Redis)**: Container Redis terus menerus berstatus *unhealthy* dan gagal berjalan (*Crash Loop*) di dalam Docker karena aplikasi tidak diberikan hak akses (kapabilitas) *user/group ownership*. Ini adalah akibat dari fitur pengaman `cap_drop: ["ALL"]` yang ditulis di `compose.yaml`.
  - **Penyelesaian**: Mengedit `compose.yaml` pada bagian *service redis* dengan menyuntikkan (menambahkan) `cap_add: ["CHOWN", "SETGID", "SETUID"]` agar kontainer memiliki izin akses *storage* yang memadai.

## 7. Penanganan *Error Script* di Windows
- **Masalah (`ALLOW_HTTP_PREFLIGHT is not recognized`)**: Saat menjalankan skrip validasi lokal `npm run local:verify`, muncul error syntax karena CMD/PowerShell Windows tidak membaca format perintah penugasan variabel linux seperti `VAR=val npm run ...`.
  - **Penyelesaian**: Menjalankan skrip validasi dengan penulisan berformat PowerShell asli secara manual: `$env:ALLOW_HTTP_PREFLIGHT="true"; $env:BASE_URL="http://127.0.0.1:3000"; npm run preflight`. Hasilnya lolos validasi (Passed).

## 8. Kendala Service Worker (PWA) Transisi Server
- **Masalah**: Setelah Docker menyala di port `3000`, *browser* memuntahkan sangat banyak error kemerahan di konsol (seperti `TypeError: Failed to convert value to 'Response'` dan `net::ERR_FAILED` untuk file-file *Turbopack*).
- **Analisis & Penyelesaian**: Ini **bukan *bug* pada aplikasi**. *Error* ini disebabkan oleh bergesernya status *environment* port `3000` (dari *Node JS Dev Server* beralih menjadi *Docker Production Build*). Service Worker dari mode pengembangan yang telah ter-*install* di browser terus mencoba meminta akses aset yang mana strukturnya kini sudah berubah di lingkungan produksi (Docker).
  - **Solusi Tuntas**: Melakukan **Hard Refresh** (`Ctrl + F5`) di browser, yang memaksa browser untuk membuang *cache* Service Worker lawas dan menarik *state* terbaru dari kontainer Docker.

## 9. Audit Lanjutan dan Perbaikan v0.12.0

- **Lookup terlihat selalu “Belum ada cukup data”**:
  - DNS hanya menyediakan metadata dan memang tidak boleh diperlakukan sebagai reputasi.
  - VirusTotal tidak aktif bila feature flag mati, key hilang, atau nilai berisi beberapa key yang dipisahkan koma.
  - Cache lookup sebelumnya tidak membedakan kombinasi provider aktif.
  - **Perbaikan**: menambahkan provider diagnostics, validasi single-key, cache key berbasis provider, partial-provider reporting, dan penjelasan hasil yang kontekstual.
- **Pesan UI menyesatkan**: halaman selalu mengatakan provider produksi belum dikonfigurasi walaupun provider bisa aktif.
  - **Perbaikan**: verdict, alasan, freshness, source link, risk signal, provider failure, dan rekomendasi tindakan sekarang berasal dari hasil aktual.
- **Service worker**: fallback sebelumnya dapat mengembalikan `undefined`, yang memang dapat memicu `Failed to convert value to 'Response'`.
  - **Perbaikan**: cache versioning, old-cache cleanup, explicit offline `Response`, network-first fallback, dan service-worker cleanup pada development.
- **Windows verification**: script POSIX diganti dengan Node wrapper lintas platform.
- **Environment lama**: `local:env` sekarang memperbaiki variabel wajib yang hilang tanpa menimpa secret atau konfigurasi yang sudah ada.
- **Regression coverage**: browser acceptance sekarang mencakup lookup, status provider, message analyzer, email-header analyzer, local file hashing, dashboard, service-worker console errors, dan load smoke 500 request.
