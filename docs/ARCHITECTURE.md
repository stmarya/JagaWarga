# MVP Architecture

```text
Web/PWA
  → API Gateway
  → Validation & Redaction
  → Lookup Orchestrator
  → Cache / Queue
  → Provider Adapters
  → Normalized Evidence
  → Verdict & Explanation
```

## Boundaries

Lookup worker harus berada pada isolated egress tanpa akses ke private network. Semua provider response diperlakukan sebagai untrusted data.

Technical prototype menggunakan dua fixed-origin metadata providers: Cloudflare DNS dan Google DNS. Gateway memvalidasi allowlist hostname, menyelesaikan DNS, menolak alamat nonpublik, melakukan pinned lookup untuk koneksi TLS, menolak redirect implisit, membatasi response, dan menerapkan timeout.

## Normalized evidence

- provider and indicator type
- observed/fetched timestamps
- verdict and confidence
- categories and reason codes
- freshness and source reference
- submission flag (harus false pada pilot)
- retryable error state

## Reliability

Timeout per provider, circuit breaker, bounded retry, per-source cache TTL, idempotency key, partial results, quota metrics, budget alerts, dan kill switch.

Implementasi mendukung dua topologi eksplisit:

- `single`: state rate limit, provider budget, cache, circuit breaker, dan metrics
  berada di memori proses untuk local acceptance.
- `distributed`: state tersebut disimpan di Redis untuk konsistensi lintas
  replica. Readiness gagal tertutup bila Redis tidak dapat dihubungi.

Deployment Compose menggunakan topologi `distributed`. Lookup identik yang
berlangsung bersamaan pada satu proses digabungkan, provider retry dibatasi
untuk error sementara, dan setiap provider tetap dapat gagal secara independen
menjadi partial result.

## Data minimization

Raw anonymous input tidak disimpan secara default. History bersifat opt-in. Logs wajib melakukan redaction terhadap token, query parameter sensitif, email, dan isi pesan.
