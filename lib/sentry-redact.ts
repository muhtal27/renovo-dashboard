import type { Event, EventHint } from '@sentry/nextjs'

const SENSITIVE_HEADERS = new Set([
  'cookie',
  'set-cookie',
  'authorization',
  'proxy-authorization',
  'x-supabase-auth',
  'x-api-key',
])

const SENSITIVE_QUERY_KEYS = new Set([
  'access_token',
  'refresh_token',
  'id_token',
  'session_id',
  'apikey',
  'code',
])

function redactHeaders(headers: Record<string, unknown> | undefined) {
  if (!headers) return
  for (const key of Object.keys(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      headers[key] = '[redacted]'
    }
  }
}

function redactUrl(url: string | undefined) {
  if (!url || !url.includes('?')) return url
  try {
    const u = new URL(url, 'http://placeholder.invalid')
    let changed = false
    for (const key of Array.from(u.searchParams.keys())) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
        u.searchParams.set(key, '[redacted]')
        changed = true
      }
    }
    return changed ? u.toString().replace('http://placeholder.invalid', '') : url
  } catch {
    return url
  }
}

export function redactSentryEvent<T extends Event>(event: T, _hint?: EventHint): T {
  const req = event.request
  if (req) {
    redactHeaders(req.headers as Record<string, unknown> | undefined)
    if (typeof req.url === 'string') req.url = redactUrl(req.url) ?? req.url
    if (req.cookies) req.cookies = { redacted: '[redacted]' }
  }

  if (Array.isArray(event.breadcrumbs)) {
    for (const crumb of event.breadcrumbs) {
      if (!crumb.data) continue
      if (typeof crumb.data.url === 'string') {
        crumb.data.url = redactUrl(crumb.data.url)
      }
      if (crumb.data.headers) {
        redactHeaders(crumb.data.headers as Record<string, unknown>)
      }
    }
  }

  return event
}
