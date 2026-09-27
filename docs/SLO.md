# Service Objectives

- Availability target: 99.5% for technical beta.
- Cached lookup P95: under 1.5 seconds.
- New metadata lookup P95: under 5 seconds.
- Error budget: 0.5% monthly.
- Security response: SEV-1 acknowledgement within 15 minutes during staffed pilot.

Provider failures must degrade to partial or insufficient-data results and must never become a safe verdict.

`/api/slo` exposes privacy-safe aggregate objective state (`warming`, `healthy`,
or `breached`) and active alert codes. A minimum of 20 samples is required
before an objective can be called healthy. Latency is calculated from bounded
histogram buckets, and the dashboard never includes raw indicators.

Run `npm run performance:proof` to exercise cached and uncached lookup paths
with approved deterministic provider mocks. Run `npm run operations:proof` for
queue/rate/circuit, Redis recovery, launch-gate, and immutable rollback checks.