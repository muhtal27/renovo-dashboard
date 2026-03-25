import { NextResponse } from 'next/server'
import { isReasonableText, isValidEmail, rateLimitRequest } from '@/lib/public-route-guard'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

type WaitlistPayload = {
  name?: string
  email?: string
  agency?: string
  website?: string
}

export async function POST(request: Request) {
  const rateLimit = rateLimitRequest(request, {
    key: 'public-waitlist',
    limit: 5,
    windowMs: 10 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      }
    )
  }

  try {
    const payload = (await request.json()) as WaitlistPayload
    const name = payload.name?.trim() || ''
    const email = payload.email?.trim().toLowerCase() || ''
    const agency = payload.agency?.trim() || ''
    const website = payload.website?.trim() || ''

    if (website) {
      return NextResponse.json({ success: true })
    }

    if (!name || !email || !agency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!isReasonableText(name, { min: 2, max: 120 })) {
      return NextResponse.json({ error: 'Invalid full name' }, { status: 400 })
    }

    if (!isReasonableText(agency, { min: 2, max: 160 })) {
      return NextResponse.json({ error: 'Invalid agency name' }, { status: 400 })
    }

    const supabase = getSupabaseServiceRoleClient()
    const { error: upsertError } = await supabase
      .from('waitlist_signups')
      .upsert(
        {
          full_name: name,
          email,
          agency_name: agency,
          status: 'new',
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )

    if (upsertError) {
      // Fallback: if waitlist_signups doesn't have a unique email constraint yet,
      // try a simple insert
      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert({
          full_name: name,
          email,
          agency_name: agency,
          status: 'new',
        })

      if (insertError) {
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
