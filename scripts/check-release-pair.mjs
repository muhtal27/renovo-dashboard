#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const args = process.argv.slice(2)
const execFileAsync = promisify(execFile)

const options = {
  attempts: 24,
  delayMs: 2500,
}

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index]

  if (argument === '--backend-url') {
    options.backendUrl = args[index + 1]
    index += 1
    continue
  }

  if (argument === '--frontend-url') {
    options.frontendUrl = args[index + 1]
    index += 1
    continue
  }

  if (argument === '--attempts') {
    options.attempts = Number(args[index + 1])
    index += 1
    continue
  }

  if (argument === '--delay-ms') {
    options.delayMs = Number(args[index + 1])
    index += 1
    continue
  }

  throw new Error(`Unknown argument: ${argument}`)
}

const REQUIRED_BACKEND_CAPABILITIES = [
  'eot_case_list',
  'eot_report_summary',
  'eot_case_workspace_summary',
  'eot_paged_sections',
]

function normalizeUrl(value) {
  if (!value) {
    return null
  }

  return value.startsWith('http://') || value.startsWith('https://')
    ? value.replace(/\/+$/, '')
    : `https://${value.replace(/\/+$/, '')}`
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchJsonWithRetry(url, label, attempts, delayMs) {
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`${label} returned ${response.status}${body ? `: ${body}` : ''}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error

      if (attempt < attempts) {
        await sleep(delayMs)
      }
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${label}.`)
}

async function fetchTextWithRetry(url, label, attempts, delayMs) {
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        const body = await response.text()

        if ((response.status === 401 || response.status === 403) && isProtectedVercelPreview(url)) {
          return await fetchProtectedVercelPreview(url, label)
        }

        throw new Error(`${label} returned ${response.status}${body ? `: ${body}` : ''}`)
      }

      return await response.text()
    } catch (error) {
      lastError = error

      if (attempt < attempts) {
        await sleep(delayMs)
      }
    }
  }

  throw lastError ?? new Error(`Unable to fetch ${label}.`)
}

function isProtectedVercelPreview(url) {
  try {
    const parsed = new URL(url)
    return parsed.hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

async function fetchProtectedVercelPreview(url, label) {
  const parsed = new URL(url)
  const path = `${parsed.pathname}${parsed.search}`

  try {
    const { stdout } = await execFileAsync(
      'vercel',
      [
        'curl',
        path || '/',
        '--deployment',
        parsed.origin,
        '--',
        '--silent',
        '--show-error',
        '--fail',
      ],
      {
        maxBuffer: 1024 * 1024 * 5,
      }
    )

    return stdout
  } catch (error) {
    const details =
      error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
        ? error.stderr.trim()
        : ''

    throw new Error(
      `${label} is protected by Vercel authentication and vercel curl failed${details ? `: ${details}` : '.'}`
    )
  }
}

function assertBackendCapabilities(releasePayload) {
  const capabilities =
    releasePayload && typeof releasePayload === 'object' && releasePayload.capabilities
      ? releasePayload.capabilities
      : null

  if (!capabilities || typeof capabilities !== 'object') {
    throw new Error('Backend release metadata is missing the capabilities map.')
  }

  const missingCapabilities = REQUIRED_BACKEND_CAPABILITIES.filter(
    (capability) => capabilities[capability] !== true
  )

  if (missingCapabilities.length > 0) {
    throw new Error(
      `Backend release metadata is missing required capabilities: ${missingCapabilities.join(', ')}`
    )
  }
}

async function main() {
  const backendUrl = normalizeUrl(options.backendUrl)
  const frontendUrl = normalizeUrl(options.frontendUrl)

  if (!backendUrl && !frontendUrl) {
    throw new Error('Provide --frontend-url, --backend-url, or both.')
  }

  let backendRelease = null

  if (backendUrl) {
    const backendHealth = await fetchJsonWithRetry(
      `${backendUrl}/api/v1/health`,
      'backend health endpoint',
      options.attempts,
      options.delayMs
    )

    if (!backendHealth || backendHealth.status !== 'ok') {
      throw new Error('Backend health endpoint did not report status=ok.')
    }

    backendRelease = await fetchJsonWithRetry(
      `${backendUrl}/api/v1/release`,
      'backend release endpoint',
      options.attempts,
      options.delayMs
    )

    assertBackendCapabilities(backendRelease)
  }

  if (frontendUrl) {
    await fetchTextWithRetry(
      `${frontendUrl}/login`,
      'frontend login route',
      options.attempts,
      options.delayMs
    )
  }

  process.stdout.write(
    [
      backendUrl && frontendUrl ? 'Release pair verified.' : 'Release target verified.',
      backendUrl ? `Backend: ${backendUrl}` : null,
      backendRelease ? `Backend git SHA: ${backendRelease.git_sha ?? 'unknown'}` : null,
      frontendUrl ? `Frontend: ${frontendUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  )
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
