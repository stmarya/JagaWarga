#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT/deploy/self-hosted"
ENV_FILE="$DEPLOY_DIR/.env.production"

cd "$ROOT"
IMAGE_REF="$(sed -n 's/^IMAGE_REF=//p' "$ENV_FILE" || echo "")"

if [ "${SKIP_VERIFY:-false}" != "true" ]; then
  npm run deploy:verify
fi

if [ "${SKIP_LAUNCH_GATE:-false}" != "true" ]; then
  npm run launch:gate
else
  echo "⚠️ SKIP_LAUNCH_GATE=true: Bypassing launch gate for pilot deployment."
fi

docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" config --quiet

if [[ "$IMAGE_REF" =~ ^ghcr\.io/ ]]; then
  docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" pull
fi

docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" up -d --build --wait

PUBLIC_HOST="$(sed -n 's/^PUBLIC_HOST=//p' "$ENV_FILE")"
ADMIN_METRICS_TOKEN="$(sed -n 's/^ADMIN_METRICS_TOKEN=//p' "$ENV_FILE")"
APP_IMAGE_DIGEST="$(sed -n 's/^APP_IMAGE_DIGEST=//p' "$ENV_FILE")"

if [ "${SKIP_PREFLIGHT:-false}" != "true" ]; then
  BASE_URL="https://$PUBLIC_HOST" ADMIN_METRICS_TOKEN="$ADMIN_METRICS_TOKEN" EXPECTED_IMAGE_DIGEST="$APP_IMAGE_DIGEST" NODE_ENV=production npm run preflight
fi

echo "Deployment verified at https://$PUBLIC_HOST"