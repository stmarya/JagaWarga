# Release Candidate 0.13.0-rc.1

## Decision

- Repository-controlled engineering decision: **INTERNAL-GO**
- Public production decision: **NO-GO**
- Staging evidence: pending by owner decision
- Internal role approvals: approved by `stmarya` for engineering, security,
  product, and operations
- External launch gates: pending

## Evidence

- Local production acceptance: `LOCAL-READY`
- Automated tests: passed
- Coverage gate: passed
- Performance proof: `PASSED`
- Operational proof: `PASSED`
- Clean-workspace reproducibility proof: `PASSED`
- Feature inventory: complete
- Open internal P0/P1 findings: none
- OpenAPI contract: synchronized with runtime routes

## Promotion requirements

1. Commit the RC source tree and create tag `v0.13.0-rc.1`.
2. Let the Release workflow build, scan, attest, and sign the immutable image.
3. Deploy that digest to staging and attach `staging-verification.json`.
4. Record approvals from engineering, security, product, and operations.
5. Keep public production `NO-GO` until the separate external launch gate passes.

The current local manifest records a dirty-tree hash because the completed work
has not yet been committed. A tagged release workflow regenerates the manifest
from the clean immutable commit.