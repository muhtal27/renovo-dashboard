import { NextResponse } from 'next/server'
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
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
