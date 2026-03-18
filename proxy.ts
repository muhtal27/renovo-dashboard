import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PRIMARY_HOST = 'renovoai.co.uk'
const LEGACY_HOST = 'www.renovoai.co.uk'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')

  if (host === LEGACY_HOST) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = PRIMARY_HOST
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
