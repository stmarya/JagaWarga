# Deployment lokal JagaWarga

Gunakan helper berikut untuk mengambil branch terbaru, memasang dependency, melakukan build, lalu menjalankan server lokal:

```bash
npm run local:deploy
```

Perintah tersebut menggunakan branch `feat/uiux-phases-0-3`, melakukan `git pull --ff-only`, menjalankan `npm ci`, `npm run build`, lalu menjalankan production server di `http://127.0.0.1:3000`.

## Development mode

Untuk mengembangkan dengan hot reload:

```bash
npm run local:deploy -- --dev
```

## Opsi yang tersedia

```bash
bash scripts/local-deploy.sh --help
```

Contoh:

```bash
npm run local:deploy -- --port 3001
npm run local:deploy -- --skip-install --skip-build --dev
npm run local:deploy -- --branch feat/uiux-phases-0-3
```

## Catatan keamanan

- Script berhenti jika ada perubahan lokal yang belum di-commit. Gunakan `--allow-dirty` hanya jika benar-benar diperlukan.
- Jika `.env.local` belum ada, script membuatnya dari `.env.example`. Isi secret lokal sesuai kebutuhan dan jangan commit file tersebut.
- Script tidak mematikan proses lain yang sedang memakai port. Hentikan server lama terlebih dahulu atau gunakan port berbeda.
