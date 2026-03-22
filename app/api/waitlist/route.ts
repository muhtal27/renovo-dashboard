import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

type WaitlistPayload = {
  name?: string
  email?: string
  agency?: string
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WaitlistPayload
    const name = payload.name?.trim() || ''
    const email = payload.email?.trim().toLowerCase() || ''
    const agency = payload.agency?.trim() || ''

    if (!name || !email || !agency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
