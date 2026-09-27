# JagaWarga

JagaWarga adalah platform security lookup dan awareness untuk membantu pengguna awam **cek → pahami → bertindak → belajar**.

## Status

🚧 **Technical prototype / Fase 1.** Metadata lookup aktif melalui dua fixed-origin DNS providers. Pilot hanya memakai metadata dan existing lookup; URL baru tidak disubmit ke scanner.

## MVP scope

- URL, domain, IPv4/IPv6, MD5/SHA-1/SHA-256.
- Explainable verdict: risk, confidence, alasan, sumber, dan freshness.
- Empat status: bahaya tinggi, mencurigakan, belum ada indikasi, tidak cukup data.
- Micro-learning dan tindakan aman kontekstual.
- Tidak ada upload/download file atau community reporting pada fase awal.
- Fixed-origin provider gateway dengan DNS/IP validation, pinned lookup, timeout, response cap, circuit breaker, cache, dan bounded queue.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

Health endpoint tersedia di `/api/health`; lookup endpoint tersedia di `/api/lookups`.

## Quality gates

Lihat [`docs/READINESS.md`](docs/READINESS.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), dan [`SECURITY.md`](SECURITY.md).

## Security

Jangan kirim vulnerability atau secret melalui issue publik. Ikuti [`SECURITY.md`](SECURITY.md).
