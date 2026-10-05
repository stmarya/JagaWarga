# JagaWarga UI/UX implementation baseline

Branch: `feat/uiux-phases-0-3`
Reference: UI/UX audit plus attached short-form copy hierarchy reference

## Scope

This branch covers phases 0–3:

1. Baseline and implementation guardrails
2. Critical journey and deep-link reliability
3. Copy and visual hierarchy improvements
4. Canonical UI token layer for the existing interface

## Acceptance criteria

- Primary scanner links resolve to `/periksa#scanner`.
- A result URL with `?id=...` can reload its saved result from `/api/history`.
- Loading, failure, and empty-result states are explicit.
- Primary copy uses plain Indonesian before technical terminology.
- Primary result actions are limited to three visible actions.
- Tool names communicate user benefit before implementation detail.
- The scanner h1 has an explicit hierarchy rule.
- Existing routes and API contracts remain unchanged.

## Deferred to phase 4

- Full keyboard and screen-reader audit
- Cross-device visual regression screenshots
- Complete CSS legacy removal
- Automated responsive and accessibility evidence
