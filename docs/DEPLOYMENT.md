# Panduan Deployment & Operasional Cloud JagaWarga

Dokumen ini menjelaskan arsitektur, prosedur deployment ke server cloud publik (seperti VPS Ubuntu/Debian), manajemen sertifikat TLS, monitoring kesehatan, dan prosedur rollback darurat untuk platform **JagaWarga** (`https://jagawarga.cloud`).

---

## 🏗️ 1. Arsitektur Deployment Production

Sistem produksi JagaWarga menggunakan arsitektur container 3-tier yang terisolasi dengan prinsip **Least Privilege**:

```
                       Internet (User & Bot Traffic)
                                     │
                     ┌───────────────▼───────────────┐
                     │   Caddy Edge Proxy (Port 443) │
                     │  - Automatic TLS (Let's Encrypt)
                     │  - HTTP/2 & HTTP/3 (QUIC)     │
                     │  - Gzip / Zstd Compression    │
                     └───────────────┬───────────────┘
                                     │ (Docker Network: edge)
                     ┌───────────────▼───────────────┐
                     │     Next.js Standalone App    │
                     │  - Non-root user (nextjs:1001)│
                     │  - Read-only root filesystem  │
                     │  - Strict CSP & Security Header
                     │  - Anti-SSRF safe-fetch parser│
                     └───────────────┬───────────────┘
                                     │ (Docker Network: data - internal)
                     ┌───────────────▼───────────────┐
                     │    Redis In-Memory State      │
                     │  - No host port exposed       │
                     │  - Ephemeral TTL state        │
                     │  - Rate-limit & circuit memory│
                     └───────────────────────────────┘
```

### Karakteristik Keamanan:
- **Rootless & Read-Only**: Kontainer Next.js berjalan dengan user ID `1001` (bukan root) dan filesystem `read_only: true` dengan tmpfs terisolasi untuk direktori `/tmp` dan `.next/cache`.
- **Jaringan Terisolasi**: Jaringan `data` bersifat `internal: true`, sehingga Redis sama sekali tidak dapat diakses dari internet atau dari host secara langsung.
- **Fail-Closed Privacy**: Database relasional durable (seperti Postgres) sengaja belum diaktifkan sebelum audit privasi selesai; Redis hanya menyimpan state koordinasi sementara dengan TTL pendek.

---

## 📋 2. Kebutuhan Sistem & Pra-Syarat

### Spesifikasi Server (VPS):
- **CPU**: 1 Core vCPU (2 Core direkomendasikan).
- **RAM**: Minimal 1 GB (2 GB direkomendasikan).
- **Disk**: Minimal 10 GB SSD.
- **OS**: Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS (atau Debian 12).
- **Software**: Docker Engine 24+ & Docker Compose v2.

### Jaringan & DNS:
1. **Domain Record**: Arahkan DNS A record domain ke IP publik server:
   - `@` (atau `jagawarga.cloud`) -> `IP_PUBLIK_VPS`
   - `www` (atau `www.jagawarga.cloud`) -> `IP_PUBLIK_VPS`
2. **Port Terbuka (Firewall)**:
   - `80/tcp` (Wajib untuk tantangan ACME Let's Encrypt dan pengalihan HTTP -> HTTPS).
   - `443/tcp` & `443/udp` (Wajib untuk koneksi aman HTTPS dan QUIC HTTP/3).

---

## 🚀 3. Prosedur Deployment Langkah Demi Langkah

### Langkah 1: Persiapan Server VPS
Login ke server Anda via SSH dan pasang dependensi awal:
```bash
# Update paket sistem
sudo apt update && sudo apt upgrade -y

# Buka port firewall (UFW)
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
```

### Langkah 2: Clone Repositori
```bash
git clone https://github.com/stmarya/JagaWarga.git /opt/jagawarga
cd /opt/jagawarga
```

### Langkah 3: Konfigurasi Environment Production
Salin template environment:
```bash
cp deploy/self-hosted/.env.production.example deploy/self-hosted/.env.production
chmod 600 deploy/self-hosted/.env.production
nano deploy/self-hosted/.env.production
```

Isi variabel environment penting:
```env
# 1. Konfigurasi Domain & SSL
PUBLIC_HOST=jagawarga.cloud
CADDY_DOMAINS=jagawarga.cloud, www.jagawarga.cloud
ACME_EMAIL=admin@jagawarga.cloud

# 2. Versi & Identitas Image
IMAGE_REF=jagawarga:0.13.0-rc.4
APP_IMAGE_DIGEST=sha256:build
APP_VERSION=0.13.0-rc.4

# 3. Kunci Rahasia Internal (Minimal 32 Karakter Acak)
ADMIN_METRICS_TOKEN=masukkan-token-sangat-rahasia-minimal-32-karakter

# 4. Layanan Eksternal (Opsional namun sangat direkomendasikan)
FEATURE_PREMIUM_PROVIDERS=true
VIRUSTOTAL_API_KEYS=kunci1,kunci2,kunci3
GROQ_API_KEYS=gsk_key1,gsk_key2
GROQ_MODEL=openai/gpt-oss-120b
```

### Langkah 4: Luncurkan Stack Kontainer
Jalankan perintah compose production:
```bash
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d --build
```

Atau menggunakan automated helper:
```bash
SKIP_LAUNCH_GATE=true bash deploy/self-hosted/deploy.sh
```

---

## 🔍 4. Verifikasi Pasca-Deployment

Periksa status seluruh layanan yang berjalan:
```bash
# Cek kontainer yang aktif
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml ps

# Periksa log proxy Caddy (negosiasi SSL Let's Encrypt)
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml logs proxy --tail=50

# Periksa log aplikasi Next.js
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml logs app --tail=50
```

### Uji Endpoint Kesehatan (Health Check):
```bash
# 1. Health Probe
curl -i https://jagawarga.cloud/api/health

# 2. Process Liveness
curl -i https://jagawarga.cloud/api/live

# 3. Runtime Readiness
curl -i https://jagawarga.cloud/api/ready

# 4. Versi & Release Info
curl -i https://jagawarga.cloud/api/version
```

---

## 🔄 5. Pembaruan Versi (Update / Rollout)

Untuk memperbarui aplikasi ke versi terbaru tanpa menghapus state Redis:

```bash
cd /opt/jagawarga

# Tarik perubahan kode terbaru
git pull origin main

# Rebuild dan restart kontainer Next.js
docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d --build app
```

---

## ⏪ 6. Prosedur Rollback Darurat

Jika rilis baru mengalami anomali atau bug kritis di lingkungan produksi:

1. **Rollback Git & Rebuild**:
   ```bash
   cd /opt/jagawarga
   # Kembali ke commit stabil sebelumnya
   git checkout <COMMIT_HASH_SEBELUMNYA>
   docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d --build app
   ```

2. **Rollback Menggunakan Script Automasi**:
   ```bash
   ROLLBACK_IMAGE_REF='ghcr.io/stmarya/jagawarga@sha256:<DIGEST>' bash deploy/self-hosted/rollback.sh
   ```

3. **Matikan Provider Eksternal jika Terjadi Gangguan Pihak Ketiga**:
   Jika provider eksternal (seperti VirusTotal atau Groq) mengalami rate limit parah atau kegagalan upstream:
   - Ubah `FEATURE_PREMIUM_PROVIDERS=false` di `.env.production`.
   - Jalankan `docker compose --env-file deploy/self-hosted/.env.production -f deploy/self-hosted/compose.yaml up -d app`.
   - Sistem akan otomatis kembali ke mode aman (*local-only heuristic analysis*).

---

## 🛠️ 7. Troubleshooting Umum

| Gejala | Penyebab Umum | Solusi |
| :--- | :--- | :--- |
| **Sertifikat SSL tidak terbit / timeout** | DNS A record belum propagasi atau Port 80/443 terblokir firewall | Cek DNS dengan `dig jagawarga.cloud +short`. Pastikan `ufw allow 80/tcp` dan `ufw allow 443/tcp` aktif. Cek log Caddy dengan `docker compose ... logs proxy`. |
| **Error 502 Bad Gateway** | Kontainer `app` belum selesai booting atau crash saat inisialisasi | Periksa `docker compose ... logs app`. Pastikan memori RAM server mencukupi dan node build berhasil. |
| **Redis Connection Refused** | Kontainer Redis belum healthy | Cek status dengan `docker compose ... ps`. Pastikan volume internal Redis tidak terkunci. |
| **AI Assistant mengembalikan fallback lokal** | Kunci API Groq belum diisi atau habis kuota | Periksa format `GROQ_API_KEYS` di `.env.production`. Pastikan kunci diawali dengan `gsk_`. |