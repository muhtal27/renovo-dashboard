import { NextResponse } from 'next/server'
import { isReasonableText, isValidEmail, rateLimitRequest } from '@/lib/public-route-guard'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

const ENQUIRY_TYPES = new Set([
  'Early access',
  'Partnerships',
  'Investor enquiry',
  'General enquiry',
])

const PORTFOLIO_SIZES = new Set([
  'Solo / independent',
  '1-100 properties',
  '100-500 properties',
  '500+ properties',
  '',
])

type ContactPayload = {
  fullName?: string
  workEmail?: string
  companyName?: string
  enquiryType?: string
  portfolioSize?: string | null
  message?: string
  website?: string
  sourcePage?: string
}

export async function POST(request: Request) {
  const rateLimit = rateLimitRequest(request, {
    key: 'public-contact',
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
    const payload = (await request.json()) as ContactPayload
    const fullName = payload.fullName?.trim() || ''
    const workEmail = payload.workEmail?.trim().toLowerCase() || ''
    const companyName = payload.companyName?.trim() || null
    const enquiryType = payload.enquiryType?.trim() || ''
    const portfolioSize = payload.portfolioSize?.trim() || null
    const message = payload.message?.trim() || ''
    const website = payload.website?.trim() || ''
    const sourcePage = payload.sourcePage?.trim() || '/contact'

    if (website) {
      return NextResponse.json({ success: true })
    }

    if (!fullName || !workEmail || !enquiryType || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidEmail(workEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!isReasonableText(fullName, { min: 2, max: 120 })) {
      return NextResponse.json({ error: 'Invalid full name' }, { status: 400 })
    }

    if (companyName && !isReasonableText(companyName, { min: 2, max: 160 })) {
      return NextResponse.json({ error: 'Invalid company name' }, { status: 400 })
    }

    if (!isReasonableText(message, { min: 10, max: 4000 })) {
      return NextResponse.json({ error: 'Message length is invalid' }, { status: 400 })
    }

    if (sourcePage.length > 200) {
      return NextResponse.json({ error: 'Invalid source page' }, { status: 400 })
    }

    if (!ENQUIRY_TYPES.has(enquiryType)) {
      return NextResponse.json({ error: 'Invalid enquiry type' }, { status: 400 })
    }

    if (portfolioSize && !PORTFOLIO_SIZES.has(portfolioSize)) {
      return NextResponse.json({ error: 'Invalid portfolio size' }, { status: 400 })
    }

    const supabase = getSupabaseServiceRoleClient()
    const { error } = await supabase.from('contact_submissions').insert({
      full_name: fullName,
      work_email: workEmail,
      company_name: companyName,
      enquiry_type: enquiryType,
      portfolio_size: portfolioSize,
      message,
      source_page: sourcePage,
    })

    if (error) {
      return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
