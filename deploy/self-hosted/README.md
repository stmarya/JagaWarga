# Self-hosted production deployment

This kit deploys an immutable GHCR image behind Caddy with automatic TLS. It is fail-closed: `deploy.sh` runs both configuration validation and the six-gate launch evidence validator before starting containers.

## Host requirements

- Linux VPS with Docker Engine and Compose v2.
- Public DNS A/AAAA record pointing to the VPS.
- Inbound TCP 80/443 and UDP 443.
- GitHub Container Registry access when the image is private.
- Node.js 22 and repository checkout for launch gate and preflight.

## Prepare

```bash
npm ci
npm run deploy:init
```

Edit `deploy/self-hosted/.env.production`, replacing the DNS name, operator
email, immutable image reference, and matching `APP_IMAGE_DIGEST`. Do not use a
mutable tag. The runtime exposes this digest through `/api/version`, and
preflight rejects a deployment that reports a different digest.

Place the six approved attestation files in `launch-evidence/` or set `LAUNCH_ATTESTATIONS_JSON`. Then validate:

```bash
npm run deploy:verify
npm run launch:gate
```

## Deploy

```bash
bash deploy/self-hosted/deploy.sh
```

## Rollback

```bash
ROLLBACK_IMAGE_REF='ghcr.io/stmarya/jagawarga@sha256:…' \
  bash deploy/self-hosted/rollback.sh
```

## Safety notes

- Redis has no host port and stores only disposable runtime coordination state.
- PostgreSQL is intentionally not deployed until a persistence-backed feature
  passes privacy review and is enabled.
- The data network is internal.
- Risky features remain disabled.
- Secrets stay in an ignored mode-`0600` file.
- Deployment cannot bypass the launch gate.
- Actual production execution still requires the VPS, DNS, image digest, external evidence, and operator authorization.