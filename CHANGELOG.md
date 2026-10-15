# Changelog

## Unreleased
- Batch 3: responsive bulk triage, bounded Retry-After/manual resume, explicit selected-vs-batch evidence attachment and source-focused evidence cards.
- Local cases: dirty state, search/status filters, save-vs-export clarity, monotonic optimistic revisions, deleted-case protection and conflict reload.
- Investigation tools: cancellable heuristic message/header analysis with truthful authentication limits, bounded local hash/QR and safe explicit lookup handoff.
- BREAKING: active redirect endpoint now off by default behind operator flags and consent; pinned-public-DNS HEAD observations replace generic GET/safety heuristics, with bounded hops/headers/time/queue/rate. Requires separate deployment egress review.
- Batch 2: shared readable navigation, 44px controls, semantic progress, focus/skip links, inline assistance and reduced-motion support.
- Emergency: five incident-specific first actions, financial priority, ephemeral follow-up checklists, official reference links and evidence/recovery caveats.
- Technical details: guarded local/public loading, source provenance and uncertainty, bounded/collapsible metadata, engine filter/pagination, allowlisted evidence export and truthful browser print/PDF.
- Batch 1: checks are private by default; local history is opt-in, results lead with actions/evidence/limitations, and personal/public history is separated.
- Replaced automatic community storage with operator-gated consent, host-only preview, server-derived normalized evidence, 24-hour per-record TTL, publisher-only deletion capabilities, and an explicit legacy purge migration.
- Unified privacy export/local clear with IndexedDB cases; clarified server/model flows and removed absolute privacy claims.
- Added an advanced analyst MVP: consent-gated sequential bulk IoC lookup, evidence explorer, and IndexedDB case workspaces with versioned import/export/delete.
- Fixed suspicious evidence being downgraded by confidence multiplication; versioned severity independently of confidence and exposed provider coverage/conflicts.
- Added analyst unit/regression tests and fixture-based browser smoke coverage. No production deployment or external-provider acceptance is implied.
- Redesigned the product interface with an original dark civic-cybersecurity visual system inspired by security analysis consoles.
- Added a shared responsive header and footer, clearer scan hierarchy, richer result presentation, and semantic destructive actions.
- Preserved all existing functionality while passing mobile UI smoke and serious/critical accessibility checks.

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