#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT/deploy/self-hosted"
ENV_FILE="$DEPLOY_DIR/.env.production"

cd "$ROOT"
npm run deploy:verify
npm run launch:gate
docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" config --quiet
docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" pull
docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" up -d --wait

PUBLIC_HOST="$(sed -n 's/^PUBLIC_HOST=//p' "$ENV_FILE")"
ADMIN_METRICS_TOKEN="$(sed -n 's/^ADMIN_METRICS_TOKEN=//p' "$ENV_FILE")"
APP_IMAGE_DIGEST="$(sed -n 's/^APP_IMAGE_DIGEST=//p' "$ENV_FILE")"
BASE_URL="https://$PUBLIC_HOST" ADMIN_METRICS_TOKEN="$ADMIN_METRICS_TOKEN" EXPECTED_IMAGE_DIGEST="$APP_IMAGE_DIGEST" NODE_ENV=production npm run preflight

echo "Deployment verified at https://$PUBLIC_HOST"