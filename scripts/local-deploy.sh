#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env.local-deploy"
COMPOSE_FILE="$ROOT/compose.yaml"

log() {
  printf '\n==> %s\n' "$1"
}

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

on_error() {
  local exit_code=$?
  printf '\nDeployment lokal gagal (exit %s). Log container terakhir:\n' "$exit_code" >&2
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=80 2>/dev/null || true
  exit "$exit_code"
}

trap on_error ERR
cd "$ROOT"

for command_name in git docker node; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Perintah '$command_name' belum tersedia."
done

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || fail "Jalankan skrip ini dari clone Git JagaWarga."
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 belum tersedia."
docker info >/dev/null 2>&1 || fail "Docker daemon belum berjalan."

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Ada perubahan tracked yang belum di-commit. Commit/stash terlebih dahulu agar pull aman."
fi

branch="$(git symbolic-ref --quiet --short HEAD)" || fail "HEAD sedang detached; checkout branch sebelum deploy."

if [ "${SKIP_PULL:-false}" != "true" ]; then
  git rev-parse --abbrev-ref '@{upstream}' >/dev/null 2>&1 || fail "Branch '$branch' belum memiliki upstream. Set upstream atau gunakan SKIP_PULL=true."
  log "Mengambil perubahan terbaru untuk branch $branch"
  git pull --ff-only
else
  log "Melewati git pull (SKIP_PULL=true)"
fi

log "Menyiapkan konfigurasi lokal"
node scripts/init-local-deploy.mjs
chmod 600 "$ENV_FILE"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" config --quiet

log "Build dan menjalankan App + Redis"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up --build -d --wait --force-recreate

app_port="$(sed -n 's/^APP_PORT=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')"
app_port="${app_port:-3000}"

if [ "${SKIP_VERIFY:-false}" != "true" ]; then
  log "Memverifikasi deployment lokal"
  BASE_URL="http://127.0.0.1:$app_port" node scripts/local-verify.mjs
else
  log "Melewati verifikasi (SKIP_VERIFY=true)"
fi

log "Status service"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

printf '\nDeployment lokal siap: http://localhost:%s\n' "$app_port"
printf 'Hentikan dengan: docker compose --env-file .env.local-deploy down\n'
