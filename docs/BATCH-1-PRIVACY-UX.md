# Batch 1 — Private checks, evidence-first results, explicit public history

This unreleased change is stacked on the advanced analyst MVP. Review/merge the
parent PR first, or rebase this change once that parent reaches main. No production
migration or deployment is performed by preparing this code.

## Citizen workflow

- `/periksa` sends lookup indicators to JagaWarga and enabled providers, or
  message/header content to transient server analysis. Files/QR images stay local.
- A successful check does **not** call `/api/history`. IoC history requires an
  explicit local checkbox (off initially; preference can be remembered).
- Optional history stores at most 50 restricted normalized snapshots in the
  current browser. Raw provider attributes are not added to local history.
  Messages/header contents are not added to this IoC history. Current-tab result
  context remains in sessionStorage; provider metadata can exist there temporarily.
- Local-storage/progress failures do not cancel a successful lookup. If a
  restricted snapshot cannot be stored, the result explains that local history
  was not saved. Recognized secret-bearing URLs cannot become stored snapshots.

## Results hierarchy

1. Verdict/uncertainty and source time.
2. Immediate evidence-appropriate actions.
3. Observations and provenance.
4. Limitations and unknowns.
5. Optional technical depth.
6. Explicit sharing and feedback.

No C2, phishing, account takeover, or malware claims are inferred solely from an
IP/domain/URL/hash type. General risks are clearly labeled as general education
and collapsed, not presented as observations. Missing data and partial/stale
results retain warnings. Share is an inline, user-initiated action rather than a
floating control covering content. The AI launcher and scroll-to-top control are inline on the four Batch 1 pages, and scanner tabs support keyboard arrows/Home/End. Breadcrumb now follows Periksa → Hasil →
Bukti teknis and uses readable contrast.

## Private vs public history

`/dashboard` opens on browser-local history, with separate search/filter/empty
states and deletion/export controls. The public tab is not a record of all scans.
Opening an old local entry without evidence asks for a new check rather than
inventing a snapshot. Deleting local history never silently deletes public data.

## Public publication boundary

Community publication remains off by default, respecting BOTH existing
`ALLOW_RISKY_FEATURES` and `FEATURE_COMMUNITY_REPORTING` flags. Do not enable it
without the required operator/privacy/provider review and existing release gates.

- GET returns an empty listing when disabled; individual reads return 404.
- POST requires JSON, a bounded payload, `consent: true`, and an indicator.
  The old automatic `{ result: ... }` contract is rejected.
- URLs become **hosts only**: no paths, query strings or fragments are public.
  The browser previews this change. A fresh server-controlled lookup (possibly
  cached under normal lookup policy) is performed on that public indicator.
  Client-supplied score/evidence/timestamps are ignored. The result may differ
  from the private full-URL result.
- Recognized credential/sensitive-query patterns and nonpublic IPs are rejected;
  secret detection is not exhaustive. Never publish confidential domains/hashes.
- Only restricted normalized evidence is stored. No source URL, raw provider
  attributes, names, messages, headers or arbitrary user comments are persisted.
- Each new record and its private deletion-capability hash has a **24-hour TTL**.
  Redis uses individual v2 keys with EX, a bounded index, and symmetric eviction
  of old records. Memory topology prunes expired entries and caps at 200.
- A random 256-bit deletion capability is returned only to the publisher. Public
  GET never includes it or its hash. The browser keeps a bounded receipt list.
  DELETE uses a constant-time hash comparison and remains available when new
  publication has been disabled. Missing/wrong capabilities cannot delete data.
- Free-text PATCH comments remain deferred and return 403.
- If a browser cannot retain its deletion receipt, the UI attempts to roll back
  publication. A failed rollback is disclosed, and TTL still bounds retention.
- Five publish requests/client/minute plus existing provider budgets/queue/limits
  apply. This does not establish authenticated human identity or prevent all abuse.

## Legacy migration — REQUIRED before deployment

The old `jagawarga:community-history:v1` hash could contain records stored without
this consent/TTL contract. New reads never expose those keys. **They do not gain
an automatic TTL just because the application is upgraded.**

From an operator-controlled source checkout, configure the approved distributed
Redis environment and run:

```sh
npm run privacy:legacy-history            # dry run; no raw content read
npm run privacy:legacy-history -- --confirm
```

The confirm step unlinks ONLY `jagawarga:community-history:v1` and its `:order`
index. v2 records are untouched. This migration is intentionally destructive and
requires operator approval. Do not claim legacy cleanup was performed without
running it against the actual deployment backend. Review separately any backups,
external logs or older deployment instances: this script cannot remove them.

## Privacy controls

`/privacy` accurately describes local vs server vs provider/model data flows.
Its export is an **archive**, not an automatic whole-app restore format. It
includes history/watchlist/progress, remaining unversioned legacy data and local
cases, plus publication IDs/expiry (never deletion capabilities or AI chat).
Cases can still be exported/imported individually through Case Workspace.

Local clear removes known JagaWarga localStorage generations/preferences/receipts,
IndexedDB cases, and this tab's stored AI/result session. It does not erase server
records, downloaded files or memory in other open tabs. Delete public records
before discarding receipts, or let the 24-hour TTL expire. Files are not encrypted
by the application; review before sharing. No absolute-privacy or legal-compliance
certification claims are made.

## Acceptance scope

```sh
npm test
npx tsc --noEmit
npm run test:openapi
npm run security:secrets
npm run build
# With a local production build server:
CHROMIUM_PATH=/path/to/chromium npm run test:batch1
CHROMIUM_PATH=/path/to/chromium npm run test:analyst
# Dedicated disposable API test server, separate terminal after build:
PORT=3005 RUNTIME_TOPOLOGY=single ALLOW_RISKY_FEATURES=true FEATURE_COMMUNITY_REPORTING=true DISABLE_CLOUDFLARE_DNS=true DISABLE_GOOGLE_DNS=true FEATURE_PREMIUM_PROVIDERS=false npm start -- --hostname 127.0.0.1
# Another terminal (preflight rejects enabled providers or distributed topology):
BASE_URL=http://127.0.0.1:3005 npm run test:batch1-api
```

Unit tests cover consent/gating, server-controlled evidence, deletion capability,
TTL and bounded records, Redis-command semantics with a fake Redis adapter,
private storage/exports, and evidence-first presentation. Browser tests use
fixture responses and cover four pages on mobile/desktop/320px, plus consent,
separate private/public deletion, export, local cases, corrupt sessions, network
failure, and unknown/partial/high-risk states. These are not real-provider,
production Redis, external pentest, or public-release acceptance tests.
