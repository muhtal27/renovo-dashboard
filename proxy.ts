import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  shouldNoIndexPath,
  shouldProtectPath,
} from '@/lib/operator-route-protection'
import {
  getOperatorSessionCookieOptions,
  LEGACY_SUPABASE_SESSION_COOKIE,
  parseSupabaseSessionCookie,
  serializeSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
} from '@/lib/supabase-session'

const PRIMARY_HOST = 'renovoai.co.uk'
const LEGACY_HOST = 'www.renovoai.co.uk'
const NOINDEX_HEADER_VALUE = 'noindex, nofollow'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createServerClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them before running middleware auth checks.'
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

function applyNoIndexHeader(pathname: string, response: NextResponse) {
  if (shouldNoIndexPath(pathname)) {
    response.headers.set('X-Robots-Tag', NOINDEX_HEADER_VALUE)
  }
}

function syncSessionCookie(
  response: NextResponse,
  session: { access_token: string; refresh_token?: string; expires_at?: number } | null,
  secure: boolean
) {
  if (!session) {
    const options = getOperatorSessionCookieOptions()
    response.cookies.set(SUPABASE_SESSION_COOKIE, '', {
      ...options,
      maxAge: 0,
    })
    response.cookies.set(LEGACY_SUPABASE_SESSION_COOKIE, '', {
      path: '/',
      sameSite: 'lax',
      secure,
      maxAge: 0,
    })
    return
  }

  response.cookies.set(SUPABASE_SESSION_COOKIE, serializeSupabaseSessionCookie(session), {
    ...getOperatorSessionCookieOptions(secure),
  })
  response.cookies.set(LEGACY_SUPABASE_SESSION_COOKIE, '', {
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0,
  })
}

function redirectToLogin(request: NextRequest, secure: boolean, pathname: string) {
  const url = new URL(`/login?returnTo=${request.nextUrl.pathname}`, request.url)

  const response = NextResponse.redirect(url, 302)
  syncSessionCookie(response, null, secure)
  applyNoIndexHeader(pathname, response)
  return response
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host')

  if (host === LEGACY_HOST) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = PRIMARY_HOST
    return NextResponse.redirect(url, 308)
  }

  const pathname = request.nextUrl.pathname
  const secure = request.nextUrl.protocol === 'https:'

  if (!shouldProtectPath(pathname)) {
    const response = NextResponse.next()
    applyNoIndexHeader(pathname, response)
    return response
  }

  const sessionCookie = parseSupabaseSessionCookie(request.cookies.get(SUPABASE_SESSION_COOKIE)?.value)

  if (!sessionCookie) {
    return redirectToLogin(request, secure, pathname)
  }

  const supabase = createServerClient()
  let activeSession = sessionCookie
  let userResponse = await supabase.auth.getUser(sessionCookie.access_token)

  if ((userResponse.error || !userResponse.data.user) && sessionCookie.refresh_token) {
    const refreshResponse = await supabase.auth.refreshSession({
      refresh_token: sessionCookie.refresh_token,
    })

    const refreshedSession = refreshResponse.data.session

    if (!refreshResponse.error && refreshedSession) {
      activeSession = {
        access_token: refreshedSession.access_token,
        refresh_token: refreshedSession.refresh_token,
        expires_at: refreshedSession.expires_at ?? undefined,
      }

      userResponse = await supabase.auth.getUser(activeSession.access_token)
    }
  }

  if (userResponse.error || !userResponse.data.user) {
    return redirectToLogin(request, secure, pathname)
  }

  const response = NextResponse.next()
  syncSessionCookie(response, activeSession, secure)
  applyNoIndexHeader(pathname, response)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
