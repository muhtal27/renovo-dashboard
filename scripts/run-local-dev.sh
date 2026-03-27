#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/local-dev-helpers.sh"

node "$ROOT_DIR/scripts/validate-local-env.mjs"

BACKEND_URL="$(get_backend_url)"

BACKEND_STARTED=0
BACKEND_PID=""
FRONTEND_STARTED=0
FRONTEND_PID=""

trap 'cleanup_started_services $?' INT TERM EXIT

start_backend_if_needed "$BACKEND_URL"
start_frontend_if_needed

printf '\n'
printf 'Local dev is running.\n'
printf 'Frontend: %s\n' "$FRONTEND_URL"
printf 'Backend: %s\n' "$BACKEND_URL"
printf '\n'
printf 'Suggested quick checks:\n'
printf '  - %s/login\n' "$FRONTEND_URL"
printf '  - %s/eot\n' "$FRONTEND_URL"
printf '  - %s/reports\n' "$FRONTEND_URL"
printf '  - %s/openapi.json\n' "${BACKEND_URL%/}"
printf '\n'
printf 'Press Ctrl-C to stop any services started by this script.\n'

wait
