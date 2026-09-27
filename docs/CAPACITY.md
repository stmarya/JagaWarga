# Capacity and Scaling Runbook

## Enforced limits

| Control | Limit |
| --- | ---: |
| Lookup concurrency per replica | 4 |
| Pending lookup queue per replica | 100 |
| Lookup requests per client | 30/minute |
| Provider requests | 1,000/provider/day |
| Provider timeout | 5 seconds |
| Provider attempts | 2 total |
| Lookup cache TTL | 5 minutes |

The canonical values live in `lib/runtime/capacity.ts`. Performance proof reads
the same constants, so this table must be updated when those limits change.

## Scaling model

- Deploy multiple stateless application replicas only with
  `RUNTIME_TOPOLOGY=distributed`.
- Redis coordinates rate limits, provider budgets, cache, circuit state, and
  metrics across replicas.
- Total active lookup capacity is approximately four per healthy replica, but
  provider quota and latency remain global constraints.
- Scale horizontally when queue pending depth remains non-zero or uncached P95
  approaches five seconds.
- Do not scale past provider quota. Add an approved provider or reduce traffic
  before increasing replicas when budget exhaustion is the bottleneck.

## Alert response

- `SLO_LOOKUP_CACHED_BREACH`: inspect Redis latency, cache hit rate, and replica
  CPU/memory.
- `SLO_LOOKUP_UNCACHED_BREACH`: inspect provider latency/failures, queue depth,
  circuit state, and egress.
- Queue saturation: return bounded errors, preserve partial results, and add
  replicas only after provider quota is confirmed.
- Redis unavailable: readiness fails closed; restore Redis connectivity rather
  than switching a multi-replica deployment to process-local state.

## Proof commands

```bash
npm run performance:proof
npm run operations:proof
npm run acceptance:local
```

`performance:proof` uses approved deterministic provider mocks and records
cached/uncached latency plus queue, rate-limit, circuit, and provider-timeout
behavior. `operations:proof` validates fail-closed launch control, Redis
recovery tests, shell syntax, and immutable rollback input.