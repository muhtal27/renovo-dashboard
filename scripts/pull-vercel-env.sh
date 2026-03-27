#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PULL_FRONTEND=1
PULL_BACKEND=1
FORCE=0
MERGE_MISSING_FRONTEND_PUBLIC=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --frontend)
      PULL_BACKEND=0
      ;;
    --backend)
      PULL_FRONTEND=0
      ;;
    --force)
      FORCE=1
      ;;
    --merge-missing-frontend-public)
      MERGE_MISSING_FRONTEND_PUBLIC=1
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      exit 1
      ;;
  esac
  shift
done

if ! command -v vercel >/dev/null 2>&1; then
  printf 'Vercel CLI is not installed. Install it before using env pull automation.\n' >&2
  exit 1
fi

pull_env() {
  local project_dir="$1"
  local target_file="$2"

  if [[ ! -f "$project_dir/.vercel/project.json" ]]; then
    printf 'Skipping %s because it is not linked to a Vercel project.\n' "${project_dir#$ROOT_DIR/}"
    return 0
  fi

  if [[ -f "$target_file" && "$FORCE" -ne 1 ]]; then
    printf 'Refusing to overwrite existing %s. Re-run with --force if you want Vercel CLI to replace it.\n' "${target_file#$ROOT_DIR/}"
    return 0
  fi

  (
    cd "$project_dir" &&
      vercel env pull "$(basename "$target_file")" --environment=development
  )
}

merge_missing_frontend_public() {
  local target_file="$ROOT_DIR/.env.local"
  local env_name
  local temp_file
  local merged_any=0

  if [[ ! -f "$target_file" ]]; then
    printf 'Cannot merge frontend public vars because .env.local does not exist yet.\n' >&2
    return 1
  fi

  if [[ ! -f "$ROOT_DIR/.vercel/project.json" ]]; then
    printf 'Skipping frontend public merge because the root project is not linked to Vercel.\n'
    return 0
  fi

  temp_file="$(mktemp)"

  for env_name in development preview production; do
    if ! (
      cd "$ROOT_DIR" &&
        vercel env pull "$temp_file" --environment="$env_name" --yes >/dev/null
    ); then
      continue
    fi

    local merge_result
    merge_result="$(
      node - "$target_file" "$temp_file" "$env_name" <<'NODE'
const fs = require('node:fs')

const targetPath = process.argv[2]
const sourcePath = process.argv[3]
const envName = process.argv[4]

function parseEnvFile(filePath) {
  const result = { lines: [], values: {} }
  const text = fs.readFileSync(filePath, 'utf8')

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine
    result.lines.push(line)

    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result.values[key] = value
  }

  return result
}

function isPlaceholderValue(value) {
  if (!value) {
    return true
  }

  const normalized = value.trim().toLowerCase()
  return (
    normalized.length === 0 ||
    normalized.startsWith('replace-with') ||
    normalized.startsWith('your-') ||
    normalized.startsWith('your_') ||
    normalized === 'https://your-project.supabase.co'
  )
}

function upsertLine(lines, key, value) {
  const nextLine = `${key}=${value}`
  const index = lines.findIndex((line) => line.startsWith(`${key}=`))

  if (index >= 0) {
    lines[index] = nextLine
    return
  }

  lines.push(nextLine)
}

const target = parseEnvFile(targetPath)
const source = parseEnvFile(sourcePath)
const keys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
const updated = []

for (const key of keys) {
  const currentValue = target.values[key]
  const sourceValue = source.values[key]

  if (!isPlaceholderValue(currentValue)) {
    continue
  }

  if (isPlaceholderValue(sourceValue)) {
    continue
  }

  upsertLine(target.lines, key, sourceValue)
  target.values[key] = sourceValue
  updated.push(key)
}

if (updated.length > 0) {
  fs.writeFileSync(targetPath, `${target.lines.join('\n').replace(/\n*$/, '\n')}`, 'utf8')
}

process.stdout.write(JSON.stringify({ envName, updated }))
NODE
    )"

    local updated_count
    updated_count="$(node -e "const payload = JSON.parse(process.argv[1]); process.stdout.write(String(payload.updated.length));" "$merge_result")"

    if [[ "$updated_count" -gt 0 ]]; then
      merged_any=1
      printf 'Merged missing frontend public vars from Vercel %s env into .env.local\n' "$env_name"
    fi
  done

  rm -f "$temp_file"

  if [[ "$merged_any" -eq 0 ]]; then
    printf 'No missing frontend public vars could be sourced from linked Vercel envs.\n'
  fi
}

if [[ "$PULL_FRONTEND" -eq 1 ]]; then
  if [[ "$MERGE_MISSING_FRONTEND_PUBLIC" -eq 1 ]]; then
    merge_missing_frontend_public
  else
    pull_env "$ROOT_DIR" "$ROOT_DIR/.env.local"
  fi
fi

if [[ "$PULL_BACKEND" -eq 1 ]]; then
  pull_env "$ROOT_DIR/backend" "$ROOT_DIR/backend/.env"
fi

printf '\n'
printf 'Vercel env pull finished.\n'
printf 'Review the pulled files and then run npm run check:env:local.\n'
printf 'Playwright credentials are not expected to come from Vercel env pull; keep setting .env.playwright manually.\n'
