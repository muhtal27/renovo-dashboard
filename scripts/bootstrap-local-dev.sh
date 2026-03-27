#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

copy_if_missing() {
  local source_path="$1"
  local target_path="$2"

  if [[ -f "$target_path" ]]; then
    printf 'Keeping existing %s\n' "${target_path#$ROOT_DIR/}"
    return 0
  fi

  cp "$source_path" "$target_path"
  printf 'Created %s from %s\n' "${target_path#$ROOT_DIR/}" "${source_path#$ROOT_DIR/}"
}

copy_if_missing "$ROOT_DIR/.env.local.example" "$ROOT_DIR/.env.local"
copy_if_missing "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
copy_if_missing "$ROOT_DIR/.env.playwright.example" "$ROOT_DIR/.env.playwright"

if command -v vercel >/dev/null 2>&1 && [[ -f "$ROOT_DIR/.vercel/project.json" ]]; then
  printf 'Attempting safe Vercel merge for missing frontend public env vars...\n'
  bash "$ROOT_DIR/scripts/pull-vercel-env.sh" --frontend --merge-missing-frontend-public
fi

printf '\n'
node "$ROOT_DIR/scripts/validate-local-env.mjs" --report
printf '\n'
printf 'Bootstrap complete.\n'
printf 'Fill in any blank or placeholder values above, then run npm run check:env:local.\n'
