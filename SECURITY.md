# Security Policy

## Reporting

Laporkan vulnerability secara privat kepada pemilik repository. Jangan membuka issue publik untuk dugaan secret exposure, SSRF, authentication bypass, atau kebocoran data pribadi.

Machine-readable security contact tersedia di `/.well-known/security.txt`.

## Pilot constraints

- Tidak mengunggah atau mengunduh file.
- Tidak mengirim URL baru ke third-party scanner.
- Provider key hanya digunakan dari backend dan disimpan di secret manager.
- Hasil provider dianggap untrusted input.

## Required controls before provider integration

- SSRF-safe egress dan pemblokiran localhost, private, link-local, multicast, serta cloud metadata.
- DNS rebinding dan redirect validation.
- Response size, content type, dan timeout limits.
- Per-user/IP rate limits, provider budget caps, dan kill switch.
- Structured logging dengan PII/token redaction.
- Security review dan no critical/high unresolved finding.
