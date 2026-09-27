# JagaWarga

JagaWarga adalah platform security lookup dan awareness untuk membantu pengguna awam **cek → pahami → bertindak → belajar**.

## Status

🚧 **Release candidate / Fase 4 technical hardening.** Metadata lookup aktif melalui dua fixed-origin DNS providers. URL baru tidak disubmit ke scanner dan file tidak pernah diunggah.

## MVP scope

- URL, domain, IPv4/IPv6, MD5/SHA-1/SHA-256.
- Explainable verdict: risk, confidence, alasan, sumber, dan freshness.
- Empat status: bahaya tinggi, mencurigakan, belum ada indikasi, tidak cukup data.
- Micro-learning dan tindakan aman kontekstual.
- Tidak ada upload/download file atau community reporting pada fase awal.
- Fixed-origin provider gateway dengan DNS/IP validation, pinned lookup, timeout, response cap, circuit breaker, cache, dan bounded queue.
- Explainable message-phishing dan email-header analyzers.
- Client-side QR decoding dan SHA-256 file hashing.
- Local opt-in history, watchlist, export/delete, XP, dan badges.
- Feedback API tanpa indikator mentah.
- Rate limiting dan provider budget controls.
- PWA serta browser-extension foundation.
- Status, methodology, transparency, privacy, dan emergency pages.
- Security headers, CSP, payload limits, request IDs, consistent API errors, metrics, versioning, OpenAPI, container, and operational runbooks.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Health endpoint tersedia di `/api/health`; lookup endpoint tersedia di `/api/lookups`.

Alat tambahan tersedia di `/tools`; dashboard lokal tersedia di `/dashboard`.

API specification tersedia di `/openapi.json`; operational endpoints tersedia di `/api/health`, `/api/version`, dan `/api/metrics`.

## Quality gates

Lihat [`docs/READINESS.md`](docs/READINESS.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), dan [`SECURITY.md`](SECURITY.md).

## Security

Jangan kirim vulnerability atau secret melalui issue publik. Ikuti [`SECURITY.md`](SECURITY.md).
