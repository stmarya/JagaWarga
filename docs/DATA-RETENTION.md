# Data Retention

- Raw anonymous indicators: not persisted.
- Messages and email headers: analyzed in memory and not persisted.
- Files and QR images: processed in the browser.
- Local history/watchlist/progress: controlled by the user in local storage.
- In-memory rate-limit and metrics data: cleared on process restart.
- Structured logs: must not include raw indicators, message content, headers, tokens, or file names.

Any future persistence requires a privacy review, a deletion workflow, a documented TTL, and explicit user consent.