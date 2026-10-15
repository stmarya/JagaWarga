# Advanced analyst MVP

## Scope

This unreleased change implements defensive triage and local investigations,
not active scanning, malware execution, or a multi-user SOC platform.
Entry points: Tools → Mode Analis, `/analyst`, `/analyst/cases`, and the detail
page's session link. The original citizen workflow remains available.

## Deterministic scoring policy

`severity-independent-v1` assigns 95 to malicious, 60 to suspicious, and 10
to benign evidence; the strongest valid signal wins. These are ordinal product
severity scores, not calibrated attack probabilities. Confidence is shown
separately using the existing provider/corroboration heuristic, extended with a
low-confidence band. Multiple named providers are not proof of independent
underlying datasets. Unknown/invalid/zero-confidence evidence cannot assess
reputation. No useful evidence yields `insufficient-data`, never a safe verdict.

DNS remains `unknown` and contributes no reputation confidence. Coverage counts
unique provider identities: requested, assessed and failed. It does not measure
the percentage of all possible intelligence sources. Benign/threat disagreement
is disclosed, and does not average away the strongest warning.

The scoring version appears in API results, snapshots and cache keys. Old cache
entries cannot leak old scoring into new responses. Historical snapshots remain
historical and are never silently rescored. Low-confidence threat warnings also
remain visible in the shared severity presentation.

## Bulk triage

Input is newline-delimited TXT or RFC-style single-column CSV with an optional
`indicator` header. Quote CSV values containing commas. Embedded multiline
fields, prose IoC extraction and multi-column spreadsheets are not supported.
Maximum 20 source rows / 64 KB. Unsupported/private/credential-bearing input and
recognized sensitive URL query keys are rejected locally; this is not exhaustive
secret detection. Original form input is discarded after successful preview.

Preview does not call providers. The user must explicitly approve disclosure
before lookup. IoCs are sent to JagaWarga and its enabled providers, but raw
files are never uploaded and no new URL/file analyses are submitted.

One request is active at a time, with a 20-second browser timeout. Server rate
limits remain authoritative; HTTP 429 pauses the queue. Pause finishes the
active item; cancel aborts its browser request and leaves it ready for a later
attempt. Cancellation cannot roll back a request already accepted by the server.
Failed items do not stop other items; retries require user action.

Batch results stay in component memory. No automatic watchlist/history/case
write is performed. Navigation removes unsaved results. Export contains
successful normalized snapshots only. Saving a batch to a case is explicit.

## Local case workspace

IndexedDB stores title, summary/scope, status, notes/hypotheses, conclusions/
mitigation and up to 100 normalized snapshots per case. The timeline is ordered
by lookup time, not alleged attack time. Evidence explorer preserves source
observation and fetch times; freshness labels describe the time of lookup.

Case packages use `schemaVersion: 1`, `kind: jagawarga-case`, with a maximum
1 MB import/export. Validation rebuilds allowlisted fields, rejects invalid
enums/numbers/timestamps/unsafe indicators, and drops provider raw attributes.
Imports receive a new local ID and cannot overwrite an existing case.
Notes are rendered as text, not HTML. Imported evidence is untrusted: validation
checks shape, not authenticity. Exports are not signed or encrypted and do not
establish forensic chain-of-custody.

Persistence is opt-in via Save/Import, indefinite until deletion/eviction,
browser-specific and unencrypted by the app. No background sync, user account,
team permissions, cloud AI access to cases, or server fallback. An unavailable
IndexedDB is reported rather than silently uploading data. The case page and
privacy page provide deletion controls; users must delete exported files
separately. Only the current tab's in-memory data can be cleared by its controls;
close other tabs to remove their memory copies.

## Validation

```sh
npm test
npx tsc --noEmit
npm run test:openapi
npm run security:secrets
npm run build
# Start a local server, then:
CHROMIUM_PATH=/usr/bin/chromium npm run test:analyst
```

The analyst browser test uses intercepted deterministic fixture responses:
no real provider secrets or provider calls are needed. It covers mobile/desktop
overflow and serious/critical axe findings, consent/preview, bulk error isolation,
429 pause, cancellation, case persistence/reload, import/export and deletion.
It is not a production provider, distributed Redis, or end-to-end deployment
acceptance test. Review, provider policy, and existing release gates still apply.