# Batches 4–6: experience and release hardening

## Scope
- Batch 4: home orientation/copy, searchable tool catalogue, defensive learning catalogue → lesson → quiz → summary, support/methodology/transparency/readiness/operations pages.
- Batch 5: shared readable hierarchy, explicit local/server/active processing boundaries, 44px controls, visible focus, selected navigation/learning states, responsive layouts and independent operational failure states.
- Batch 6: runtime dependency updates, provider transport cancellation/size/port tests, honest offline fallback, refreshed real-runtime smoke and broader responsive regression. Existing CI thresholds and release gates are not lowered.

## Dependencies and merge strategy
Next.js 16.4.1 and updated lockfile remove the runtime advisories observed at implementation time. Audits are time-sensitive, not a guarantee of future safety. The same dependency/transport fixes were backported to the older PR branches. Their historical UI smoke scripts and intermediate coverage can still fail. The integrated change includes the complete #21–#24 content and is reviewed against main, avoiding an intermediate merge that exposes only part of the privacy fixes. Older PRs are superseded only after a successful integrated merge.

## Learning and content boundaries
- API responses are checked for shape, bounded counts, expected slug and valid answer index. Network, malformed, timeout, retry, loading and empty states are explicit.
- Quiz answers lock after selection; explanations are text, not color alone. Summary is a learning record, not a certificate or professional qualification.
- Completion storage is explicit after finishing. Existing progress v2 holds at most 100 completed topic IDs; completing a known topic does not add XP again on sequential repeats/reload. LocalStorage is not a multi-tab transaction system; simultaneous saves can race. No server sync or signed record.
- Existing privacy export/clear includes progress markers. Data remains unencrypted; clearing browser data removes it.
- Dangerous blanket APK/financial recovery claims and hard-coded bank phone numbers were removed from affected lessons. Use verified service channels; reporting/reset does not guarantee recovery and may affect evidence.
- Education cache key advances to v3 so old cached lessons are not served by the revised catalogue. Old non-sensitive catalogue keys are not automatically deleted.

## Operational and offline boundaries
- Operations uses five public endpoints, independent results, ten-second timeout and manual refresh. It does not accept admin tokens or claim a successful HTTP response means readiness.
- Service worker v3 caches only an explicit offline notice. It removes old app-owned shell caches, does not intercept API/POST/assets/external requests and never substitutes home HTML for results or incident routes. Offline notice is not a result or loaded emergency plan. Does not delete local histories/cases/progress.
- Runtime acceptance explicitly disables reputation and active providers, uses disposable single-process state and a hash-only lookup. Metadata providers remain configured for readiness, but no domain lookup is requested. Browser fixture tests are separate from real local endpoint checks. No external redirect target is contacted.

## Validation
Run `npm run security:audit`, `npm test`, `npm run test:coverage`, `npx --no-install tsc --noEmit`, `npm run build`, `npm run security:secrets`, `npm run test:openapi`, `npm run test:launch-gate`, `npm run acceptance:runtime`, `npm run performance:proof`, `npm run operations:proof`.
On the local production server run `test:batch456`, `test:batch1`, `test:batch2`, `test:batch3`, `test:analyst` with BASE_URL/CHROMIUM_PATH. `test:responsive` covers 21 routes and ten widths. Native QR remains browser-dependent; detector fixture tests are not cross-browser hardware acceptance.

## Validated locally

- 234 unit tests / 42 files passed. TypeScript and production build passed.
- Coverage passed unchanged gates: statements 81.06%, branches 75.09%, functions 78.61%, lines 85.30%.
- Runtime audit reported zero vulnerabilities at validation time (Next.js 16.4.1, Sharp 0.35.5, source-map-js 1.2.2).
- OpenAPI checks cover 15 API routes; secret scan and launch-gate regression passed.
- Real local acceptance, performance and operations proof scripts passed; not production load, Redis, provider or egress acceptance.
- Batch 1/2/3, analyst and Batch 4–6 browser suites passed. Real local catalogue/lessons and offline notice supplement fixture states.
- Responsive checks passed at ten widths across 21 routes. Scoped serious/critical axe checks passed; not full accessibility certification.
- 28 captures individually reviewed. Fixed desktop learning-label spacing, privacy-copy readability and readiness link targets before final captures.
- `test:experience` repeats all five browser suites plus the responsive matrix against its own loopback production server; CI invokes it after real-runtime acceptance. The metadata providers are configured but no domain indicator lookup is requested; reputation/active/model providers are disabled.

 Merge is not deployment, operator consent, production migration or public launch approval. Existing legacy-data cleanup, Redis/egress/provider acceptance and external legal/privacy/pentest/infrastructure/incident gates remain mandatory. Do not change NO-GO or enable risky features merely because CI is green.
