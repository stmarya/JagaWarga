# Supply-chain Controls

- Reproducible dependency installation with `npm ci`.
- Weekly Dependabot updates for npm, GitHub Actions, and Docker.
- Secret scan, dependency audit, tests, and production build on every change.
- Third-party GitHub Actions and base/runtime images are pinned to immutable
  commit SHAs or OCI digests.
- Pull requests build, scan, and smoke-test the hardened production container.
- Release tags generate a CycloneDX SBOM.
- Release images publish to GHCR with provenance and SBOM attestations, are
  scanned for high/critical vulnerabilities, and are keylessly signed with
  Sigstore against their immutable digest.
- CODEOWNERS protects security-sensitive paths through review policy.

Repository branch protection and required reviews must be enabled by the repository administrator.