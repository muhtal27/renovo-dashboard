#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/local-dev-helpers.sh"

node "$ROOT_DIR/scripts/validate-local-env.mjs"

PLAYWRIGHT_BASE_URL_VALUE="$(read_env_value "$ROOT_DIR/.env.playwright" "PLAYWRIGHT_BASE_URL")"

if [[ -n "$PLAYWRIGHT_BASE_URL_VALUE" && "$PLAYWRIGHT_BASE_URL_VALUE" != "$FRONTEND_URL" ]]; then
  printf 'smoke:local expects .env.playwright PLAYWRIGHT_BASE_URL to be blank or %s. Current value: %s\n' "$FRONTEND_URL" "$PLAYWRIGHT_BASE_URL_VALUE" >&2
  exit 1
fi

BACKEND_URL="$(get_backend_url)"

BACKEND_STARTED=0
BACKEND_PID=""
FRONTEND_STARTED=0
FRONTEND_PID=""

trap 'cleanup_started_services $?' INT TERM EXIT

start_backend_if_needed "$BACKEND_URL"
start_frontend_if_needed

wait_for_url "$(append_url_path "$BACKEND_URL" "/openapi.json")" "Backend" 5 1
wait_for_url "$(append_url_path "$FRONTEND_URL" "/login")" "Frontend" 5 1
node "$ROOT_DIR/scripts/check-release-pair.mjs" --backend-url "$BACKEND_URL" --frontend-url "$FRONTEND_URL"

printf '\n'
printf 'Running Playwright smoke suite against %s\n' "$FRONTEND_URL"
printf '\n'

(
  cd "$ROOT_DIR" &&
    npx dotenv -e .env.playwright -- sh -c 'export PLAYWRIGHT_BASE_URL=http://localhost:3000; exec playwright test'
)
