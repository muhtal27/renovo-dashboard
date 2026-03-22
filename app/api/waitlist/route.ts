import { NextResponse } from 'next/server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

const WAITLIST_NOTE_TAG = 'public_waitlist_homepage_20260322'

type WaitlistPayload = {
  name?: string
  email?: string
  agency?: string
}

function appendWaitlistNote(notes: string | null | undefined) {
  const base = notes?.trim()

  if (!base) return 'Public homepage waitlist request | public_waitlist_homepage_20260322'
  if (base.includes(WAITLIST_NOTE_TAG)) return base

  return `${base} | Public homepage waitlist request | ${WAITLIST_NOTE_TAG}`
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
    const { data: existingRows, error: selectError } = await supabase
      .from('contacts')
      .select('id, full_name, company_name, notes')
      .eq('email', email)
      .limit(1)

    if (selectError) {
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }

    const existing = existingRows?.[0] ?? null

    if (existing) {
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          full_name: existing.full_name?.trim() ? existing.full_name : name,
          company_name: existing.company_name?.trim() ? existing.company_name : agency,
          notes: appendWaitlistNote(existing.notes),
          is_active: true,
        })
        .eq('id', existing.id)

      if (updateError) {
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // The current schema does not include a dedicated waitlist table, so homepage signups are
    // stored as contacts using the existing service-role client.
    const { error: insertError } = await supabase.from('contacts').insert({
      full_name: name,
      email,
      company_name: agency,
      role: 'applicant',
      contact_type: 'applicant',
      notes: appendWaitlistNote(null),
      is_active: true,
    })

    if (insertError) {
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
