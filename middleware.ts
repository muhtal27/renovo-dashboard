import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'renovo-operator-session'

/**
 * Protected operator routes — unauthenticated users are redirected
 * to /login at the edge, avoiding a full server round-trip.
 */
const PROTECTED_ROUTES = new Set([
  '/admin',
  '/checkouts',
  '/tenancy',
  '/disputes',
  '/recommendations',
  '/deposit-scheme',
  '/reports',
  '/calls',
  '/guidance',
  '/settings',
])

const PROTECTED_PREFIXES = [
  '/checkouts/',
  '/cases/',
  '/operator/cases/',
  '/settings/',
  '/teams/',
]

function isProtected(pathname: string) {
  return (
    PROTECTED_ROUTES.has(pathname) ||
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only check protected operator routes
  if (!isProtected(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie — fast edge check, no DB call
  const session = request.cookies.get(SESSION_COOKIE)

  if (!session?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cookie exists — let the server validate it fully
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next (static files, images)
     * - api routes (handled separately)
     * - public files (favicon, icons, etc.)
     */
    '/((?!_next|api|favicon\\.ico|icons|renovo-ai-icon\\.svg|sw\\.js|demo\\.html|.*\\..*).*)',
  ],
}
