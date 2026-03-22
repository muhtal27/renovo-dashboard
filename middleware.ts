import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  parseSupabaseSessionCookie,
  serializeSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
  SUPABASE_SESSION_COOKIE_MAX_AGE,
} from '@/lib/supabase-session'

const PRIMARY_HOST = 'renovoai.co.uk'
const LEGACY_HOST = 'www.renovoai.co.uk'
const NOINDEX_HEADER_VALUE = 'noindex, nofollow'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function shouldNoIndex(pathname: string) {
  return (
    pathname === '/eot' ||
    pathname.startsWith('/eot/') ||
    pathname === '/calls' ||
    pathname === '/knowledge' ||
    pathname.startsWith('/cases/') ||
    pathname.startsWith('/api/')
  )
}

function shouldProtect(pathname: string) {
  return (
    pathname === '/eot' ||
    pathname.startsWith('/eot/') ||
    pathname === '/calls' ||
    pathname === '/knowledge' ||
    pathname.startsWith('/cases/')
  )
}

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
  if (shouldNoIndex(pathname)) {
    response.headers.set('X-Robots-Tag', NOINDEX_HEADER_VALUE)
  }
}

function syncSessionCookie(
  response: NextResponse,
  session: { access_token: string; refresh_token: string; expires_at?: number } | null,
  secure: boolean
) {
  if (!session) {
    response.cookies.set(SUPABASE_SESSION_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure,
    })
    return
  }

  response.cookies.set(SUPABASE_SESSION_COOKIE, serializeSupabaseSessionCookie(session), {
    path: '/',
    maxAge: SUPABASE_SESSION_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure,
  })
}

function redirectToLogin(request: NextRequest, secure: boolean, pathname: string) {
  const url = new URL(`/login?returnTo=${request.nextUrl.pathname}`, request.url)

  const response = NextResponse.redirect(url, 302)
  syncSessionCookie(response, null, secure)
  applyNoIndexHeader(pathname, response)
  return response
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')

  if (host === LEGACY_HOST) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = PRIMARY_HOST
    return NextResponse.redirect(url, 308)
  }

  const pathname = request.nextUrl.pathname
  const secure = request.nextUrl.protocol === 'https:'

  if (!shouldProtect(pathname)) {
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

  if (userResponse.error || !userResponse.data.user) {
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
