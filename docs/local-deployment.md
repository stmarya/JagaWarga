# Deployment Lokal Otomatis

Skrip `scripts/local-deploy.sh` memperbarui source code dari branch aktif, menyiapkan environment lokal, membangun image, menjalankan App + Redis, lalu memverifikasi health deployment.

## Prasyarat

- Git
- Node.js
- Docker Engine yang sedang berjalan
- Docker Compose v2 (`docker compose`)
- Clone repository sudah memiliki upstream branch

## Jalankan

Dari root repository:

```bash
bash scripts/local-deploy.sh
```

Alur yang dijalankan:

1. Memastikan Git, Node.js, Docker, dan Compose tersedia.
2. Membatalkan proses jika ada perubahan tracked yang belum di-commit.
3. Menjalankan `git pull --ff-only` pada branch aktif.
4. Membuat atau memperbaiki `.env.local-deploy` tanpa menimpa nilai yang sudah ada.
5. Memvalidasi konfigurasi Compose.
6. Menjalankan `docker compose up --build -d --wait --force-recreate`.
7. Menjalankan verifikasi lokal dan menampilkan status service.

Aplikasi tersedia di `http://localhost:3000`, atau port yang diatur melalui `APP_PORT` di `.env.local-deploy`.

## Konfigurasi opsional

Edit `.env.local-deploy` untuk mengubah port atau mengaktifkan provider opsional. File ini diabaikan Git dan otomatis diberi permission `0600`.

```env
APP_PORT=3000
FEATURE_PREMIUM_PROVIDERS=false
VIRUSTOTAL_API_KEY=
```

Untuk melewati langkah tertentu saat troubleshooting:

```bash
SKIP_PULL=true bash scripts/local-deploy.sh
SKIP_VERIFY=true bash scripts/local-deploy.sh
```

## Menghentikan service

```bash
docker compose --env-file .env.local-deploy down
```

Untuk melihat log:

```bash
docker compose --env-file .env.local-deploy logs -f app
```
