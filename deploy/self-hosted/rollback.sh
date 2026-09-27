#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${ROLLBACK_IMAGE_REF:-}" || ! "$ROLLBACK_IMAGE_REF" =~ ^ghcr\.io/stmarya/jagawarga@sha256:[a-f0-9]{64}$ ]]; then
  echo "Set ROLLBACK_IMAGE_REF to an immutable GHCR sha256 digest." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT/deploy/self-hosted"
ENV_FILE="$DEPLOY_DIR/.env.production"
cd "$ROOT"

IMAGE_REF="$ROLLBACK_IMAGE_REF" docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" pull app
IMAGE_REF="$ROLLBACK_IMAGE_REF" docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" up -d --wait app

PUBLIC_HOST="$(sed -n 's/^PUBLIC_HOST=//p' "$ENV_FILE")"
ADMIN_METRICS_TOKEN="$(sed -n 's/^ADMIN_METRICS_TOKEN=//p' "$ENV_FILE")"
BASE_URL="https://$PUBLIC_HOST" ADMIN_METRICS_TOKEN="$ADMIN_METRICS_TOKEN" NODE_ENV=production npm run preflight
echo "Rollback verified at https://$PUBLIC_HOST"