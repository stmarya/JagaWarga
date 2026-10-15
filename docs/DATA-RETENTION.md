# Data Retention

## Private checks

- Lookup indicators are sent to the server and active lookup providers, not
  automatically published. Operational caches use bounded TTLs.
- Messages and email headers: analyzed in memory, not persisted as community
  history. Files and QR images: processed in the browser.
- Current result/AI context: temporary browser session storage. Do not enter
  secrets; output context may be sent to a configured model with redaction.
- Local IoC history: explicit opt-in, up to 50 restricted snapshots in browser
  localStorage. Watchlist/progress and IndexedDB cases are browser-local.
- Local data persists until user deletion or browser eviction. Case save/import
  is explicit. Cases do not automatically sync to server or AI. Local data and
  exports are not application-encrypted; use a personal device.

## Consented community publications (unreleased Batch 1)

- Off by default under existing feature governance. No automatic publication.
- Explicit preview/consent; URL hosts only; server-derived normalized lookup
  evidence. No raw provider attributes, file names, free-text comments, messages,
  email headers, file bytes or QR images.
- v2 public records and private deletion hashes expire within 24 hours. Each
  Redis record has an individual TTL; memory records expire and are bounded.
- Publisher-only deletion capabilities enable server deletion before expiry.
  Public responses and ordinary privacy exports do not include capabilities.
- Clearing local storage does not delete server publications and can discard
  the capability. Delete shared records first. Existing downloaded copies cannot
  be recalled.
- v1 legacy server data is hidden but requires explicit operator-approved purge
  before deployment; upgrading does not add TTL to old keys. See
  `BATCH-1-PRIVACY-UX.md` and `npm run privacy:legacy-history`.

## Active redirect tracing (unreleased Batch 3)

- Off by default; BOTH `ALLOW_RISKY_FEATURES` and `FEATURE_ACTIVE_REDIRECTS`
  plus explicit request consent are required. Public preflight requires it off.
- Separate from existing-lookup providers: the server makes HEAD connections to
  target sites, which may record the connection or act on a unique URL. No request
  bodies/pages are downloaded, no JavaScript run, no browser cookies forwarded.
- URLs/observations stay in the page request/result memory; no case/publication is
  created. Clearing UI does not erase target-site records or reverse side effects.
- Secret patterns are rejected but detection is incomplete. Never send one-time,
  reset, unsubscribe, private, or credential-bearing URLs. Operator egress, abuse
  and privacy review is required before enabling. It is not a reputation verdict.

## Operations and deletion

- In-memory runtime state clears on restart. Redis operational rate limits,
  budgets, caches and circuits use bounded TTLs. Aggregate operational/feedback
  metrics contain no raw indicators and expire after 30 days.
- Logs must not include raw indicators, messages, headers, capabilities, API
  credentials, file names, or user-authored case notes.
- `/privacy` local clear removes known storage generations, cases, preferences,
  receipts and this tab's stored AI/result session. Close/reload other tabs to
  remove their memory copies. Delete exported files separately.
- New persistence requires privacy review, explicit purpose/consent, a bounded
  retention policy and deletion workflow. Public-release approval remains a
  separate gate; this implementation is not legal certification.
