import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  getRequestIp,
  isReasonableText,
  isValidEmail,
  rateLimitRequest,
} from '@/lib/public-route-guard'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { getPostHogClient } from '@/lib/posthog-server'
import {
  DEMO_ACCESS_COOKIE,
  DEMO_ACCESS_TTL_SECONDS,
  hashIpForLogging,
  issueDemoAccessToken,
} from '@/lib/demo-gate'

type DemoAccessPayload = {
  email?: string
  company?: string
  firstName?: string
  sourcePage?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  website?: string
}

function optionalText(value: string | undefined, max: number): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.length > max) return null
  return trimmed
}

export async function POST(request: Request) {
  const rateLimit = rateLimitRequest(request, {
    key: 'public-demo-access',
    limit: 8,
    windowMs: 10 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    )
  }

  let payload: DemoAccessPayload
  try {
    payload = (await request.json()) as DemoAccessPayload
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Honeypot — spam bots fill every field. Pretend success without persisting.
  if (payload.website?.trim()) {
    return NextResponse.json({ success: true })
  }

  const email = payload.email?.trim().toLowerCase() || ''
  if (!isValidEmail(email) || !isReasonableText(email, { min: 5, max: 254 })) {
    return NextResponse.json({ error: 'Enter a valid work email.' }, { status: 400 })
  }

  const company = optionalText(payload.company, 160)
  const firstName = optionalText(payload.firstName, 120)
  const sourcePage = optionalText(payload.sourcePage, 200) ?? '/demo'
  const utmSource = optionalText(payload.utmSource, 120)
  const utmMedium = optionalText(payload.utmMedium, 120)
  const utmCampaign = optionalText(payload.utmCampaign, 120)

  if (payload.company !== undefined && payload.company.trim() && !company) {
    return NextResponse.json({ error: 'Company name is too long.' }, { status: 400 })
  }

  const ip = getRequestIp(request)
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null

  try {
    const supabase = getSupabaseServiceRoleClient()
    const { error } = await supabase.from('demo_access_submissions').insert({
      email,
      company,
      first_name: firstName,
      source_page: sourcePage,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      ip_hash: ip === 'unknown' ? null : hashIpForLogging(ip),
      user_agent: userAgent,
    })

    if (error) {
      return NextResponse.json({ error: 'Could not record access.' }, { status: 500 })
    }
  } catch {
    return NextResponse.json({ error: 'Could not record access.' }, { status: 500 })
  }

  const token = issueDemoAccessToken(email)

  const cookieStore = await cookies()
  cookieStore.set(DEMO_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_ACCESS_TTL_SECONDS,
  })

  getPostHogClient().capture({
    distinctId: email,
    event: 'demo_access_granted',
    properties: {
      company,
      source_page: sourcePage,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    },
  })

  return NextResponse.json({ success: true })
}
