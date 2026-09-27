# Changelog

## 0.13.0-rc.2
- Replaced the full-workspace runtime container with a minimal Next.js standalone image.
- Removed npm, Corepack, development dependencies, and build-only binaries from the runtime image.
- Remediated the RC.1 Trivy findings without weakening the HIGH/CRITICAL vulnerability gate.
- Preserved the INTERNAL-GO / public production NO-GO decision and immutable RC release history.

## 0.13.0-rc.1
- Completed repository-controlled internal readiness stages 1–6.
- Added distributed Redis runtime state, atomic limits, freshness policy, SLO alerts, performance and operational proofs.
- Added hardened container CI, immutable action/image pinning, SBOM, provenance, vulnerability scanning, and Sigstore signing.
- Added feature inventory, PWA/accessibility coverage, OpenAPI contract tests, support escalation, MIT license, and RC evidence gates.
- Internal RC is GO; staging, external approvals, and public production remain NO-GO.


## 0.7.0
- Added launch preflight automation and cryptographic release manifest.
- Added legal-review drafts, provider review template, penetration-test scope, usability protocol, incident drill, production infrastructure checklist, and go/no-go pack.
- Added public launch-readiness page and external-gate tracking.

## 0.6.0
- Added release automation, GHCR publishing workflow, SBOM artifacts, Dependabot, and CODEOWNERS.
- Added liveness/readiness, protected metrics, policy endpoint, feature flags, provider kill switches, operations page, audit-event allowlist, and localization foundation.
- Added governance, launch-gate, and supply-chain documentation.

## 0.4.0
- Added production-hardening headers, request validation, metrics, OpenAPI, container foundation, and operational runbooks.

## 0.3.0
- Added message/email analysis, local QR/file tools, history, watchlist, gamification, PWA, and extension foundation.