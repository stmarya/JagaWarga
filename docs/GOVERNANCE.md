# Product and Security Governance

## Change ownership
- Provider, scoring, privacy, authentication, and persistence changes require security-owner review.
- Risky features are disabled by default and require both the individual feature flag and `ALLOW_RISKY_FEATURES=true`.
- Audit events use an allowlist and must never contain raw user content.

## Release decision
Every release records commit, version, tests, dependency audit, SBOM, container provenance, known limitations, rollback target, and accountable owner.

## Workspace defaults
Leaderboards are private/off, individual scores are not shared, and organization admins do not receive raw lookup content by default.