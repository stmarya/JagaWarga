# Internal 10/10 Roadmap

This roadmap covers engineering and product work controlled by the repository.
The six external governance approvals remain separate and must never be
self-attested.

## Definition of internal 10/10

Internal readiness is complete only when every applicable item below has
automated evidence, an owner, and a rollback path. Documentation alone does not
count as completion.

## Stage 1 — Baseline, correctness, and CI

- [x] Reproducible install, secret scan, dependency audit, unit tests, and build.
- [x] Coverage is measured and the current baseline cannot regress.
- [x] Production-runtime browser acceptance runs in CI.
- [x] Production HSTS is configured and HTTPS preflight validates it.
- [x] Acceptance load checks an application endpoint, not only liveness.
- [ ] Raise coverage to at least 85% lines/statements/functions and 80% branches.
- [ ] Add deterministic network-boundary tests for timeout, oversized response,
      invalid JSON, abort, DNS rebinding, and TLS/host pinning.
- [ ] Add accessibility automation and keyboard-flow coverage.
- [ ] Build and smoke-test the production container in CI.

## Stage 2 — Runtime reliability

- [x] Choose and enforce one supported topology: single replica or distributed.
- [x] For multiple replicas, move rate limit, provider budget, cache, circuit
      state, and operational metrics to Redis with atomic operations.
- [x] Coalesce concurrent identical lookups and add bounded, jittered retry only
      for explicitly retryable provider failures.
- [x] Make readiness verify every dependency required by the selected topology.
- [x] Add provider latency, failure, circuit, quota, queue-depth, cache-hit, and
      saturation metrics without raw indicators.
- [x] Define degraded-mode and failover tests for every provider.

## Stage 3 — Deployment and supply chain

- [x] Pin base images and third-party GitHub Actions to reviewed immutable SHAs.
- [x] Automate signed immutable releases, SBOM, provenance, and vulnerability
      scan evidence.
- [ ] Deploy the same digest to staging before production.
- [ ] Verify DNS, TLS, HSTS, CSP, WAF/CDN, secret rotation, egress restrictions,
      Redis failure recovery, monitoring, alerting, and rollback.
- [x] Remove unused infrastructure or connect it to real application behavior.
- [x] Add a repository license selected by the owner.

## Stage 4 — Feature completeness

### Core lookup

- [x] URL, domain, public IPv4/IPv6, and hash canonicalization.
- [x] Existing-lookup-only policy with no automatic submission.
- [x] Explainable verdict, confidence, evidence, freshness, source, and action.
- [x] Partial-provider and insufficient-data states.
- [x] Provider diagnostics and kill switches.
- [x] Add a second approved reputation source or formally accept and test the
      single-provider availability and coverage limitation.
- [x] Add freshness policy and stale-result presentation per provider.
- [x] Add user-visible retry/request identifiers for support escalation.

### Local safety tools

- [x] Message phishing analysis.
- [x] Email authentication-header analysis.
- [x] Browser-local QR decode and SHA-256 file hashing.
- [x] Expand multilingual/adversarial fixtures and false-positive evaluation.
- [x] Add accessibility, large-input, malformed-input, and supported-browser
      coverage for every tool.

### PWA, extension, and local user data

- [x] PWA manifest, service worker, offline fallback, and mobile smoke.
- [x] Opt-in local history, watchlist, export/delete, XP, and badges.
- [x] Manifest V3 extension foundation.
- [x] Test install/update/offline recovery for the PWA.
- [x] Complete and test the extension's user workflow, or explicitly remove it
      from MVP scope.
- [x] Version and migrate local-storage data without silent loss.

### Feedback and collaboration

- [x] Indicator-free feedback endpoint.
- [x] Persist or export privacy-safe aggregate feedback with retention controls.
- [x] Community reporting, notifications, organization workspaces, membership,
      and audit persistence remain feature-flagged foundations; each must either
      be fully implemented and reviewed or explicitly excluded from launch scope.

### Product and public surface

- [x] Status, methodology, transparency, privacy, emergency, operations, and
      launch-readiness pages.
- [x] OpenAPI, security.txt, robots, sitemap, health, live, ready, version,
      policy, and protected metrics endpoints.
- [x] Keep OpenAPI response schemas and examples synchronized with runtime.
- [x] Add support/escalation workflow and test all published contact paths.
- [x] Validate Indonesian and English content parity or declare Indonesian-only
      scope for the release.

## Stage 5 — Performance and operational proof

- [x] Load-test uncached and cached lookup paths using approved provider mocks.
- [x] Test queue saturation, rate limiting, provider timeout, and circuit recovery.
- [x] Prove SLO dashboards and alerts against staged failure scenarios.
- [x] Validate that no active persistence backup is required; automate immutable
      rollback input checks and repository-level incident simulations.
- [x] Record capacity limits and a scaling runbook.

## Stage 6 — Release candidate

- [x] No open internal P0/P1 findings.
- [x] All enabled features have tests, metrics, documentation, and rollback.
- [x] All disabled features are absent from public promises and remain fail-closed.
- [x] Release candidate is reproducible from a clean workspace export.
- [ ] Staging evidence is attached to the immutable release manifest.
- [x] Final internal go/no-go is signed by engineering, security, product, and
      operations owners.

## Feature omission rule

A feature is not allowed to disappear between planning and release. Every
feature or public claim must be in exactly one state:

1. implemented and verified;
2. explicitly deferred and disabled fail-closed; or
3. removed from scope and from all public documentation.

The feature-completeness section above is the canonical inventory until a
machine-readable inventory replaces it.