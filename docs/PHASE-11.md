# Phase 11 — Self-hosted deployment readiness

## Outcome

The repository contains a fail-closed self-hosted deployment kit for a Docker VPS. The v0.12.0 candidate includes provider diagnostics, resilient lookup UX, service-worker lifecycle fixes, cross-platform local verification, environment repair, and a feature-gated VirusTotal existing-lookup adapter. Actual public deployment remains blocked until infrastructure and external evidence are supplied.

## Delivered

- Caddy automatic TLS reverse proxy.
- Immutable GHCR digest enforcement.
- Internal Redis/PostgreSQL network.
- Non-published data-service ports.
- Generated strong local secrets.
- Configuration validator.
- Launch-gated deployment script.
- Post-deployment preflight.
- Database backup retention script.
- Immutable-image rollback script.
- Operator runbook.

## Remaining external inputs

- VPS address and operator access.
- Public DNS hostname and ACME email.
- Published GHCR image digest.
- Six attributable launch-evidence approvals.
- Docker runtime verification, backup/restore drill, and operator incident drill.

These items cannot be marked Done from repository automation alone.