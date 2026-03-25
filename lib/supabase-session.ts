import type { AuthSession } from '@supabase/supabase-js'

export const SUPABASE_SESSION_COOKIE = 'renovo-sb-session'
export const SUPABASE_SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

type MinimalSessionCookie = {
  access_token: string
  refresh_token?: string
  expires_at?: AuthSession['expires_at']
}

export function toMinimalSupabaseSession(session: Partial<AuthSession> | null | undefined) {
  if (
    !session ||
    typeof session.access_token !== 'string'
  ) {
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

function writeCookie(name: string, value: string) {
  if (!canUseBrowserStorage()) return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${value}; Path=/; Max-Age=${SUPABASE_SESSION_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
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

export function syncBrowserSupabaseSessionCookie(session: Partial<AuthSession> | null | undefined) {
  if (!canUseBrowserStorage()) return

  const minimalSession = toMinimalSupabaseSession(session)

  if (!minimalSession) {
    clearCookie(SUPABASE_SESSION_COOKIE)
    return
  }

  writeCookie(SUPABASE_SESSION_COOKIE, serializeSupabaseSessionCookie(minimalSession))
}

export function createBrowserSupabaseStorage(storageKey: string) {
  return {
    getItem(key: string) {
      if (!canUseBrowserStorage()) return null

      const localValue = window.localStorage.getItem(key)
      if (localValue) return localValue

      if (key !== storageKey) return null

      const cookieSession = parseSupabaseSessionCookie(readCookie(SUPABASE_SESSION_COOKIE))
      return cookieSession ? JSON.stringify(cookieSession) : null
    },
    setItem(key: string, value: string) {
      if (!canUseBrowserStorage()) return

      window.localStorage.setItem(key, value)

      if (key !== storageKey) return

      const minimalSession = toMinimalSessionCookie(value)

      if (minimalSession) {
        syncBrowserSupabaseSessionCookie(minimalSession)
      } else {
        clearCookie(SUPABASE_SESSION_COOKIE)
      }
    },
    removeItem(key: string) {
      if (!canUseBrowserStorage()) return

      window.localStorage.removeItem(key)

      if (key === storageKey) {
        clearCookie(SUPABASE_SESSION_COOKIE)
      }
    },
  }
}

export function getSupabaseStorageKey(supabaseUrl: string) {
  return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
}
