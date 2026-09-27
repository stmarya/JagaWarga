# JagaWarga

JagaWarga adalah platform security lookup dan awareness untuk membantu pengguna awam **cek → pahami → bertindak → belajar**.

## Status

🚧 **Foundation / pre-MVP.** Integrasi provider belum diaktifkan. Pilot diputuskan non-komersial dan hanya memakai metadata serta existing lookup; URL baru tidak disubmit ke provider.

## MVP scope

- URL, domain, IPv4/IPv6, MD5/SHA-1/SHA-256.
- Explainable verdict: risk, confidence, alasan, sumber, dan freshness.
- Empat status: bahaya tinggi, mencurigakan, belum ada indikasi, tidak cukup data.
- Micro-learning dan tindakan aman kontekstual.
- Tidak ada upload/download file atau community reporting pada fase awal.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Quality gates

Lihat [`docs/READINESS.md`](docs/READINESS.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), dan [`SECURITY.md`](SECURITY.md).

## Security

Jangan kirim vulnerability atau secret melalui issue publik. Ikuti [`SECURITY.md`](SECURITY.md).
