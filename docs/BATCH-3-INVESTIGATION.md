# Batch 3 — Analyst workflow, local cases and investigation tools

Unreleased and stacked on Batch 2 (#23), then Batch 1 (#22) and analyst MVP (#21).
No merge/deploy, production flag changes or data migration is performed here.
Review/merge parents first and retarget/rebase. Existing launch gates and Batch 1
legacy-data cleanup remain mandatory before any public release.

## 1. Bulk triage (`/analyst`)

- Local preview/dedup remains capped at 20 rows / 64KB. Invalid raw inputs are not
  retained. Replacing an existing batch requires confirmation and fresh consent.
- Input folds after preview; queue is the next priority. Progress distinguishes
  valid, rejected, ready, done and failed. Progress includes terminal errors, not
  the proportion of safe objects. Mobile cards replace horizontal triage tables;
  desktop keeps a semantic table with its own scroll region.
- One request at a time. Pause finishes current request; cancel aborts the browser
  request, without promising the server has stopped. HTTP 429 pauses all remaining
  items, observes a bounded Retry-After (1 second–24 hours; fallback 60 seconds),
  and requires manual continuation. Preview does not reset the cooldown. Failed
  rows can be prepared again without losing completed results.
- Evidence selection moves focus to a separate evidence section. Per-source
  cards show source names, verdicts/confidence, observation/fetch time, freshness,
  reason codes and unknown/stale/failure/conflict warnings. No attribution claims.
- Attachment defaults to **selected evidence only**. User may instead choose all
  completed batch results. The preview count/target case are explicit; duplicate
  request IDs aren't re-added. More than 100 snapshots is rejected atomically.
- Create a case in a new tab, then explicitly refresh destinations. Triage remains
  ephemeral page memory. Export or save before leaving; no automatic case/public
  persistence. Exports revalidate the restricted snapshot schema and catch failures.

## 2. Local cases (`/analyst/cases`)

- Search title/summary and filter status; saved vs unsaved form state is visible.
- Only dirty drafts trigger discard prompts on new/open/import and same-window
  application links. Beforeunload warns on close/reload where browser supports it.
  Browser history/back, crashes, eviction and all programmatic navigation are NOT
  guaranteed recoverable; there is no autosave or draft recovery promise.
- Form controls lock during operations. Save and JSON export are distinct: export
  uses current form values, including unsaved edits, and does not save to IndexedDB.
- Optimistic expected updatedAt prevents stale overwrites. Monotonic updatedAt
  avoids same-millisecond revision reuse. Saving an existing case requires it still
  exists, so a stale tab cannot silently resurrect a case deleted elsewhere.
- Conflict keeps the draft intact. Explicit reload discards it after confirmation
  and reads the current saved version. IndexedDB failures have a retry/error state,
  never a hidden fallback to server storage.
- Timeline is lookup time, not attack chronology. Detach requires confirmation
  and affects only the form until Save. Destructive operations are separated from
  primary Save; downloaded exports are not deleted when cases are removed.
- Import creates a fresh ID and preserves the strict version/size/schema contract.
  Cases/snapshots are not encrypted, synced, sent to AI, or forensic chain-of-custody.

## 3. Investigation tools

### Message / email header

Shared cancellable form, timeout, busy state, failure/malformed-result handling,
clear action and no stale result after input changes. Results show actual reason
codes/findings, signal score (not probability), safe follow-up and limitations.
Header tool reads supplied Authentication-Results; it does NOT independently
verify SPF/DKIM/DMARC or authenticate the sender. `pass` isn't proof of good intent.
No automatic XP/history/case writes from these tool pages.

Plain-text input is sent only to the heuristic server endpoint, not directly to an
AI model from these tools. Normalized result export and optional session-result
handoff omit original input/echoed fields. Pattern analysis is not an IoC reputation
snapshot and is not silently imported into cases.

### File hash / QR

- Visible accessible native file inputs; busy/read errors and clear controls.
- SHA-256 local input limit 25MB. No file execution/upload; explicit next step to
  `/periksa?ioc=...` does not itself run a provider lookup. Unknown hash isn't safe.
- QR input limit 10MB / 24MP decoded bitmap; bitmap released after detection.
  Actual decode depends on native BarcodeDetector. Unsupported/no-code/bad-image
  errors don't retain an earlier result. This is not a cross-browser decoder.
- QR content is plain text, never navigated automatically. Only recognized public
  IoCs without recognized secret patterns get a Periksa handoff; Wi-Fi/payment/
  arbitrary text stays local. Secret detection remains incomplete.
- No app-side requests before user chooses a subsequent lookup. Selected file
  bytes remain local; original files are not erased by clearing results.

### Active redirect trace — breaking contract / off by default

Old unshorten UI/API mixed successful navigation with misleading “verified” safety
claims and used DNS-check-then-generic-GET transport. Replaced with a separate
operator-gated **HEAD observation** contract; it is NOT reputation checking.

- BOTH `ALLOW_RISKY_FEATURES=true` and `FEATURE_ACTIVE_REDIRECTS=true` are required.
  Default false; public preflight rejects enabled active tracing. UI fails closed
  when policy can't be read. Do NOT enable without operator network/egress, abuse,
  privacy and infrastructure review. No production enablement done here.
- POST now requires `{url, consent: true}`; old callers must migrate. No generic
  GET/body fallback when HEAD is unsupported. HTTP failures/loops/hop cap produce
  incomplete observations, not a fictitious final/safe destination. Old
  `isSuspicious`, TLD/bank-name heuristics and “verified” verdict were removed.
- Local prevalidation and authoritative server validation reject recognized secret
  query patterns, credentials, non-HTTP schemes, private IPs and custom ports.
- DNS checks **every resolved address**, pins a public IP into a fresh no-agent
  connection per hop, and preserves TLS hostname verification. No browser cookies,
  credentials or arbitrary user headers forwarded; no response bodies consumed or
  JavaScript executed. No untrusted response content is made into clickable links.
- Max 6 HEAD hops, 16KB headers, per-socket 3s timeout and 12s abort signal including
  DNS/queue wait. DNS resolution itself may finish later in the OS, but cannot open
  a subsequent socket after cancellation. Queue 2 active / 8 pending per process;
  rate 5 requests/client/minute via existing runtime rate-limit backend. Queue is
  per process, not a distributed global concurrency guarantee.
- Target sites can log connections or trigger side effects even on HEAD; one-time,
  reset, unsubscribe or private URLs must not be submitted. UI/privacy/catalog and
  retention docs state this clearly. Detection and containment are not absolute.
- Response contains bounded observed hops, completion, nullable final URL, stop
  reason and request ID, with no-store. No case/community storage is performed.

## Validation

```sh
npm test
npx tsc --noEmit
npm run build
npm run test:openapi
npm run security:secrets
npm run test:launch-gate
# Local production build server, all external providers/active tracing disabled:
PORT=3011 RUNTIME_TOPOLOGY=single DISABLE_CLOUDFLARE_DNS=true DISABLE_GOOGLE_DNS=true FEATURE_PREMIUM_PROVIDERS=false npm start -- --hostname 127.0.0.1
# Another terminal:
BASE_URL=http://127.0.0.1:3011 CHROMIUM_PATH=/path/to/chromium npm run test:analyst
BASE_URL=http://127.0.0.1:3011 CHROMIUM_PATH=/path/to/chromium npm run test:batch3
BASE_URL=http://127.0.0.1:3011 CHROMIUM_PATH=/path/to/chromium npm run test:batch1
BASE_URL=http://127.0.0.1:3011 CHROMIUM_PATH=/path/to/chromium npm run test:batch2
```

Unit tests cover queue counts/retry bounds, snapshot merge/limits, dirty state,
revision monotonicity, result allowlisting, redirect URL validation, per-hop limits,
DNS answer rejection/pinning/cancellation and operator/consent/rate/input gates.
Transport/DNS are mocks, not real remote-site or deployment egress acceptance.
Browser tests use fixture endpoints and real local IndexedDB for two-tab conflict,
deleted-case protection, selected/batch attachment, dirty detach/navigation,
pattern busy/network/malformed/clear/export, local hash and QR paths (QR detector
fixture), active-trace disabled/consent/incomplete/complete states, 320px/mobile/
desktop accessibility and overflow. Actual local API default-off 403 is checked
without contacting any external target.

No external pentest, production Redis/network/provider acceptance, forensic
validation, full accessibility certification or public-release approval implied.

## Local validation outcome

- 199 unit tests passed across 39 test files; TypeScript and production build passed.
- OpenAPI check passed for 15 routes; secret scan and launch-gate regression tests passed. These gate tests are not production release approval.
- Analyst and Batch 1/2/3 fixture browser smoke suites passed, including real local IndexedDB conflict and deleted-case protection.
- Visual review covered 15 mobile/desktop captures: triage, selected evidence, case editor/timeline, message/header tools, local hash/QR, disabled/incomplete redirects and privacy disclosure. Desktop case capture was repeated after viewport repaint stabilized; final fields, labels and timeline are fully visible.
- Mobile 320px overflow and serious/critical axe checks passed for the scoped pages; this is not full accessibility certification.
- No external redirect target contacted; active tracing remains off by default. No merge, deploy or production provider acceptance performed.
