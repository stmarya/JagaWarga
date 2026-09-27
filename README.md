# JagaWarga

JagaWarga adalah platform security lookup dan awareness untuk membantu pengguna awam **cek → pahami → bertindak → belajar**.

## Status

🟡 **Internal release candidate v0.13.0-rc.2 / public production NO-GO.**
Repository controls through performance and operational proof are complete.
Public launch remains blocked until staging execution and the six external gates
have attributable evidence and valid approvals.

## MVP scope

- URL, domain, IPv4/IPv6, MD5/SHA-1/SHA-256.
- Explainable verdict: risk, confidence, alasan, sumber, dan freshness.
- Empat status: bahaya tinggi, mencurigakan, belum ada indikasi, tidak cukup data.
- Micro-learning dan tindakan aman kontekstual.
- Tidak ada upload/download file atau community reporting pada fase awal.
- Fixed-origin provider gateway dengan DNS/IP validation, pinned lookup, timeout, response cap, circuit breaker, cache, dan bounded queue.
- Feature-gated VirusTotal existing lookup untuk URL, domain, IPv4/IPv6, dan hash—tanpa submission endpoint.
- Explainable message-phishing dan email-header analyzers.
- Client-side QR decoding dan SHA-256 file hashing.
- Local opt-in history, watchlist, export/delete, XP, dan badges.
- Feedback API tanpa indikator mentah.
- Rate limiting dan provider budget controls.
- Installable PWA; browser extension remains an experimental developer preview
  and is excluded from launch scope.
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

Untuk menjalankan acceptance suite end-to-end tanpa Docker:

```bash
npm run acceptance:local
```

Untuk menyiapkan deployment VPS, ikuti [`deploy/self-hosted/README.md`](deploy/self-hosted/README.md).

Health endpoint tersedia di `/api/health`; lookup endpoint tersedia di `/api/lookups`.

Alat tambahan tersedia di `/tools`; dashboard lokal tersedia di `/dashboard`.

API specification tersedia di `/openapi.json`; operational endpoints tersedia di `/api/live`, `/api/ready`, `/api/health`, `/api/version`, `/api/policy`, dan protected `/api/metrics`.

## Quality gates

Lihat [`docs/READINESS.md`](docs/READINESS.md), [`docs/PHASE-8-9.md`](docs/PHASE-8-9.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), dan [`SECURITY.md`](SECURITY.md).

`npm run launch:gate` sengaja menghasilkan **NO-GO** sampai seluruh evidence eksternal tersedia. Status publik tersedia di `/launch-readiness` dan `/launch-status.json`.

## Security

Jangan kirim vulnerability atau secret melalui issue publik. Ikuti [`SECURITY.md`](SECURITY.md).

## License

MIT. Lihat [`LICENSE`](LICENSE).
