#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_URL="http://localhost:3000"
DEFAULT_BACKEND_URL="http://127.0.0.1:8000"

read_env_value() {
  local file_path="$1"
  local key="$2"

  if [[ ! -f "$file_path" ]]; then
    return 0
  fi

  awk -v key="$key" '
    /^[[:space:]]*#/ { next }
    {
      line = $0
      sub(/\r$/, "", line)
      split(line, parts, "=")
      candidate = parts[1]
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", candidate)
      if (candidate == key) {
        value = substr(line, index(line, "=") + 1)
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      }
    }
    END {
      if (value ~ /^".*"$/ || value ~ /^'\''.*'\''$/) {
        value = substr(value, 2, length(value) - 2)
      }
      print value
    }
  ' "$file_path"
}

get_backend_url() {
  local value
  value="$(read_env_value "$ROOT_DIR/.env.local" "EOT_API_BASE_URL")"

  if [[ -n "$value" ]]; then
    printf '%s\n' "$value"
    return 0
  fi

  printf '%s\n' "$DEFAULT_BACKEND_URL"
}

append_url_path() {
  local base_url="$1"
  local suffix="$2"

  printf '%s%s\n' "${base_url%/}" "$suffix"
}

is_local_url() {
  local url="$1"
  [[ "$url" =~ ^https?://(127\.0\.0\.1|localhost)(:[0-9]+)?(/.*)?$ ]]
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"
  local sleep_seconds="${4:-1}"

  for ((attempt=1; attempt<=attempts; attempt++)); do
    if curl --silent --fail --output /dev/null "$url"; then
      printf '%s is reachable at %s\n' "$label" "$url"
      return 0
    fi

    sleep "$sleep_seconds"
  done

  printf 'Timed out waiting for %s at %s\n' "$label" "$url" >&2
  return 1
}

start_backend_if_needed() {
  local backend_url="$1"
  local backend_health_url
  backend_health_url="$(append_url_path "$backend_url" "/openapi.json")"

  if curl --silent --fail --output /dev/null "$backend_health_url"; then
    printf 'Backend already reachable at %s\n' "$backend_url"
    BACKEND_STARTED=0
    BACKEND_PID=""
    return 0
  fi

  if ! is_local_url "$backend_url"; then
    printf 'Backend URL %s is not local and is not reachable. Adjust EOT_API_BASE_URL or start that backend manually.\n' "$backend_url" >&2
    return 1
  fi

  if [[ -x "$ROOT_DIR/backend/.venv/bin/python" && -x "$ROOT_DIR/backend/.venv/bin/alembic" ]]; then
    (
      cd "$ROOT_DIR/backend" &&
        ./.venv/bin/alembic upgrade head &&
        ./.venv/bin/python -m uvicorn app.main:app --reload
    ) &
  elif command -v poetry >/dev/null 2>&1; then
    (
      cd "$ROOT_DIR/backend" &&
        poetry run alembic upgrade head &&
        poetry run uvicorn app.main:app --reload
    ) &
  else
    printf 'Backend runner not found. Install Poetry or create backend/.venv before using local automation.\n' >&2
    return 1
  fi

  BACKEND_STARTED=1
  BACKEND_PID=$!
  wait_for_url "$backend_health_url" "Backend" 90 1
}

start_frontend_if_needed() {
  local frontend_health_url
  frontend_health_url="$(append_url_path "$FRONTEND_URL" "/login")"

  if curl --silent --fail --output /dev/null "$frontend_health_url"; then
    printf 'Frontend already reachable at %s\n' "$FRONTEND_URL"
    FRONTEND_STARTED=0
    FRONTEND_PID=""
    return 0
  fi

  (
    cd "$ROOT_DIR" &&
      npm run dev
  ) &

  FRONTEND_STARTED=1
  FRONTEND_PID=$!
  wait_for_url "$frontend_health_url" "Frontend" 90 1
}

cleanup_started_services() {
  local exit_code="${1:-0}"

  if [[ -n "${FRONTEND_PID:-}" && "${FRONTEND_STARTED:-0}" -eq 1 ]]; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "${BACKEND_PID:-}" && "${BACKEND_STARTED:-0}" -eq 1 ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}
