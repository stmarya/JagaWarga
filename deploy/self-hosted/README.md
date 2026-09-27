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

Edit `deploy/self-hosted/.env.production`, replacing the DNS name, operator email, and immutable image digest. Do not use a mutable tag.

Place the six approved attestation files in `launch-evidence/` or set `LAUNCH_ATTESTATIONS_JSON`. Then validate:

```bash
npm run deploy:verify
npm run launch:gate
```

## Deploy

```bash
bash deploy/self-hosted/deploy.sh
```

## Backup

```bash
bash deploy/self-hosted/backup.sh
```

Backups are mode `0600`, retained locally for 14 days, and ignored by Git. Copy encrypted backups to an approved off-host location and perform a restore drill before public launch.

## Rollback

```bash
ROLLBACK_IMAGE_REF='ghcr.io/stmarya/jagawarga@sha256:…' \
  bash deploy/self-hosted/rollback.sh
```

## Safety notes

- PostgreSQL and Redis have no host ports.
- The data network is internal.
- Risky features remain disabled.
- Secrets stay in an ignored mode-`0600` file.
- Deployment cannot bypass the launch gate.
- Actual production execution still requires the VPS, DNS, image digest, external evidence, and operator authorization.