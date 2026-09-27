# Deployment and Rollback

## Pre-deploy
1. `npm ci`
2. `npm run security:secrets`
3. `npm run security:audit`
4. `npm test`
5. `npm run build`
6. Browser smoke and security-header checks

## Container
Build with `docker build -t jagawarga:0.11.0 .`. Run as a non-root user with a read-only filesystem. The root Compose file is for loopback-only local validation. The fail-closed VPS kit is documented in [`../deploy/self-hosted/README.md`](../deploy/self-hosted/README.md).

## Rollback
Deploy the previous immutable image/commit, verify `/api/health`, `/api/version`, security headers, lookup no-submission policy, and analyzer endpoints. Disable affected providers using configuration before re-enabling traffic.