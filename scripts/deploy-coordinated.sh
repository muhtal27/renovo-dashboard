#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-}"
RUN_SMOKE=0

if [[ -z "$MODE" ]]; then
  printf 'Usage: bash scripts/deploy-coordinated.sh <preview|production> [--smoke]\n' >&2
  exit 1
fi

shift || true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --smoke)
      RUN_SMOKE=1
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
  printf 'Vercel CLI is required for coordinated deploys.\n' >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.js is required for coordinated deploy scripts.\n' >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.vercel/project.json" ]]; then
  printf 'Root project is not linked to Vercel. Run vercel link in the repo root first.\n' >&2
  exit 1
fi

if [[ ! -f "$ROOT_DIR/backend/.vercel/project.json" ]]; then
  printf 'Backend project is not linked to Vercel. Run vercel link in backend/ first.\n' >&2
  exit 1
fi

FRONTEND_PRODUCTION_URL="${RENOVO_FRONTEND_PRODUCTION_URL:-https://renovoai.co.uk}"
BACKEND_PRODUCTION_URL="${RENOVO_BACKEND_PRODUCTION_URL:-https://renovo-backend.vercel.app}"
RELEASE_UNIT="coordinated-$(date -u +%Y%m%dT%H%M%SZ)"

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

deploy_project() {
  local working_dir="$1"
  shift

  (
    cd "$working_dir" &&
      vercel deploy --yes --no-wait --format json "$@" 2>&1
  )
}

printf 'Deploying coordinated %s release.\n' "$MODE"

BACKEND_DEPLOY_ARGS=(
  --meta "releaseUnit=$RELEASE_UNIT"
  --meta "releaseMode=$MODE"
)

FRONTEND_DEPLOY_ARGS=(
  --meta "releaseUnit=$RELEASE_UNIT"
  --meta "releaseMode=$MODE"
)

if [[ "$MODE" == "production" ]]; then
  BACKEND_DEPLOY_ARGS+=(--prod)
  FRONTEND_DEPLOY_ARGS+=(--prod)
fi

printf '\n1. Deploying backend project (%s)\n' "$MODE"
BACKEND_OUTPUT="$(deploy_project "$ROOT_DIR/backend" "${BACKEND_DEPLOY_ARGS[@]}")"
BACKEND_DEPLOYMENT_URL="$(extract_deployment_url "$BACKEND_OUTPUT")"

if [[ -z "$BACKEND_DEPLOYMENT_URL" ]]; then
  printf 'Unable to determine backend deployment URL.\n' >&2
  printf '%s\n' "$BACKEND_OUTPUT" >&2
  exit 1
fi

if [[ "$MODE" == "production" ]]; then
  BACKEND_TARGET_URL="$BACKEND_PRODUCTION_URL"
else
  BACKEND_TARGET_URL="$BACKEND_DEPLOYMENT_URL"
fi

printf 'Backend deployment URL: %s\n' "$BACKEND_DEPLOYMENT_URL"
printf 'Backend target URL for release checks: %s\n' "$BACKEND_TARGET_URL"
printf 'Waiting for backend release endpoints to become ready...\n'

node "$ROOT_DIR/scripts/check-release-pair.mjs" --backend-url "$BACKEND_TARGET_URL" --attempts 36

printf '\n2. Deploying frontend project (%s)\n' "$MODE"
FRONTEND_DEPLOY_ARGS+=(
  --env "EOT_API_BASE_URL=$BACKEND_TARGET_URL"
  --meta "pairedBackendUrl=$BACKEND_TARGET_URL"
)
FRONTEND_OUTPUT="$(deploy_project "$ROOT_DIR" "${FRONTEND_DEPLOY_ARGS[@]}")"
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
printf 'Waiting for frontend and backend release pair to become ready...\n'

printf '\n3. Verifying the release pair\n'
node "$ROOT_DIR/scripts/check-release-pair.mjs" \
  --backend-url "$BACKEND_TARGET_URL" \
  --frontend-url "$FRONTEND_TARGET_URL" \
  --attempts 36

printf '\nCoordinated %s release is ready for validation.\n' "$MODE"
printf 'Frontend URL: %s\n' "$FRONTEND_TARGET_URL"
printf 'Backend URL: %s\n' "$BACKEND_TARGET_URL"
printf 'Smoke command: PLAYWRIGHT_BASE_URL=%s npm run smoke\n' "$FRONTEND_TARGET_URL"

if [[ "$RUN_SMOKE" -eq 1 ]]; then
  printf '\n4. Running smoke against the coordinated pair\n'
  (
    cd "$ROOT_DIR" &&
      PLAYWRIGHT_BASE_URL="$FRONTEND_TARGET_URL" npm run smoke
  )
fi
