import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getOperatorProfileForUserId } from '@/lib/operator-session-server'

const resend = new Resend(process.env.RESEND_API_KEY)

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

type SendDraftBody = {
  landlordEmail: string
  landlordName: string
  tenantEmail: string
  tenantName: string
  propertyAddress: string
  caseRef: string
  reportUrl: string
}

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.VIEW_CASE)

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const userEmail = authResult.context.user.email
  if (!userEmail) {
    return NextResponse.json({ error: 'No email found for the logged-in user.' }, { status: 400 })
  }

  const profile = await getOperatorProfileForUserId(authResult.context.user.id)
  const userName = profile?.full_name ?? 'Renovo AI'

  let body: SendDraftBody
  try {
    body = (await request.json()) as SendDraftBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const {
    landlordEmail,
    landlordName,
    tenantEmail,
    tenantName,
    propertyAddress,
    caseRef,
    reportUrl,
  } = body

  if (!landlordEmail || !tenantEmail || !propertyAddress || !caseRef) {
    return NextResponse.json(
      { error: 'Missing required fields: landlordEmail, tenantEmail, propertyAddress, caseRef.' },
      { status: 400 }
    )
  }

  const fromAddress = `${userName} via Renovo AI <checkout@renovoai.co.uk>`
  const subject = `Checkout Report \u2014 ${propertyAddress}`

  try {
    const [landlordResult, tenantResult] = await Promise.all([
      resend.emails.send({
        from: fromAddress,
        to: landlordEmail,
        replyTo: userEmail,
        subject,
        html: [
          `<p>Dear ${landlordName || 'Landlord'},</p>`,
          `<p>Please find the checkout report for <strong>${propertyAddress}</strong> (Ref: ${caseRef}).</p>`,
          `<p>The full checkout report is available here:<br /><a href="${reportUrl}">${reportUrl}</a></p>`,
          `<p>This report contains the property condition assessment, recommended deductions, and supporting evidence. Please review the findings and let us know if you have any questions.</p>`,
          `<p>Kind regards,<br />${userName}</p>`,
        ].join('\n'),
      }),

      resend.emails.send({
        from: fromAddress,
        to: tenantEmail,
        replyTo: userEmail,
        subject,
        html: [
          `<p>Dear ${tenantName || 'Tenant'},</p>`,
          `<p>The checkout inspection for <strong>${propertyAddress}</strong> (Ref: ${caseRef}) has been completed.</p>`,
          `<p>A summary of any proposed deductions and tenant liabilities is available in the checkout report:<br /><a href="${reportUrl}">${reportUrl}</a></p>`,
          `<p>Please review the report carefully. If you have any queries or wish to dispute any items, please respond to this email.</p>`,
          `<p>Kind regards,<br />${userName}</p>`,
        ].join('\n'),
      }),
    ])

    const errors: string[] = []
    if (landlordResult.error) {
      errors.push(`Landlord email failed: ${landlordResult.error.message}`)
    }
    if (tenantResult.error) {
      errors.push(`Tenant email failed: ${tenantResult.error.message}`)
    }

    if (errors.length > 0) {
      console.error('send-draft partial failure', { caseId, errors })
      return NextResponse.json({ ok: false, errors }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      landlordEmailId: landlordResult.data?.id ?? null,
      tenantEmailId: tenantResult.data?.id ?? null,
    })
  } catch (error) {
    console.error('send-draft unexpected error', {
      caseId,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return NextResponse.json(
      { error: 'Failed to send emails. Please try again.' },
      { status: 500 }
    )
  }
}
