import type { AuthSession } from '@supabase/supabase-js'

export const SUPABASE_SESSION_COOKIE = 'renovo-operator-session'
export const LEGACY_SUPABASE_SESSION_COOKIE = 'renovo-sb-session'
export const SUPABASE_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 14

export type MinimalSessionCookie = {
  access_token: string
  refresh_token?: string
  expires_at?: AuthSession['expires_at']
}

export function toMinimalSupabaseSession(session: Partial<AuthSession> | null | undefined) {
  if (!session || typeof session.access_token !== 'string') {
    return null
  }

  return {
    access_token: session.access_token,
    refresh_token: typeof session.refresh_token === 'string' ? session.refresh_token : undefined,
    expires_at: typeof session.expires_at === 'number' ? session.expires_at : undefined,
  } satisfies MinimalSessionCookie
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readCookie(name: string) {
  if (!canUseBrowserStorage()) return null

  const prefix = `${name}=`
  const parts = document.cookie.split(';').map((item) => item.trim())
  const match = parts.find((part) => part.startsWith(prefix))

  return match ? match.slice(prefix.length) : null
}

function clearCookie(name: string) {
  if (!canUseBrowserStorage()) return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

function toMinimalSessionCookie(value: string): MinimalSessionCookie | null {
  try {
    return toMinimalSupabaseSession(JSON.parse(value) as Partial<AuthSession> | null)
  } catch {
    return null
  }
}

export function parseSupabaseSessionCookie(cookieValue: string | null | undefined) {
  if (!cookieValue) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue)) as MinimalSessionCookie | null

    if (!parsed || typeof parsed.access_token !== 'string') {
      return null
    }

    return {
      access_token: parsed.access_token,
      refresh_token: typeof parsed.refresh_token === 'string' ? parsed.refresh_token : undefined,
      expires_at: typeof parsed.expires_at === 'number' ? parsed.expires_at : undefined,
    }
  } catch {
    return null
  }
}

export function serializeSupabaseSessionCookie(session: MinimalSessionCookie) {
  return encodeURIComponent(JSON.stringify(session))
}

export function shouldUseSecureCookies() {
  return process.env.NODE_ENV === 'production' && process.env.VERCEL !== undefined
}

export function getOperatorSessionCookieOptions(secure = shouldUseSecureCookies()) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    maxAge: SUPABASE_SESSION_COOKIE_MAX_AGE,
  }
}

export function getSupabaseStorageKey(supabaseUrl: string) {
  return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
}

export function clearLegacySupabaseBrowserAuthArtifacts(supabaseUrl?: string | null) {
  if (!canUseBrowserStorage()) return

  if (supabaseUrl) {
    try {
      window.localStorage.removeItem(getSupabaseStorageKey(supabaseUrl))
    } catch {
      // Ignore browser storage failures during cleanup.
    }
  }

  clearCookie(LEGACY_SUPABASE_SESSION_COOKIE)
}

export function readLegacyBrowserSupabaseSession(supabaseUrl?: string | null) {
  if (!canUseBrowserStorage()) return null

  if (supabaseUrl) {
    try {
      const localValue = window.localStorage.getItem(getSupabaseStorageKey(supabaseUrl))
      if (localValue) {
        return toMinimalSessionCookie(localValue)
      }
    } catch {
      // Ignore browser storage failures during migration.
    }
  }

  return parseSupabaseSessionCookie(readCookie(LEGACY_SUPABASE_SESSION_COOKIE))
}
