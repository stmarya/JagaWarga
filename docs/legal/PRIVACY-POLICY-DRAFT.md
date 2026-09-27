# Privacy Policy Draft — Legal Review Required

This draft documents current technical behavior and is not approved legal text.

## Data flow
- URL/domain/IP/hash lookup input is validated and redacted. Domain metadata may be queried from fixed DNS providers.
- Message and email-header content is processed in memory and not persisted.
- Files and QR images are processed in the browser.
- History, watchlist, XP, and badges remain in browser local storage.
- Feedback contains helpful/not-helpful and a bounded category; it excludes the raw indicator.
- Rate-limit identifiers are one-way hashed and remain in process memory.

## User controls
Local history can be disabled, exported, and deleted. No account or server-side history is active in the technical release candidate.

## Review required
Legal counsel must confirm controller identity, lawful basis, jurisdiction, subprocessors, contact details, complaint rights, retention language, and Indonesian PDP compliance before publication.