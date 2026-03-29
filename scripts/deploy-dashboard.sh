#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-}"
RUN_SMOKE=0
BACKEND_URL_OVERRIDE=""

if [[ -z "$MODE" ]]; then
  printf 'Usage: bash scripts/deploy-dashboard.sh <preview|production> [--smoke] [--backend-url <url>]\n' >&2
  exit 1
fi

shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --smoke)
      RUN_SMOKE=1
      ;;
    --backend-url)
      if [[ $# -lt 2 ]]; then
        printf 'Missing value for --backend-url.\n' >&2
        exit 1
      fi
      BACKEND_URL_OVERRIDE="$2"
      shift
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$MODE" != "preview" && "$MODE" != "production" ]]; then
  printf 'Mode must be preview or production.\n' >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  printf 'Vercel CLI is required for deploys.\n' >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is required for deploy scripts.\n' >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.vercel/project.json" ]]; then
  printf 'Root project is not linked to Vercel. Run vercel link in the repo root first.\n' >&2
  exit 1
fi

FRONTEND_PRODUCTION_URL="${RENOVO_FRONTEND_PRODUCTION_URL:-https://renovoai.co.uk}"
BACKEND_PREVIEW_URL="${RENOVO_BACKEND_PREVIEW_URL:-}"
BACKEND_PRODUCTION_URL="${RENOVO_BACKEND_PRODUCTION_URL:-https://renovo-backend.vercel.app}"
RELEASE_UNIT="dashboard-release-$(date -u +%Y%m%dT%H%M%SZ)"

extract_deployment_url() {
  local output="$1"

  node - "$output" <<'NODE'
const input = process.argv[2] ?? ''

function normalize(url) {
  if (!url) {
    return null
  }

  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
}

try {
  const payload = JSON.parse(input)
  const directUrl =
    payload.url ??
    payload.deployment?.url ??
    payload.inspectorUrl ??
    payload.deploymentURL ??
    null

  if (directUrl) {
    process.stdout.write(normalize(directUrl))
    process.exit(0)
  }
} catch {}

const matches = [...input.matchAll(/https:\/\/[a-zA-Z0-9.-]+(?:\.vercel\.app|\.co\.uk)/g)].map(
  (match) => match[0]
)

if (matches.length === 0) {
  process.exit(1)
}

process.stdout.write(matches[matches.length - 1])
NODE
}

normalize_url() {
  local value="${1:-}"

  if [[ -z "$value" ]]; then
    return 0
  fi

  node - "$value" <<'NODE'
const input = (process.argv[2] ?? '').trim()

if (!input) {
  process.exit(0)
}

const normalized = input.startsWith('http://') || input.startsWith('https://')
  ? input
  : `https://${input}`

process.stdout.write(normalized.replace(/\/+$/, ''))
NODE
}

deploy_project() {
  (
    cd "$ROOT_DIR" &&
      vercel deploy --yes --format json "$@" 2>&1
  )
}

if [[ -n "$BACKEND_URL_OVERRIDE" ]]; then
  BACKEND_TARGET_URL="$(normalize_url "$BACKEND_URL_OVERRIDE")"
elif [[ "$MODE" == "production" ]]; then
  BACKEND_TARGET_URL="$(normalize_url "$BACKEND_PRODUCTION_URL")"
else
  BACKEND_TARGET_URL="$(normalize_url "$BACKEND_PREVIEW_URL")"
fi

printf 'Deploying dashboard %s release from the frontend repo.\n' "$MODE"

if [[ -n "$BACKEND_TARGET_URL" ]]; then
  printf 'Backend override for this deploy: %s\n' "$BACKEND_TARGET_URL"
else
  printf 'No backend override supplied. This deploy will use the project-level EOT_API_BASE_URL already configured in Vercel.\n'
fi

FRONTEND_DEPLOY_ARGS=(
  --meta "releaseUnit=$RELEASE_UNIT"
  --meta "releaseMode=$MODE"
)

if [[ "$MODE" == "production" ]]; then
  FRONTEND_DEPLOY_ARGS+=(--prod)
fi

if [[ -n "$BACKEND_TARGET_URL" ]]; then
  FRONTEND_DEPLOY_ARGS+=(
    --env "EOT_API_BASE_URL=$BACKEND_TARGET_URL"
    --meta "pairedBackendUrl=$BACKEND_TARGET_URL"
  )

  printf '\n1. Verifying backend target (%s)\n' "$MODE"
  node "$ROOT_DIR/scripts/check-release-pair.mjs" --backend-url "$BACKEND_TARGET_URL" --attempts 36

  printf '\n2. Deploying frontend project (%s)\n' "$MODE"
else
  printf '\n1. Deploying frontend project (%s)\n' "$MODE"
fi

FRONTEND_OUTPUT="$(deploy_project "${FRONTEND_DEPLOY_ARGS[@]}")"
FRONTEND_DEPLOYMENT_URL="$(extract_deployment_url "$FRONTEND_OUTPUT")"

if [[ -z "$FRONTEND_DEPLOYMENT_URL" ]]; then
  printf 'Unable to determine frontend deployment URL.\n' >&2
  printf '%s\n' "$FRONTEND_OUTPUT" >&2
  exit 1
fi

if [[ "$MODE" == "production" ]]; then
  FRONTEND_TARGET_URL="$FRONTEND_PRODUCTION_URL"
else
  FRONTEND_TARGET_URL="$FRONTEND_DEPLOYMENT_URL"
fi

printf 'Frontend deployment URL: %s\n' "$FRONTEND_DEPLOYMENT_URL"
printf 'Frontend target URL for verification: %s\n' "$FRONTEND_TARGET_URL"

if [[ -n "$BACKEND_TARGET_URL" ]]; then
  printf '\n3. Verifying the release pair\n'
  node "$ROOT_DIR/scripts/check-release-pair.mjs" \
    --backend-url "$BACKEND_TARGET_URL" \
    --frontend-url "$FRONTEND_TARGET_URL" \
    --attempts 36
else
  printf '\n2. Verifying the frontend deployment\n'
  node "$ROOT_DIR/scripts/check-release-pair.mjs" \
    --frontend-url "$FRONTEND_TARGET_URL" \
    --attempts 36
fi

printf '\nDashboard %s release is ready for validation.\n' "$MODE"
printf 'Frontend URL: %s\n' "$FRONTEND_TARGET_URL"

if [[ -n "$BACKEND_TARGET_URL" ]]; then
  printf 'Backend URL: %s\n' "$BACKEND_TARGET_URL"
else
  printf 'Backend URL: project-level EOT_API_BASE_URL in Vercel (not overridden by this script)\n'
fi

printf 'Smoke command: PLAYWRIGHT_BASE_URL=%s npm run smoke\n' "$FRONTEND_TARGET_URL"

if [[ "$RUN_SMOKE" -eq 1 ]]; then
  printf '\nRunning smoke against the deployed frontend\n'
  (
    cd "$ROOT_DIR" &&
      PLAYWRIGHT_BASE_URL="$FRONTEND_TARGET_URL" npm run smoke
  )
fi
