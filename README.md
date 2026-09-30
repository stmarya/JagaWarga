<div align="center">

# 🛡️ JagaWarga

**Periksa Sebelum Bertindak — Platform Investigasi IoC, Pertolongan Pertama Insiden Digital, dan Literasi Siber Terpadu untuk Indonesia**

[![Production](https://img.shields.io/badge/Production-jagawarga.cloud-22c55e?style=for-the-badge&logo=googlechrome&logoColor=white)](https://jagawarga.cloud)
[![Version](https://img.shields.io/badge/version-v0.13.0--rc.4-blue?style=for-the-badge)](package.json)
[![Tests](https://img.shields.io/badge/tests-112%20passed-success?style=for-the-badge&logo=vitest&logoColor=white)](vitest.config.ts)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

*Cek sebelum klik. Pahami risikonya dalam bahasa manusia, lalu ambil langkah yang aman.*

[🌐 Website Resmi](https://jagawarga.cloud) • [🔍 Scanner IoC](https://jagawarga.cloud/periksa) • [🚨 Darurat Digital](https://jagawarga.cloud/emergency) • [🤖 Asisten AI](https://jagawarga.cloud) • [📖 Dokumentasi Teknis](docs/)

---

</div>

## 📌 Mengapa JagaWarga Dibutuhkan?

Kejahatan siber di Indonesia terus berevolusi pesat: mulai dari **penipuan kurir paket APK**, **phishing perbankan lewat undangan pernikahan digital**, **quishing (QRIS palsu)**, hingga manipulasi tautan singkat yang mengelabui masyarakat awam. 

Kebanyakan platform analisis keamanan siber saat ini dirancang untuk analis SOC (*Security Operations Center*) dengan istilah teknis rumit (CVSS, raw JSON, entropy, YARA rules) dalam bahasa asing, atau justru membahayakan privasi pengguna dengan mengunggah berkas mentah ke repositori publik.

**JagaWarga hadir untuk menutup kesenjangan ini:**
1. **Bagi Masyarakat Umum**: Menyediakan antarmuka bahasa Indonesia yang ramah, skor risiko yang mudah dipahami (0–100), panduan aksi mitigasi langsung, serta pertolongan pertama darurat saat insiden terjadi.
2. **Bagi Analis Keamanan, Jurnalis & Komunitas IT**: Menyediakan pemindaian indikator ancaman (*Indicator of Compromise* / IoC) seperti hash malware, IP address, subdomain, dan URL tanpa mengunggah data rahasia (*existing lookup only*) serta bebas pelacak pihak ketiga.

---

## 🌟 Fitur Unggulan (Core Capabilities)

### 1. 🔍 Pusat Scanner IoC Cerdas ([`/periksa`](https://jagawarga.cloud/periksa))
Platform inspeksi ancaman multi-vektor real-time:
- **URL & Domain Lookup**: Mendeteksi reputasi domain, typo-squatting, Domain Age, status DNS, dan agregasi multi-mesin anti-malware.
- **Malware Hash Detection (SHA-256, SHA-1, MD5)**: Menganalisis tanda tangan file berbahaya dengan ekstraksi otomatis nama malware & threat family (seperti `Troj/Stealer`, `LokiBot`, `CobaltStrike`, `Spyware`, dll.).
- **Deteksi IoC Fleksibel**: Otomatis membersihkan prefix label (`SHA256:`, `md5:`, kutipan), tanda kurung, serta mendukung format *de-fanged IoC* (`hxxps://`, `malware[.]com`, `103[.]20[.]188[.]1`).
- **Analisis Pesan Phishing**: Analisis konten pesan WhatsApp/SMS secara heuristik untuk mendeteksi urgensi buatan, ancaman penonaktifan rekening, paksaan OTP, atau nomor kontak penipu.
- **QR Code Inspection (Quishing Defender)**: Membaca dan mendekode QR code langsung di browser tanpa mengirim gambar ke server.
- **Verifikasi File APK / Dokumen Lokal**: Menghitung hash SHA-256 berkas lokal menggunakan Web Crypto API di browser Anda. Berkas fisik tidak pernah keluar dari perangkat Anda.

### 2. 🚨 Pertolongan Pertama Insiden Digital ([`/emergency`](https://jagawarga.cloud/emergency))
Panduan tindakan kritis "Golden Hour" jika insiden siber sudah terjadi:
- **Terlanjur Klik Link Berbahaya**: Pembersihan sesi, revoke permissions, cek riwayat unduhan.
- **Terlanjur Transfer Uang / Tertipu**: Daftar kontak darurat perbankan di Indonesia, pelaporan ke CSIRT / CekRekening.id, dan penerbitan laporan kepolisian.
- **Terlanjur Mengisi Password / OTP**: Langkah pengamanan akun, logout paksa semua perangkat, dan aktivasi autentikasi 2FA berbasis hardware/app.
- **Terlanjur Pasang File APK**: Prosedur isolasi ponsel (Airplane mode), pencabutan izin SMS listener, Safe Mode boot, dan factory reset bersih.

### 3. 🤖 AI Grounded Security Advisor
Asisten keamanan interaktif berbasis LLM (Groq / Llama) yang berjalan dengan guardrail ketat:
- **Grounded & Anti-Halusinasi**: Asisten memahami konteks halaman yang sedang Anda buka dan hasil lookup terkini, menjawab langsung pertanyaan spesifik dengan terminologi Indonesia yang jernih.
- **Privacy-Guarded**: Tidak meminta atau memproses data rahasia; fallback otomatis ke basis pengetahuan lokal jika koneksi model eksternal bermasalah.

### 4. 🛠️ Security Toolbox ([`/tools`](https://jagawarga.cloud/tools))
Perangkat pembantu investigasi praktis:
- **URL Unshortener**: Membongkar rantai pengalihan (*redirect hops*) tautan pendek seperti `bit.ly`, `tinyurl.com`, `s.id` lengkap dengan validasi anti-SSRF ketat (blokir IP privat/link-local).
- **Email Header Analyzer**: Membedah header email mentah untuk memvalidasi autentikasi pengirim: SPF (*Sender Policy Framework*), DKIM (*DomainKeys Identified Mail*), dan DMARC.
- **Standalone QR Decoder & Hasher**.

### 5. 📚 Akademi Literasi Digital & Gamifikasi ([`/education`](https://jagawarga.cloud/education))
- Modul belajar interaktif dengan contoh kasus nyata di Indonesia (penipuan kurir, tugas like-subscribe telegram, fake update banking).
- Sistem skor literasi, XP, dan lencana pencapaian (*badges*) yang tersimpan aman secara lokal di browser (*Local Storage*).

### 6. 📱 Progressive Web App (PWA) Siap Pakai
- Dapat di-*install* langsung ke layar utama (*Add to Home Screen*) di ponsel Android, iPhone, Windows, maupun macOS.
- Mendukung fitur **Web Share Target**: pengguna dapat menekan "Share" dari WhatsApp atau aplikasi pesan lain dan langsung memilih JagaWarga untuk menganalisis tautan mencurigakan.

---

## 🔒 Prinsip Keamanan & Privasi (Privacy-First)

JagaWarga dibangun dengan paradigma **Fail-Closed** dan **Data Minimization**:

```
[ Pengguna ] ──(HTTPS TLS 1.3)──> [ Caddy Edge Proxy ]
                                           │
                                  [ Next.js Standalone ]
                                  (Non-root, Read-only FS)
                                    ├── Browser-side Hasher (Zero Raw Upload)
                                    ├── Safe Fetch (Anti-SSRF IP Validation)
                                    └── Rate Limiter & Circuit Breaker
                                           │
                                  [ In-Memory Redis ]
                                  (Internal Network Only, Disposable)
```

| Prinsip | Implementasi Teknis |
| :--- | :--- |
| **Existing Lookup Only** | JagaWarga **tidak pernah** mengunggah file mentah, email utuh, atau sample malware ke provider pihak ketiga. Pencarian hanya berbasis tanda tangan metadata / hash yang sudah diketahui. |
| **Zero Raw Storage** | Tidak ada penyimpanan permanen konten pesan atau tautan pengguna di server. Data tersimpan di sisi klien (*local first*). |
| **Anti-SSRF Protection** | Gateway parser memblokir seluruh alamat IP privat RFC 1918, loopback, link-local, dan multicast sebelum melakukan DNS resolution. |
| **Content Security Policy (CSP)** | Header CSP ketat, pencegahan framing (`X-Frame-Options: DENY`), isolasi proses, dan sanitasi payload JSON. |
| **Circuit Breaker & Rate Limiter** | Membatasi konsumsi API eksternal secara adaptif agar layanan tetap andal di bawah lonjakan trafik. |

---

## 🚀 Panduan Deployment Cloud Hosting

JagaWarga dapat di-deploy dengan mudah di Linux VPS (Ubuntu/Debian) menggunakan Docker Compose dan Caddy reverse proxy (otomatis HTTPS / Let's Encrypt).

### 1. Kebutuhan Server
- Linux VPS (Ubuntu 22.04 LTS / 24.04 LTS direkomendasikan).
- Domain terdaftar (misal: `jagawarga.cloud`) dengan DNS A record mengarah ke IP publik server.
- Port terbuka di firewall: **80/tcp** (HTTP) dan **443/tcp, 443/udp** (HTTPS/QUIC).
- Docker Engine & Docker Compose v2.

### 2. Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/stmarya/JagaWarga.git /opt/jagawarga
cd /opt/jagawarga

# 2. Siapkan file konfigurasi production
cp deploy/self-hosted/.env.production.example deploy/self-hosted/.env.production

# 3. Edit konfigurasi environment
nano deploy/self-hosted/.env.production
```

Contoh konfigurasi `.env.production`:
```env
PUBLIC_HOST=jagawarga.cloud
CADDY_DOMAINS=jagawarga.cloud, www.jagawarga.cloud
ACME_EMAIL=admin@jagawarga.cloud
IMAGE_REF=jagawarga:0.13.0-rc.4
ADMIN_METRICS_TOKEN=masukkan-token-acak-minimal-32-karakter

# Intelligence Providers & AI (Opsional)
FEATURE_PREMIUM_PROVIDERS=true
VIRUSTOTAL_API_KEYS=key1,key2,key3
GROQ_API_KEYS=gsk_key1,gsk_key2
GROQ_MODEL=openai/gpt-oss-120b
```

### 3. Jalankan Kontainer (Gas!)

```bash
# Build dan jalankan stack (Caddy + Next.js App + Redis)
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d --build
```

Kunjungi `https://jagawarga.cloud`. Caddy akan otomatis mengurus sertifikat SSL Let's Encrypt sehingga gembok hijau HTTPS langsung aktif seketika.

---

## 💻 Menjalankan di Lingkungan Lokal (Development)

Untuk pengembangan lokal dan berkontribusi:

```bash
# Clone dan install dependensi
git clone https://github.com/stmarya/JagaWarga.git
cd JagaWarga
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

### Menjalankan dengan Docker Lokal
```bash
# Inisialisasi token lokal
npm run local:env

# Jalankan kontainer lokal (App + Redis)
npm run local:up
```

---

## 🧪 Pengujian & Kualitas Kode (Test Suite)

JagaWarga memiliki suite pengujian otomatis komprehensif untuk memastikan reliabilitas dan stabilitas fail-closed:

```bash
# Menjalankan 112 Unit & Contract Tests
npm test

# Menjalankan pengujian kepatuhan kontrak OpenAPI 3.1 (15 API routes)
npm run test:openapi

# Audit keamanan secret scanning
npm run security:secrets

# Menjalankan validasi operational & fail-closed proofs
npm run operations:proof
```

---

## 📡 Dokumentasi REST API

Seluruh endpoint terstandarisasi OpenAPI 3.1 dan dapat diakses di `/openapi.json`:

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/lookups` | Agregasi reputasi IoC (URL, Domain, IP, File Hash) |
| `POST` | `/api/analyze/message` | Analisis konten pesan teks indikasi penipuan |
| `POST` | `/api/analyze/email-header` | Analisis otentikasi header email (SPF, DKIM, DMARC) |
| `POST` | `/api/tools/unshorten` | Membuka rantai pengalihan URL dengan anti-SSRF |
| `POST` | `/api/ai/chat` | AI Security Assistant dengan grounded knowledge |
| `GET` | `/api/education` | Mengambil katalog topik edukasi literasi siber |
| `GET/POST`| `/api/history` | Riwayat anonim lookup komunitas (opsional) |
| `GET` | `/api/health` | Healthcheck kesiapan aplikasi |
| `GET` | `/api/live` | Process liveness probe |
| `GET` | `/api/ready` | Kesiapan runtime & koneksi Redis |
| `GET` | `/api/slo` | Status metrik Service Level Objective (SLO) |
| `GET` | `/api/version` | Versi aplikasi, immutable digest, dan release policy |

---

## 🤝 Kontribusi

Kami sangat menyambut kontribusi dari komunitas keamanan siber, pengembang web, dan pegiat literasi digital Indonesia:
1. *Fork* repositori ini.
2. Buat branch fitur baru (`git checkout -b feature/fitur-keren`).
3. Pastikan seluruh pengujian lulus (`npm test && npm run test:openapi`).
4. *Commit* perubahan Anda dengan format konvensional (`feat: ...` atau `fix: ...`).
5. *Push* ke branch Anda dan buat **Pull Request**.

Kebijakan pelaporan kerentanan keamanan dapat dibaca di [**`SECURITY.md`**](SECURITY.md).

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi terbuka [**MIT License**](LICENSE).

<div align="center">
  <sub>Dibangun dengan dedikasi untuk menjaga ruang digital warga Indonesia yang lebih aman, berdaya, dan teredukasi.</sub>
</div>
