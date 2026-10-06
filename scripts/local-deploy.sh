#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

REMOTE="${JAGAWARGA_REMOTE:-origin}"
BRANCH="${JAGAWARGA_BRANCH:-feat/uiux-phases-0-3}"
HOST="${JAGAWARGA_HOST:-127.0.0.1}"
PORT="${JAGAWARGA_PORT:-3000}"
MODE="${JAGAWARGA_MODE:-production}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"
SKIP_INSTALL=0
SKIP_BUILD=0

usage() {
  cat <<'HELP'
JagaWarga local deployment helper

Usage:
  bash scripts/local-deploy.sh [options]

Options:
  --dev              Run Next.js in development mode.
  --production      Build and run the production server (default).
  --skip-install    Reuse the existing node_modules directory.
  --skip-build      Skip the build step (useful with --dev).
  --branch NAME     Pull a different branch.
  --host HOST       Bind address (default: 127.0.0.1).
  --port PORT       Local port (default: 3000).
  --allow-dirty     Continue with uncommitted changes (not recommended).
  -h, --help        Show this help.

Environment variables:
  JAGAWARGA_BRANCH, JAGAWARGA_REMOTE, JAGAWARGA_HOST,
  JAGAWARGA_PORT, JAGAWARGA_MODE, ALLOW_DIRTY
HELP
}

fail() {
  echo "[local-deploy] ERROR: $*" >&2
  exit 1
}

on_error() {
  echo "[local-deploy] FAILED at line $1. Periksa pesan di atas." >&2
}
trap 'on_error "$LINENO"' ERR

while (($# > 0)); do
  case "$1" in
    --dev) MODE="development"; shift ;;
    --production) MODE="production"; shift ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --allow-dirty) ALLOW_DIRTY=1; shift ;;
    --branch)
      [[ $# -ge 2 ]] || fail "--branch membutuhkan nama branch."
      BRANCH="$2"; shift 2 ;;
    --host)
      [[ $# -ge 2 ]] || fail "--host membutuhkan alamat host."
      HOST="$2"; shift 2 ;;
    --port)
      [[ $# -ge 2 ]] || fail "--port membutuhkan nomor port."
      PORT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Opsi tidak dikenal: $1" ;;
  esac
done

case "$MODE" in
  development|production) ;;
  *) fail "Mode tidak valid: $MODE. Gunakan --dev atau --production." ;;
esac

command -v git >/dev/null 2>&1 || fail "git tidak ditemukan."
command -v node >/dev/null 2>&1 || fail "Node.js tidak ditemukan."
command -v npm >/dev/null 2>&1 || fail "npm tidak ditemukan."

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$ROOT_DIR" ]] || fail "Jalankan script dari dalam clone repository JagaWarga."
cd "$ROOT_DIR"

[[ -f package.json ]] || fail "package.json tidak ditemukan di $ROOT_DIR."
grep -q '"name"[[:space:]]*:[[:space:]]*"jagawarga"' package.json || fail "Folder ini bukan project JagaWarga."

if [[ "$ALLOW_DIRTY" != "1" ]] && [[ -n "$(git status --porcelain)" ]]; then
  fail "Working tree memiliki perubahan lokal. Commit/stash dahulu atau gunakan ALLOW_DIRTY=1."
fi

echo "[local-deploy] Repository : $ROOT_DIR"
echo "[local-deploy] Branch     : $BRANCH"
echo "[local-deploy] Mode       : $MODE"
echo "[local-deploy] Address    : http://$HOST:$PORT"

echo "[local-deploy] Fetch branch terbaru..."
git fetch --prune "$REMOTE" "$BRANCH"

if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git switch "$BRANCH"
else
  git switch --track -c "$BRANCH" "$REMOTE/$BRANCH"
fi

git pull --ff-only "$REMOTE" "$BRANCH"

if [[ ! -f .env.local && -f .env.example ]]; then
  cp .env.example .env.local
  echo "[local-deploy] .env.local dibuat dari .env.example. Isi secret lokal jika dibutuhkan."
fi

if [[ "$SKIP_INSTALL" != "1" ]]; then
  echo "[local-deploy] Install dependency dengan npm ci..."
  npm ci
else
  echo "[local-deploy] Install dependency dilewati."
fi

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "[local-deploy] Build project..."
  npm run build
else
  echo "[local-deploy] Build dilewati."
fi

if [[ "$MODE" == "development" ]]; then
  echo "[local-deploy] Menjalankan Next.js development server..."
  exec npm run dev -- --hostname "$HOST" --port "$PORT"
fi

echo "[local-deploy] Menjalankan production server..."
exec npm run start -- --hostname "$HOST" --port "$PORT"
