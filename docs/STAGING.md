# Staging Promotion Contract

Staging execution is intentionally deferred until an HTTPS target is available.
The repository-side controls are ready and fail closed.

## Required environment

- A dedicated `staging` GitHub environment with required reviewers.
- An HTTPS hostname separate from production.
- `ADMIN_METRICS_TOKEN` stored as a staging environment secret.
- The self-hosted deployment kit configured with an immutable
  `ghcr.io/stmarya/jagawarga@sha256:...` reference.
- `APP_IMAGE_DIGEST` set to the exact digest suffix of that image reference.
- Redis available only on the internal data network.

## Promotion sequence

1. Create and push an immutable version tag.
2. Wait for the Release workflow to publish, scan, attest, and sign the image.
3. Deploy that exact digest to staging using the self-hosted deployment kit.
4. Run the `Staging verification` workflow with the digest reference and HTTPS
   staging URL.
5. Preserve the generated `staging-verification.json` artifact and workflow URL.
6. Supply that workflow URL to `Production promotion control`.
7. Deploy the same digest to production; production preflight rejects a
   different runtime-reported digest.

## Failure policy

Promotion stops when the image reference is mutable, the Sigstore signature is
invalid, a high/critical vulnerability is found, HTTPS/security headers fail,
Redis readiness fails, the protected metrics endpoint is exposed, risky
features are enabled, or the deployed digest differs from the requested digest.