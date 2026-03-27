#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

const FRONTEND_ENV_PATH = path.join(rootDir, '.env.local')
const BACKEND_ENV_PATH = path.join(rootDir, 'backend/.env')
const PLAYWRIGHT_ENV_PATH = path.join(rootDir, '.env.playwright')

const reportMode = process.argv.includes('--report')

const FRONTEND_REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'EOT_INTERNAL_AUTH_SECRET',
  'EOT_API_BASE_URL',
]

const BACKEND_REQUIRED = ['DATABASE_URL', 'EOT_INTERNAL_AUTH_SECRET']

const PLAYWRIGHT_REQUIRED = ['PLAYWRIGHT_ADMIN_EMAIL', 'PLAYWRIGHT_ADMIN_PASSWORD']

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const contents = fs.readFileSync(filePath, 'utf8')
  const env = {}

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
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

    env[key] = value
  }

  return env
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
    normalized === 'operator@example.com' ||
    normalized === 'https://your-project.supabase.co'
  )
}

function collectMissing(env, names) {
  return names.filter((name) => isPlaceholderValue(env[name]))
}

function printGroup(title, names) {
  console.log(`${title}:`)

  if (names.length === 0) {
    console.log('  - none')
    return
  }

  for (const name of names) {
    console.log(`  - ${name}`)
  }
}

const frontendEnv = parseEnvFile(FRONTEND_ENV_PATH)
const backendEnv = parseEnvFile(BACKEND_ENV_PATH)
const playwrightEnv = parseEnvFile(PLAYWRIGHT_ENV_PATH)

const missingFrontend = collectMissing(frontendEnv, FRONTEND_REQUIRED)
const missingBackend = collectMissing(backendEnv, BACKEND_REQUIRED)
const missingPlaywright = collectMissing(playwrightEnv, PLAYWRIGHT_REQUIRED)

const frontendSecret = frontendEnv.EOT_INTERNAL_AUTH_SECRET?.trim() ?? ''
const backendSecret = backendEnv.EOT_INTERNAL_AUTH_SECRET?.trim() ?? ''
const hasFrontendSecret = !isPlaceholderValue(frontendSecret)
const hasBackendSecret = !isPlaceholderValue(backendSecret)
const hasSecretMismatch = hasFrontendSecret && hasBackendSecret && frontendSecret !== backendSecret

const issues = []

if (missingFrontend.includes('EOT_INTERNAL_AUTH_SECRET')) {
  issues.push(
    'Missing frontend EOT internal auth secret in .env.local: set EOT_INTERNAL_AUTH_SECRET and keep it identical to backend/.env.'
  )
}

if (missingBackend.includes('EOT_INTERNAL_AUTH_SECRET')) {
  issues.push(
    'Missing backend EOT internal auth secret in backend/.env: set EOT_INTERNAL_AUTH_SECRET and keep it identical to .env.local.'
  )
}

if (hasSecretMismatch) {
  issues.push(
    'Frontend and backend EOT_INTERNAL_AUTH_SECRET values do not match. The Next.js proxy and FastAPI backend must share the exact same value.'
  )
}

if (missingBackend.includes('DATABASE_URL')) {
  issues.push(
    'Missing backend database URL in backend/.env: set DATABASE_URL before starting FastAPI.'
  )
}

if (missingFrontend.includes('EOT_API_BASE_URL')) {
  issues.push(
    'Missing frontend EOT backend URL in .env.local: set EOT_API_BASE_URL to the FastAPI service root, usually http://127.0.0.1:8000.'
  )
}

if (missingPlaywright.includes('PLAYWRIGHT_ADMIN_EMAIL') || missingPlaywright.includes('PLAYWRIGHT_ADMIN_PASSWORD')) {
  issues.push(
    'Missing Playwright login bootstrap credentials in .env.playwright: set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD.'
  )
}

if (missingFrontend.includes('NEXT_PUBLIC_SUPABASE_URL') || missingFrontend.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
  issues.push(
    'Missing frontend Supabase public config in .env.local: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

if (missingFrontend.includes('SUPABASE_SERVICE_ROLE_KEY')) {
  issues.push(
    'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local: required for operator membership and profile resolution in local operator flows.'
  )
}

console.log('Local env validation')
console.log(`Frontend env: ${path.relative(rootDir, FRONTEND_ENV_PATH)}`)
console.log(`Backend env: ${path.relative(rootDir, BACKEND_ENV_PATH)}`)
console.log(`Playwright env: ${path.relative(rootDir, PLAYWRIGHT_ENV_PATH)}`)
console.log('')

printGroup('Frontend required vars still blank or placeholder', missingFrontend)
printGroup('Backend required vars still blank or placeholder', missingBackend)
printGroup('Playwright required vars still blank or placeholder', missingPlaywright)
console.log('')

if (hasSecretMismatch) {
  console.log('Cross-file mismatch:')
  console.log('  - EOT_INTERNAL_AUTH_SECRET differs between .env.local and backend/.env')
  console.log('')
}

if (issues.length > 0) {
  console.log('Actionable errors:')

  for (const issue of issues) {
    console.log(`  - ${issue}`)
  }

  if (!reportMode) {
    process.exit(1)
  }
} else {
  console.log('All required local env values are present and aligned.')
}
