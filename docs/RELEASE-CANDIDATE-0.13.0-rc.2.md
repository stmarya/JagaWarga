# Release Candidate 0.13.0-rc.2

## Decision

- Repository-controlled engineering decision: **INTERNAL-GO**
- Public production decision: **NO-GO**
- Staging evidence: pending by owner decision
- Internal role approvals: approved by `stmarya` for engineering, security,
  product, and operations
- External launch gates: pending

## RC.2 security remediation

- RC.1 CI and Release correctly stopped at the container vulnerability gate.
- The runtime image now contains only the standalone production server and traced runtime dependencies.
- Package-manager and build-tool payloads are removed from the final stage.
- The HIGH/CRITICAL Trivy gate remains fail-closed.

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

1. Commit the RC source tree and create tag `v0.13.0-rc.2`.
2. Let the Release workflow build, scan, attest, and sign the immutable image.
3. Deploy that digest to staging and attach `staging-verification.json`.
4. Preserve the recorded engineering, security, product, and operations
   approvals in `release/internal-approvals.json`.
5. Keep public production `NO-GO` until the separate external launch gate passes.

The tagged release workflow regenerates the manifest from the clean immutable
commit. Staging and public-production promotion remain separately fail-closed.