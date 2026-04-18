import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getOperatorProfileForUserId } from '@/lib/operator-session-server'
import { captureServerEvent, EVENTS } from '@/lib/analytics-server'

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

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.EDIT_CASE)

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

  if (!propertyAddress || !caseRef) {
    return NextResponse.json(
      { error: 'Missing required fields: propertyAddress, caseRef.' },
      { status: 400 }
    )
  }

  if (!landlordEmail && !tenantEmail) {
    return NextResponse.json(
      { error: 'At least one recipient email (landlord or tenant) is required.' },
      { status: 400 }
    )
  }

  if (reportUrl) {
    try {
      const parsed = new URL(reportUrl)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return NextResponse.json({ error: 'reportUrl must be an HTTP(S) URL.' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'reportUrl is not a valid URL.' }, { status: 400 })
    }
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? 'renovoai.co.uk'
  const fromAddress = `${userName} via Renovo AI <checkout@${fromDomain}>`
  const subject = `Checkout Report \u2014 ${propertyAddress}`

  try {
    const emailPromises: Promise<{ data: { id: string } | null; error: { message: string } | null }>[] = []
    const recipients: string[] = []

    if (landlordEmail) {
      recipients.push('landlord')
      emailPromises.push(
        resend.emails.send({
          from: fromAddress,
          to: landlordEmail,
          replyTo: userEmail,
          subject,
          html: [
            `<p>Dear ${esc(landlordName || 'Landlord')},</p>`,
            `<p>Please find the checkout report for <strong>${esc(propertyAddress)}</strong> (Ref: ${esc(caseRef)}).</p>`,
            reportUrl ? `<p>The full checkout report is available here:<br /><a href="${esc(reportUrl)}">${esc(reportUrl)}</a></p>` : '',
            `<p>This report contains the property condition assessment, recommended deductions, and supporting evidence. Please review the findings and let us know if you have any questions.</p>`,
            `<p>Kind regards,<br />${esc(userName)}</p>`,
          ].filter(Boolean).join('\n'),
        }),
      )
    }

    if (tenantEmail) {
      recipients.push('tenant')
      emailPromises.push(
        resend.emails.send({
          from: fromAddress,
          to: tenantEmail,
          replyTo: userEmail,
          subject,
          html: [
            `<p>Dear ${esc(tenantName || 'Tenant')},</p>`,
            `<p>The checkout inspection for <strong>${esc(propertyAddress)}</strong> (Ref: ${esc(caseRef)}) has been completed.</p>`,
            reportUrl ? `<p>A summary of any proposed deductions and tenant liabilities is available in the checkout report:<br /><a href="${esc(reportUrl)}">${esc(reportUrl)}</a></p>` : '',
            `<p>Please review the report carefully. If you have any queries or wish to dispute any items, please respond to this email.</p>`,
            `<p>Kind regards,<br />${esc(userName)}</p>`,
          ].filter(Boolean).join('\n'),
        }),
      )
    }

    const results = await Promise.all(emailPromises)

    const errors: string[] = []
    results.forEach((result, i) => {
      if (result.error) {
        errors.push(`${recipients[i]} email failed: ${result.error.message}`)
      }
    })

    if (errors.length > 0 && errors.length === results.length) {
      console.error('send-draft all emails failed', { caseId, errors })
      return NextResponse.json({ ok: false, errors }, { status: 502 })
    }

    if (errors.length > 0) {
      console.warn('send-draft partial failure', { caseId, errors })
    }

    const sent = recipients.filter((_, i) => !results[i].error)
    await captureServerEvent({
      event: EVENTS.SUBMISSION_SENT,
      userId: authResult.context.user.id,
      tenantId: authResult.context.tenantId,
      properties: {
        case_id: caseId,
        case_ref: caseRef,
        recipients: sent.join(','),
        partial_failure: errors.length > 0,
      },
    })

    return NextResponse.json({
      ok: true,
      sent,
      errors: errors.length > 0 ? errors : undefined,
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
