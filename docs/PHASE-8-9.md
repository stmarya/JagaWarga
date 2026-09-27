# Phase 8–9 — Production launch control

## Decision

Phase 8 technical launch controls are complete. Phase 9 is **NO-GO** until all external evidence exists and the production environment has been configured. This document does not waive any external gate.

## Phase 8 deliverables

- Fail-closed, machine-verifiable launch evidence gate.
- Six approval templates mapped to GitHub issues #11–#16.
- Protected, manual production workflow.
- Immutable tag and package-version verification.
- Container publication with provenance and SBOM.
- Post-deployment HTTPS preflight.
- Public `launch-status.json` and an honest launch-readiness page.
- Automated negative and positive launch-gate tests.

## Phase 9 execution sequence

1. Close issues #11–#16 with evidence from authorized reviewers.
2. Configure the GitHub `production` environment with required reviewers.
3. Add `LAUNCH_ATTESTATIONS_JSON` and `ADMIN_METRICS_TOKEN` to that environment.
4. Configure the chosen hosting target, DNS, TLS, secrets, backups, alerts, and rollback.
5. Create an immutable version tag only after the final GO decision.
6. Run `Production release control` manually with the tag and HTTPS target URL.
7. Verify the published image is deployed by the authorized infrastructure operator.
8. Run post-deployment preflight, incident smoke test, and monitoring checks.
9. Record the release decision, approvers, evidence, and rollback owner.

## Required attestation object

Each gate uses:

```json
{
  "status": "approved",
  "approvedBy": "Authorized reviewer",
  "approvedAt": "2026-09-27T04:00:00.000Z",
  "evidenceUrl": "https://example.com/evidence"
}
```

The production workflow fails when an attestation is missing, pending, malformed, self-invented, or not backed by an HTTPS evidence URL.

## Current blockers

- Human usability study.
- Legal/privacy approval.
- Provider Terms confirmation.
- External penetration test.
- Production infrastructure review and hosting target.
- Operator incident drill and final go/no-go.