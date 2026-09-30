# Self-Hosted Cloud Production Deployment (`jagawarga.cloud`)

Paket deployment ini menjalankan stack produksi JagaWarga di balik reverse proxy **Caddy 2** dengan otomasi sertifikat SSL/TLS Let's Encrypt, HTTP/3, dan container Next.js standalone yang berjalan secara non-root serta filesystem read-only.

---

## 🌐 Konfigurasi Domain Default
- **Production Host**: `jagawarga.cloud`
- **Alternatif / Redirect**: `www.jagawarga.cloud`
- **Protokol**: HTTPS otomatis (Let's Encrypt ACME)
- **Komponen**: Caddy Edge Proxy + Next.js App Standalone + Redis (In-Memory coordination)

---

## 💻 Kebutuhan Server (Host Requirements)

- Linux VPS (Ubuntu 22.04 LTS / 24.04 LTS atau Debian 12).
- Docker Engine 24+ & Docker Compose v2.
- DNS A record domain `jagawarga.cloud` dan `www.jagawarga.cloud` mengarah ke IP publik VPS.
- Port firewall terbuka: **80/tcp** (HTTP / ACME challenge) dan **443/tcp, 443/udp** (HTTPS / QUIC).

---

## 🚀 Pilihan Deployment

### Opsi A: Deployment Cepat (Direct Build di VPS) - *Direkomendasikan*

Opsi ini paling mudah jika Anda baru saja menyiapkan VPS baru dan ingin langsung meluncurkan situs tanpa perlu konfigurasi personal access token registry GitHub.

1. **Clone repositori di VPS:**
   ```bash
   git clone https://github.com/stmarya/JagaWarga.git /opt/jagawarga
   cd /opt/jagawarga
   ```

2. **Inisialisasi file konfigurasi:**
   ```bash
   cp deploy/self-hosted/.env.production.example deploy/self-hosted/.env.production
   chmod 600 deploy/self-hosted/.env.production
   nano deploy/self-hosted/.env.production
   ```
   *(Sesuaikan `ACME_EMAIL`, `ADMIN_METRICS_TOKEN`, dan API keys VirusTotal / Groq)*.

3. **Jalankan container:**
   ```bash
   docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d --build
   ```

---

### Opsi B: Strict Immutable Digest (GHCR Registry)

Opsi ini digunakan untuk rilis terkontrol penuh yang divalidasi oleh GitHub Actions dan launch gate formal.

1. **Siapkan konfigurasi dan gate:**
   ```bash
   npm ci
   npm run deploy:init
   ```

2. **Isi `.env.production`** dengan digest image GHCR yang tidak dapat diubah (*immutable*):
   ```env
   IMAGE_REF=ghcr.io/stmarya/jagawarga@sha256:<64_hex_digest>
   APP_IMAGE_DIGEST=sha256:<64_hex_digest>
   ```

3. **Verifikasi dan Deploy:**
   ```bash
   npm run deploy:verify
   bash deploy/self-hosted/deploy.sh
   ```

> **Catatan Operator**: Untuk peluncuran pilot pada domain baru sebelum berkas atestasi legal eksternal terkumpul lengkap, jalankan:
> ```bash
> SKIP_LAUNCH_GATE=true bash deploy/self-hosted/deploy.sh
> ```

---

## ⏪ Prosedur Rollback

Jika versi terbaru mengalami kendala:

```bash
# Rollback ke digest rilis stabil sebelumnya
ROLLBACK_IMAGE_REF='ghcr.io/stmarya/jagawarga@sha256:...' \
  bash deploy/self-hosted/rollback.sh
```

Atau jika menggunakan build langsung:
```bash
git checkout <COMMIT_STABIL_SEBELUMNYA>
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d --build app
```

---

## 🔒 Catatan Keamanan Arsitektur

- **Jaringan Redis Terisolasi**: Redis tidak mengekspos port ke host dan hanya berada di jaringan internal Docker (`data`).
- **Data Minimization**: Redis hanya menyimpan state koordinasi sementara (TTL rate limit & circuit breaker). Tidak ada database relasional permanen yang menyimpan data pengguna mentah.
- **Fail-Closed**: Jika terjadi kegagalan koneksi provider eksternal, sistem secara otomatis melakukan fallback ke analisis heuristik lokal yang aman.
- **Secrets Isolation**: Kunci rahasia tersimpan di file `.env.production` dengan permission `0600` yang secara ketat diabaikan oleh `.gitignore`.