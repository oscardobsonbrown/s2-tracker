#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <shared|app|web|api> -- <command...>" >&2
  exit 1
fi

TARGET="$1"
shift

if [ "$1" != "--" ]; then
  echo "Expected '--' before command." >&2
  exit 1
fi
shift

case "$TARGET" in
  shared|app|web|api) ;;
  *)
    echo "Invalid target '$TARGET'. Use shared|app|web|api." >&2
    exit 1
    ;;
esac

if ! command -v doppler >/dev/null 2>&1; then
  echo "Doppler CLI not found. Install it first." >&2
  exit 1
fi

TOKEN_FILE="${DOPPLER_TOKEN_FILE:-/run/secrets/doppler/token}"
if [ -z "${DOPPLER_TOKEN:-}" ]; then
  if [ ! -f "$TOKEN_FILE" ]; then
    echo "Doppler token not found. Set DOPPLER_TOKEN or mount $TOKEN_FILE." >&2
    exit 1
  fi
  export DOPPLER_TOKEN
  DOPPLER_TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
fi

PROJECT="${DOPPLER_PROJECT:-next-ship}"
SHARED_CONFIG="${DOPPLER_CONFIG_SHARED:-dev_shared}"
APP_CONFIG="${DOPPLER_CONFIG_APP:-dev_app}"
WEB_CONFIG="${DOPPLER_CONFIG_WEB:-dev_web}"
API_CONFIG="${DOPPLER_CONFIG_API:-dev_api}"

TARGET_CONFIG=""
case "$TARGET" in
  app) TARGET_CONFIG="$APP_CONFIG" ;;
  web) TARGET_CONFIG="$WEB_CONFIG" ;;
  api) TARGET_CONFIG="$API_CONFIG" ;;
esac

TMP_ENV="$(mktemp)"
cleanup() {
  rm -f "$TMP_ENV"
}
trap cleanup EXIT

doppler secrets download \
  --project "$PROJECT" \
  --config "$SHARED_CONFIG" \
  --no-file \
  --format env > "$TMP_ENV"

if [ -n "$TARGET_CONFIG" ] && [ "$TARGET_CONFIG" != "$SHARED_CONFIG" ]; then
  doppler secrets download \
    --project "$PROJECT" \
    --config "$TARGET_CONFIG" \
    --no-file \
    --format env >> "$TMP_ENV"
fi

set -a
# shellcheck disable=SC1090
source "$TMP_ENV"
set +a

exec "$@"
