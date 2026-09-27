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
