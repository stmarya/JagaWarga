# Technical Fase 2–3

## Delivered

- Rule-based message phishing analysis with reason codes.
- Email-header SPF/DKIM/DMARC and From/Reply-To checks.
- Browser-local QR decoding and SHA-256 file hashing.
- Opt-in local history, watchlist, export/delete, XP, and badges.
- Feedback endpoint without raw indicators.
- Hashed in-memory rate-limit keys and provider budget controls.
- Status, methodology, transparency, privacy, and emergency pages.
- PWA manifest/service-worker and Manifest V3 extension foundation.
- Family/class/organization workspace type model.

## Security boundaries

- No URL submission to scanners.
- No file upload or malware download.
- Message and header content is not persisted.
- QR images and files stay in the browser.
- Community reporting, premium keys, and public rollout remain deferred.

## Verification

- 50 automated tests.
- Dependency audit: zero vulnerabilities.
- Production build and type checking passed.
- Mobile UI smoke passed.
- Eleven Phase 2–3 routes passed browser checks.
- Message analyzer API smoke passed.
- 100-request health load smoke passed.