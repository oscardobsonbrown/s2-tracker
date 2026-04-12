#!/usr/bin/env bash
set -euo pipefail

TOKEN_FILE="${DOPPLER_TOKEN_FILE:-/run/secrets/doppler/token}"

if ! command -v doppler >/dev/null 2>&1; then
  echo "Doppler CLI is missing. Install it with:"
  echo "curl -Ls https://cli.doppler.com/install.sh | sh"
  exit 1
fi

if [ -z "${DOPPLER_TOKEN:-}" ] && [ ! -f "$TOKEN_FILE" ]; then
  echo "No Doppler token found."
  echo "Set DOPPLER_TOKEN, or mount a token file at: $TOKEN_FILE"
  exit 1
fi

PROJECT="${DOPPLER_PROJECT:-next-ship}"
CONFIG="${DOPPLER_CONFIG_SHARED:-dev_shared}"

if [ -z "${DOPPLER_TOKEN:-}" ]; then
  export DOPPLER_TOKEN
  DOPPLER_TOKEN="$(tr -d '\r\n' < "$TOKEN_FILE")"
fi

doppler secrets download --project "$PROJECT" --config "$CONFIG" --no-file --format env >/dev/null
echo "Doppler bootstrap succeeded for project '$PROJECT' config '$CONFIG'."
