#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Renovo dashboard performance test runner
#
# Usage:
#   ./tests/perf/run-perf.sh browser          # Playwright browser-level tests
#   ./tests/perf/run-perf.sh api              # k6 API load test
#   ./tests/perf/run-perf.sh browser --headed # Watch browser tests run
#
# Environment:
#   PLAYWRIGHT_BASE_URL   Target URL (default: http://localhost:3000)
#   K6_BASE_URL           Target URL for k6 (default: same as PLAYWRIGHT_BASE_URL)
#
# Prerequisites:
#   - Playwright: already installed (npx playwright test)
#   - k6: brew install grafana/k6/k6
#   - Auth: .env.playwright must have PLAYWRIGHT_ADMIN_EMAIL/PASSWORD
#           For k6, cookies are extracted from Playwright auth state
# ─────────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"

case "${1:-browser}" in
  browser)
    shift || true
    echo "Running Playwright perf tests against $BASE_URL"
    echo "─────────────────────────────────────────────"

    # Ensure auth state exists
    if [[ ! -f playwright/.auth/admin.json ]]; then
      echo "Auth state not found. Running auth setup first..."
      npx playwright test --project=setup
    fi

    # Run perf tests (not smoke tests)
    npx playwright test --project=perf --reporter=list "$@"
    ;;

  api)
    shift || true

    if ! command -v k6 >/dev/null 2>&1; then
      echo "k6 not installed. Install with: brew install grafana/k6/k6"
      exit 1
    fi

    # Extract cookies from Playwright auth state if available
    AUTH_FILE="$ROOT_DIR/playwright/.auth/admin.json"
    SESSION_COOKIE=""
    TENANT_COOKIE=""

    if [[ -f "$AUTH_FILE" ]]; then
      SESSION_COOKIE=$(node -e "
        const fs = require('fs');
        const auth = JSON.parse(fs.readFileSync('$AUTH_FILE', 'utf8'));
        const c = auth.cookies?.find(c => c.name === 'renovo-operator-session');
        if (c) process.stdout.write(c.value);
      " 2>/dev/null || true)

      TENANT_COOKIE=$(node -e "
        const fs = require('fs');
        const auth = JSON.parse(fs.readFileSync('$AUTH_FILE', 'utf8'));
        const c = auth.cookies?.find(c => c.name === 'renovo-active-tenant-membership');
        if (c) process.stdout.write(c.value);
      " 2>/dev/null || true)
    fi

    if [[ -z "$SESSION_COOKIE" ]]; then
      echo "Warning: No session cookie found. Run 'npx playwright test --project=setup' first."
      echo "Continuing without auth — API calls will return 401."
    fi

    # Try to find a case ID from the API
    CASE_ID=""
    if [[ -n "$SESSION_COOKIE" ]]; then
      CASE_ID=$(curl -s \
        -H "Cookie: renovo-operator-session=$SESSION_COOKIE; renovo-active-tenant-membership=$TENANT_COOKIE" \
        "$BASE_URL/api/eot/cases" 2>/dev/null \
        | node -e "
          let d='';
          process.stdin.on('data',c=>d+=c);
          process.stdin.on('end',()=>{
            try { const a=JSON.parse(d); if(a[0]?.id) process.stdout.write(a[0].id); } catch{}
          });
        " 2>/dev/null || true)
    fi

    K6_URL="${K6_BASE_URL:-$BASE_URL}"
    echo "Running k6 API load test against $K6_URL"
    [[ -n "$CASE_ID" ]] && echo "Using case ID: $CASE_ID" || echo "Warning: No case ID found, workspace summary calls will be skipped"
    echo "─────────────────────────────────────────────"

    k6 run \
      -e "BASE_URL=$K6_URL" \
      -e "SESSION_COOKIE=$SESSION_COOKIE" \
      -e "TENANT_COOKIE=$TENANT_COOKIE" \
      -e "CASE_ID=$CASE_ID" \
      "$@" \
      tests/perf/api-load.js
    ;;

  *)
    echo "Usage: $0 {browser|api} [extra args]"
    exit 1
    ;;
esac
