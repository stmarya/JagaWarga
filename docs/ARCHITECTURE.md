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

## Data minimization

Raw anonymous input tidak disimpan secara default. History bersifat opt-in. Logs wajib melakukan redaction terhadap token, query parameter sensitif, email, dan isi pesan.
