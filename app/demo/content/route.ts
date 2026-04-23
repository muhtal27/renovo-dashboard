import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { DEMO_ACCESS_COOKIE, verifyDemoAccessToken } from '@/lib/demo-gate'

// Force Node runtime — edge doesn't have fs.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(DEMO_ACCESS_COOKIE)?.value
  const payload = verifyDemoAccessToken(token)

  if (!payload) {
    // Send unauthenticated visitors back to the gate page rather than leaking
    // a 401 — looks like a plain navigation to a user in the iframe.
    return NextResponse.redirect(new URL('/demo', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'), {
      status: 302,
    })
  }

  const filePath = path.join(process.cwd(), 'private-content', 'demo.html')
  let html: string
  try {
    html = await readFile(filePath, 'utf8')
  } catch {
    return new NextResponse('Demo content unavailable.', { status: 500 })
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      // Only our own /demo page should frame this.
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
