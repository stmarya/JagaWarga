# Data Retention

- Raw anonymous indicators: not persisted.
- Messages and email headers: analyzed in memory and not persisted.
- Files and QR images: processed in the browser.
- Local history/watchlist/progress: controlled by the user in local storage.
- Advanced case workspaces: saved only after explicit save/import, in browser
  IndexedDB (`jagawarga-analyst-v1`, `cases`). Retained until user deletion or
  browser eviction; no automatic server copy or automatic expiry. Case deletion,
  delete-all, and `/privacy` clear controls remove these records.
- Case notes, hypotheses and exports are not application-encrypted. Do not use
  shared devices or enter secrets. Normalized evidence excludes raw provider
  attributes/source URLs; indicators and user-authored notes still require
  manual review before sharing. Exported files require separate user deletion.
- In-memory runtime state is cleared on process restart.
- Redis rate limits, budgets, cache, and circuits use bounded TTLs. Aggregate
  operational and feedback metrics contain no raw indicators and expire after
  30 days.
- Structured logs: must not include raw indicators, message content, headers, tokens, or file names.

Any future persistence requires a privacy review, a deletion workflow, a documented TTL, and explicit user consent.