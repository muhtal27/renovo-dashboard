/**
 * POST /api/inbound/email
 *
 * Webhook endpoint for Resend inbound emails.
 * Receives emails sent to *@reports.renovoai.co.uk, matches them to
 * a tenant config, runs address matching, stores attachments in
 * Supabase Storage, and either auto-attaches to a case or queues
 * for operator review.
 *
 * Resend signs webhooks with Svix — we verify the signature before
 * processing.
 */

import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { matchInboundEmail } from '@/lib/inbound-email-matching'
import {
  extractAddressPrefix,
  parseFromField,
  type ResendInboundPayload,
} from '@/lib/inbound-email'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = () => {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing RESEND_WEBHOOK_SECRET')
  return secret
}

const STORAGE_BUCKET = 'inbound-attachments'

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Verify Svix webhook signature
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 })
  }

  let payload: { type: string; data: ResendInboundPayload }

  try {
    const rawBody = await request.text()
    const wh = new Webhook(WEBHOOK_SECRET())
    payload = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof payload
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Only process inbound email events
  if (payload.type !== 'email.received') {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const email = payload.data
  const supabase = getSupabaseServiceRoleClient()

  // 2. Idempotency — reject duplicates
  const { data: existing } = await supabase
    .from('inbound_email_log')
    .select('id')
    .eq('resend_email_id', email.email_id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ ok: true, duplicate: true })
  }

  // 3. Find which tenant config matches the "to" address
  const toAddress = email.to[0] ?? ''
  const prefix = extractAddressPrefix(toAddress)

  const { data: config } = await supabase
    .from('inbound_email_configs')
    .select('*')
    .eq('address_prefix', prefix)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (!config) {
    // No config found — log as failed
    await supabase.from('inbound_email_log').insert({
      resend_email_id: email.email_id,
      from_address: email.from,
      to_address: toAddress,
      subject: email.subject ?? null,
      status: 'failed',
      attachment_count: email.attachments?.length ?? 0,
      error_message: `No active config for address prefix "${prefix}"`,
    })
    return NextResponse.json({ ok: true, status: 'no_config' })
  }

  const tenantId = config.tenant_id

  // 4. Optional: check sender domain allowlist
  const { email: senderEmail } = parseFromField(email.from)
  if (config.allowed_sender_domains && config.allowed_sender_domains.length > 0) {
    const senderDomain = senderEmail.split('@')[1] ?? ''
    if (!config.allowed_sender_domains.includes(senderDomain)) {
      await supabase.from('inbound_email_log').insert({
        tenant_id: tenantId,
        resend_email_id: email.email_id,
        from_address: email.from,
        to_address: toAddress,
        subject: email.subject ?? null,
        status: 'failed',
        attachment_count: email.attachments?.length ?? 0,
        error_message: `Sender domain "${senderDomain}" not in allowed list`,
      })
      return NextResponse.json({ ok: true, status: 'blocked_sender' })
    }
  }

  // 5. Upload attachments to Supabase Storage
  const attachmentUrls: string[] = []
  for (const attachment of email.attachments ?? []) {
    try {
      const buffer = Buffer.from(attachment.content, 'base64')
      const path = `${tenantId}/${email.email_id}/${attachment.filename}`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, buffer, {
          contentType: attachment.content_type,
          upsert: false,
        })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path)
        attachmentUrls.push(urlData.publicUrl)
      }
    } catch {
      // Log but don't fail the whole webhook
      console.error(`[inbound-email] Failed to upload attachment: ${attachment.filename}`)
    }
  }

  // 6. Run address matching
  const matchResult = await matchInboundEmail(
    supabase,
    tenantId,
    email.from,
    email.subject ?? '',
    email.text ?? null
  )

  // 7. Insert log entry
  const logStatus = matchResult.matched ? 'matched' : 'unmatched'

  const { data: logEntry } = await supabase
    .from('inbound_email_log')
    .insert({
      tenant_id: tenantId,
      resend_email_id: email.email_id,
      from_address: email.from,
      to_address: toAddress,
      subject: email.subject ?? null,
      status: logStatus,
      matched_property_id: matchResult.property_id,
      matched_tenancy_id: matchResult.tenancy_id,
      matched_case_id: matchResult.case_id,
      attachment_count: email.attachments?.length ?? 0,
    })
    .select('id')
    .single()

  // 8. If matched with a case, attach documents
  if (matchResult.matched && matchResult.case_id && attachmentUrls.length > 0) {
    for (const url of attachmentUrls) {
      const filename = url.split('/').pop() ?? 'attachment'
      await supabase.from('checkout_documents').insert({
        case_id: matchResult.case_id,
        tenant_id: tenantId,
        document_type: 'inventory_report',
        document_name: filename,
        file_path: url,
        source: 'email',
      })
    }
  }

  // 9. If unmatched, add to operator queue
  if (!matchResult.matched && logEntry) {
    await supabase.from('inbound_unmatched_queue').insert({
      email_log_id: logEntry.id,
      tenant_id: tenantId,
      from_address: email.from,
      subject: email.subject ?? null,
      attachment_urls: attachmentUrls,
      suggested_tenancy_ids: matchResult.suggested_tenancy_ids,
    })
  }

  return NextResponse.json({
    ok: true,
    status: logStatus,
    match_confidence: matchResult.confidence,
    case_id: matchResult.case_id,
  })
}
