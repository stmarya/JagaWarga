# JagaWarga

JagaWarga adalah platform security lookup dan awareness untuk membantu pengguna awam **cek → pahami → bertindak → belajar**.

## Status

⛔ **NO-GO / Fase 8 complete, Fase 9 blocked.** Kontrol peluncuran teknis v0.8.0 siap, tetapi public launch tetap diblokir sampai enam external gate memiliki evidence dan persetujuan sah. Metadata lookup aktif melalui fixed-origin DNS providers dengan kill switches. URL baru tidak disubmit ke scanner dan file tidak pernah diunggah.

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
- Release automation, GHCR workflow, SBOM, Dependabot, CODEOWNERS, readiness/liveness, protected metrics, deny-by-default feature flags, and launch governance.
- Automated deployment preflight, cryptographic release manifest, legal/provider review pack, penetration-test scope, usability protocol, infrastructure checklist, incident drill, and go/no-go template.
- Fail-closed launch evidence validator, protected production workflow, immutable-tag validation, and machine-readable launch status.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Untuk acceptance self-hosted yang loopback-only, ikuti [`docs/LOCAL-DEPLOYMENT.md`](docs/LOCAL-DEPLOYMENT.md).

Health endpoint tersedia di `/api/health`; lookup endpoint tersedia di `/api/lookups`.

Alat tambahan tersedia di `/tools`; dashboard lokal tersedia di `/dashboard`.

API specification tersedia di `/openapi.json`; operational endpoints tersedia di `/api/live`, `/api/ready`, `/api/health`, `/api/version`, `/api/policy`, dan protected `/api/metrics`.

## Quality gates

Lihat [`docs/READINESS.md`](docs/READINESS.md), [`docs/PHASE-8-9.md`](docs/PHASE-8-9.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), dan [`SECURITY.md`](SECURITY.md).

`npm run launch:gate` sengaja menghasilkan **NO-GO** sampai seluruh evidence eksternal tersedia. Status publik tersedia di `/launch-readiness` dan `/launch-status.json`.

## Security

Jangan kirim vulnerability atau secret melalui issue publik. Ikuti [`SECURITY.md`](SECURITY.md).
