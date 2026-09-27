# Deployment and Rollback

## Pre-deploy
1. `npm ci`
2. `npm run security:secrets`
3. `npm run security:audit`
4. `npm test`
5. `npm run build`
6. Browser smoke and security-header checks

## Container
Build with `docker build -t jagawarga:0.13.0-rc.1 .`. Run as a non-root user with a read-only filesystem. The root Compose file is for loopback-only local validation. The fail-closed VPS kit is documented in [`../deploy/self-hosted/README.md`](../deploy/self-hosted/README.md).

Release tags publish a digest-addressed GHCR image with SBOM, provenance,
high/critical vulnerability scanning, and a keyless Sigstore signature. Promote
that exact digest through the staging verification workflow before production;
both preflights compare the expected digest with `/api/version`.

## Rollback
Deploy the previous immutable image/commit, verify `/api/health`, `/api/version`, security headers, lookup no-submission policy, and analyzer endpoints. Disable affected providers using configuration before re-enabling traffic.