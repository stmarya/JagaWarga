# Feature Scope

Every feature and public claim must be implemented, explicitly deferred and
fail-closed, or removed from launch scope.

## Implemented and verified

- URL, domain, public IP, and hash existing lookup.
- Cloudflare/Google DNS metadata and feature-gated VirusTotal reputation.
- Explainable verdict, confidence, evidence freshness, request ID, and safe actions.
- Message and email-header analysis.
- Browser-local QR decoding and SHA-256 hashing.
- Versioned local history, watchlist, export/delete, XP, and badges.
- Privacy-safe aggregate feedback metrics.
- Installable PWA with offline shell and update lifecycle.
- Status, methodology, transparency, privacy, emergency, operations, and
  launch-readiness surfaces.
- Health, live, ready, version, policy, protected metrics, OpenAPI,
  security.txt, robots, and sitemap endpoints.

## Explicitly deferred and fail-closed

- Community reporting remains off by default. Batch 1 adds an unreleased,
  operator-gated explicit consent/TTL/deletion contract; it is not a launch promise.
- External notifications.
- Organization workspaces and server-side membership/audit persistence.
- File upload and URL submission.
- Additional public locales; the release locale is Indonesian (`id-ID`).
- A second reputation provider. The accepted limitation is documented publicly;
  DNS sources are not treated as reputation, and stale benign evidence cannot
  produce a safe verdict.

## Advanced MVP (unreleased)

- `/analyst`: up to 20 IoCs, newline TXT or one-column CSV, local preview,
  normalization/deduplication, explicit provider disclosure and consent.
- Sequential lookup reuses `/api/lookups` and its authoritative validation,
  quotas, queue, budgets, circuit breakers, and existing-lookup policy.
- Pause, cancellation, partial results, per-item errors, retry preparation,
  filters, normalized JSON export, and evidence inspection.
- Severity-independent scoring v1, provider coverage, and conflict disclosure.
- `/analyst/cases`: IndexedDB case metadata, analyst notes/hypotheses,
  conclusions/mitigation, lookup timeline, evidence snapshots, versioned
  import/export and deletion. No team sync, accounts, server persistence,
  encrypted storage, forensic chain-of-custody, or automatic monitoring.
- Acceptance scope and limitations: `docs/ADVANCED-MVP.md`.

## Experimental and excluded from launch

- The Manifest V3 browser extension is a developer preview. It only copies the
  active HTTP(S) URL after an explicit click and does not transmit it. It is not
  included in launch promises, support commitments, or release acceptance.

## Supported browser baseline

The release acceptance baseline is the current stable Chromium engine on mobile
and desktop viewports. Firefox and Safari are best-effort until their automated
runners are added. QR decoding depends on the browser `BarcodeDetector` API and
shows an explicit unsupported-browser message instead of uploading the image.
## Batch 1 privacy/UX (unreleased)

- Private checks by default, explicit local history opt-in, and no automatic
  community POST from scanner or dashboard.
- Evidence-first result hierarchy; private and public history are separate.
- Unified archive/export and local deletion including IndexedDB cases.
- Public v2 publications require operator gates and consent; 24-hour TTL,
  normalized server-rechecked host/IoC evidence, and publisher-only deletion.
- Mandatory operator-approved legacy v1 cleanup before deployment.
- Scope, migration, and acceptance limits: `BATCH-1-PRIVACY-UX.md`.
