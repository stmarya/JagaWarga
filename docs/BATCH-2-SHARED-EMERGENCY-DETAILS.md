# Batch 2 — Shared UI, emergency response, technical evidence

Stacked on Batch 1 (#22), itself based on analyst MVP #21. Review and merge the
parents first, then retarget/rebase. Preparing this change does not merge, deploy,
change production flags, or perform any production migration.

## 1. Shared foundations

- Preserve the fixed light JagaWarga brand and red emergency entry point.
- Readable 16px body, 14px navigation/supporting text, >=44px controls/navigation,
  visible focus, explicit current section and a keyboard-focusable skip target.
- Four-column mobile navigation avoids hidden menu/sideways page overflow.
- Semantic ordered progress steps, `aria-current=step`, and public-result-aware
  back links. Current step is not a misleading link to a different state.
- Assistant launcher and scroll-to-top are now inline everywhere. The assistant
  dialog remains modal with focus trap/escape/return; reduced motion is respected.
- External reporting links in footer are labeled as opening another service/tab.
- Shared CSS is appended after older styles instead of rewriting unrelated pages.
  Specialized tool/education page redesign belongs to later batches.

## 2. Emergency workflow (`/emergency`)

- No initially assumed incident. Five explicit choices preserve the existing
  coverage: clicked link, credentials/OTP, financial transfer, installed app,
  account takeover.
- Financial quick-entry: contact bank/PJP now, don't wait for a scanner.
- Selected condition moves keyboard focus to the action heading and brings the
  first action below the sticky header. First action precedes follow-up checklist,
  evidence preparation and external resources.
- Checklist is ephemeral memory only, resets when switching condition/reloading,
  does not mean the incident is resolved. No storage/API writes for choices.
- IASC CTA appears in financial action plan only; bank contact, IASC coordination,
  and police report are distinguished. No invented phone numbers, automatic report
  submissions, or money-recovery promises.
- Avoid reopening suspicious objects for evidence; do not collect passwords/OTP.
  Device reset is not the first action and has a data/evidence-loss warning.
- Guidance is initial aid, not diagnosis or platform-specific recovery guarantee.

Reference review:
- https://iasc.ojk.go.id/ — financial reporting, evidence, separate police report,
  no guarantee of funds recovery.
- https://support.google.com/accounts/answer/6294825?hl=id — compromised Google
  account recovery, sessions, password and recovery methods. Other services differ.
- https://support.google.com/accounts/answer/9924802?hl=id&co=GENIE.Platform%3DAndroid
  — Android app removal, Play Protect, updates and reset/manufacturer escalation.

## 3. Technical evidence (`/details`)

- Guard session/public JSON shape and 1MB text limit; catch malformed, absent,
  network-error and unavailable/expired publication states; abort on unmount.
- Public ID fetch always takes precedence. Never silently replace a failed public
  record with unrelated private session data. Public back links retain the ID;
  public view never opens an unrelated private session in Analyst mode.
- Summary → coverage/scoring/provenance → per-source evidence → engine analysis
  → restricted export. Missing data, stale evidence, partial failure and conflicts
  remain explicit; no inference that an absent provider is disabled or object safe.
- Show actual source names, source verdict/confidence, observation/fetch times,
  freshness and reason codes. DNS is not reputation; confidence isn't probability.
- Raw provider attributes are collapsible, React-escaped text with bounded fields
  and values; never executable markup or untrusted clickable links. Public/local
  normalized snapshots may have no raw metadata; this is stated rather than hidden.
- Engine table is semantic, horizontally scrollable in its own keyboard-focusable
  region, with search and pagination (20/page; display max 2,000 engines).
- Export reuses the strict allowlist snapshot validator. No raw provider attributes,
  source URLs, arbitrary metadata or comments; secret-pattern indicators cannot be
  exported as snapshots. Legacy data missing snapshot fields is not fabricated.
- Print action is accurately labeled browser print/save PDF, **not a direct PDF
  download, official report or independent verification**. Print excludes raw
  metadata, controls, footer/assistant; only current engine page is included and
  this limitation is printed. Indicator and normalized evidence still may be
  sensitive, so users must review before sharing. No auto-publication or comments.

## Validation and boundaries

```sh
npm test
npx tsc --noEmit
npm run build
npm run test:openapi
npm run security:secrets
# Start a local build server separately; all browser API responses are fixtures:
BASE_URL=http://127.0.0.1:3007 CHROMIUM_PATH=/path/to/chromium npm run test:batch2
BASE_URL=http://127.0.0.1:3007 CHROMIUM_PATH=/path/to/chromium npm run test:batch1
BASE_URL=http://127.0.0.1:3007 CHROMIUM_PATH=/path/to/chromium npm run test:analyst
```

Unit tests cover guarded result reading, normalized exports, bounded metadata,
malformed/legacy/secret-bearing data, and emergency ordering/content contracts.
Browser tests cover five condition plans, focus/reset, local/public/error results,
metadata, engine pagination/search, export, print visibility, keyboard skip link,
modal escape/focus, 320/390/768/1440px and axe serious/critical findings.
Individual screenshots require visual review; automated checks aren't a full
accessibility certification. Shared changes need regression review on other routes.
No real provider, production Redis, external pentest, incident-response validation,
legal/compliance certification, or public release approval is implied. Batch 1's
legacy community-data cleanup and existing launch gates remain required.

### Local validation outcome

177 tests passed across 35 files; TypeScript, production build, OpenAPI coverage
(15 API routes), secret-pattern scan and diff checks passed. Batch 2 fixture smoke
passed, including 320/390/768/1440px checks; 12 screenshots individually reviewed.
Batch 1 and analyst fixture regression smokes passed. Production status and the
legacy-data migration requirement are unchanged.
