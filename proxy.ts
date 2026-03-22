import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PRIMARY_HOST = 'renovoai.co.uk'
const LEGACY_HOST = 'www.renovoai.co.uk'
const NOINDEX_HEADER_VALUE = 'noindex, nofollow'

function shouldNoIndex(pathname: string) {
  return (
    pathname === '/eot' ||
    pathname === '/calls' ||
    pathname === '/knowledge' ||
    pathname.startsWith('/cases/') ||
    pathname.startsWith('/api/')
  )
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')

  if (host === LEGACY_HOST) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = PRIMARY_HOST
    return NextResponse.redirect(url, 308)
  }

  const response = NextResponse.next()

  if (shouldNoIndex(request.nextUrl.pathname)) {
    response.headers.set('X-Robots-Tag', NOINDEX_HEADER_VALUE)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
