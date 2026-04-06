/**
 * Shared types and helpers for the inbound email ingestion system.
 *
 * Inbound domain: in.renovoai.co.uk
 * Webhook provider: Resend (inbound emails)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the Resend inbound email webhook payload */
export type ResendInboundPayload = {
  /** Unique Resend email ID — used for idempotency */
  email_id: string
  from: string
  to: string[]
  subject: string
  text?: string
  html?: string
  /** RFC-2822 date string */
  date?: string
  attachments: ResendAttachment[]
  headers: Array<{ name: string; value: string }>
}

export type ResendAttachment = {
  filename: string
  content_type: string
  /** Base64-encoded content */
  content: string
}

/** Database row: inbound_email_configs */
export type InboundEmailConfig = {
  id: string
  tenant_id: string
  address_prefix: string
  is_active: boolean
  allowed_sender_domains: string[]
  created_at: string
  updated_at: string
}

/** Database row: inbound_email_log */
export type InboundEmailLog = {
  id: string
  tenant_id: string | null
  resend_email_id: string
  from_address: string
  to_address: string
  subject: string | null
  received_at: string
  status: 'matched' | 'unmatched' | 'failed' | 'duplicate'
  matched_property_id: string | null
  matched_tenancy_id: string | null
  matched_case_id: string | null
  attachment_count: number
  error_message: string | null
  created_at: string
}

/** Database row: inbound_unmatched_queue */
export type InboundUnmatchedQueueItem = {
  id: string
  email_log_id: string
  tenant_id: string
  from_address: string
  subject: string | null
  attachment_urls: string[]
  suggested_tenancy_ids: string[]
  resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  resolved_tenancy_id: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the local part (prefix) from a "to" address.
 * e.g. "reports+acme@in.renovoai.co.uk" → "reports+acme"
 */
export function extractAddressPrefix(toAddress: string): string {
  const [local] = toAddress.split('@')
  return local?.toLowerCase().trim() ?? ''
}

/**
 * Extract the domain from an email address.
 * e.g. "agent@lettingco.co.uk" → "lettingco.co.uk"
 */
export function extractDomain(email: string): string {
  const parts = email.split('@')
  return parts[1]?.toLowerCase().trim() ?? ''
}

/**
 * Parse the `from` field which can be "Name <email>" or just "email".
 */
export function parseFromField(from: string): { name: string | null; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim(), email: match[2].toLowerCase().trim() }
  }
  return { name: null, email: from.toLowerCase().trim() }
}

/**
 * Normalise a UK postcode for fuzzy matching.
 * Removes all spaces and lowercases.
 */
export function normalisePostcode(postcode: string): string {
  return postcode.replace(/\s+/g, '').toLowerCase()
}

/**
 * Normalise an address line for comparison.
 * Lowercases, trims, strips common abbreviations.
 */
export function normaliseAddressLine(line: string): string {
  return line
    .toLowerCase()
    .trim()
    .replace(/\bstreet\b/g, 'st')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bclose\b/g, 'cl')
    .replace(/\bcrescent\b/g, 'cres')
    .replace(/[,.']/g, '')
    .replace(/\s+/g, ' ')
}
