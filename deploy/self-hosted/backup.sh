#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEPLOY_DIR="$ROOT/deploy/self-hosted"
ENV_FILE="$DEPLOY_DIR/.env.production"
BACKUP_DIR="$DEPLOY_DIR/backups"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/jagawarga-$STAMP.sql.gz"
docker compose --env-file "$ENV_FILE" -f "$DEPLOY_DIR/compose.yaml" exec -T postgres \
  pg_dump -U jagawarga -d jagawarga | gzip -9 > "$TARGET"
chmod 600 "$TARGET"
find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +14 -delete
echo "Backup written to $TARGET"