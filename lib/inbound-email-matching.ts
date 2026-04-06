/**
 * Address matching logic for inbound email ingestion.
 *
 * Strategy:
 *   1. Try to match sender email against tenancy tenant_email
 *   2. Parse the email subject/body for a postcode or address
 *   3. Fuzzy-match against properties in the tenant's portfolio
 *   4. If a property is matched, find the active tenancy and open case
 *
 * Returns a match result with confidence scoring.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  extractDomain,
  normaliseAddressLine,
  normalisePostcode,
  parseFromField,
} from './inbound-email'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MatchResult = {
  matched: boolean
  confidence: 'high' | 'medium' | 'low' | 'none'
  property_id: string | null
  tenancy_id: string | null
  case_id: string | null
  /** If not matched, suggest tenancy IDs the operator can pick from */
  suggested_tenancy_ids: string[]
  match_reason: string | null
}

type PropertyRow = {
  id: string
  name: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
  tenant_id: string
}

type TenancyRow = {
  id: string
  property_id: string
  tenant_email: string | null
  tenant_name: string | null
  end_date: string | null
}

type CaseRow = {
  id: string
  tenancy_id: string
  status: string
}

// ---------------------------------------------------------------------------
// UK postcode regex — matches full or partial postcodes in text
// ---------------------------------------------------------------------------

const UK_POSTCODE_RE =
  /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/gi

/**
 * Extract postcodes from a text string.
 */
function extractPostcodes(text: string): string[] {
  const matches = text.match(UK_POSTCODE_RE)
  if (!matches) return []
  return [...new Set(matches.map(normalisePostcode))]
}

/**
 * Extract potential address lines from the subject line.
 * Looks for patterns like "Report for 14 Elm Street" or "14 Elm Street, London".
 */
function extractAddressHints(subject: string): string[] {
  const hints: string[] = []
  // Match "number + word(s)" patterns that look like street addresses
  const streetPattern = /\b(\d{1,4}\s+[A-Za-z][A-Za-z\s]{2,30})\b/g
  let m: RegExpExecArray | null
  while ((m = streetPattern.exec(subject)) !== null) {
    hints.push(normaliseAddressLine(m[1]))
  }
  return hints
}

// ---------------------------------------------------------------------------
// Main matching function
// ---------------------------------------------------------------------------

export async function matchInboundEmail(
  supabase: SupabaseClient,
  tenantId: string,
  fromAddress: string,
  subject: string,
  bodyText: string | null
): Promise<MatchResult> {
  const noMatch: MatchResult = {
    matched: false,
    confidence: 'none',
    property_id: null,
    tenancy_id: null,
    case_id: null,
    suggested_tenancy_ids: [],
    match_reason: null,
  }

  // -----------------------------------------------------------------------
  // 1. Load all properties and tenancies for this tenant
  // -----------------------------------------------------------------------

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name, address_line_1, address_line_2, city, postcode, tenant_id')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  if (!properties || properties.length === 0) return noMatch

  const { data: tenancies } = await supabase
    .from('tenancies')
    .select('id, property_id, tenant_email, tenant_name, end_date')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  if (!tenancies || tenancies.length === 0) return noMatch

  // -----------------------------------------------------------------------
  // 2. Try matching by sender email → tenancy.tenant_email
  // -----------------------------------------------------------------------

  const { email: senderEmail } = parseFromField(fromAddress)

  const emailMatchedTenancies = tenancies.filter(
    (t: TenancyRow) => t.tenant_email?.toLowerCase() === senderEmail
  )

  if (emailMatchedTenancies.length === 1) {
    const tenancy = emailMatchedTenancies[0] as TenancyRow
    const caseRow = await findOpenCase(supabase, tenancy.id)
    return {
      matched: true,
      confidence: 'high',
      property_id: tenancy.property_id,
      tenancy_id: tenancy.id,
      case_id: caseRow?.id ?? null,
      suggested_tenancy_ids: [],
      match_reason: `Sender email "${senderEmail}" matches tenancy tenant email`,
    }
  }

  // -----------------------------------------------------------------------
  // 3. Try matching by postcode in subject or body
  // -----------------------------------------------------------------------

  const searchText = [subject, bodyText ?? ''].join(' ')
  const postcodes = extractPostcodes(searchText)

  if (postcodes.length > 0) {
    const postcodeMatchedProperties = (properties as PropertyRow[]).filter(
      (p) => p.postcode && postcodes.includes(normalisePostcode(p.postcode))
    )

    if (postcodeMatchedProperties.length === 1) {
      const property = postcodeMatchedProperties[0]
      const tenancy = findBestTenancy(tenancies as TenancyRow[], property.id)
      const caseRow = tenancy ? await findOpenCase(supabase, tenancy.id) : null
      return {
        matched: true,
        confidence: 'medium',
        property_id: property.id,
        tenancy_id: tenancy?.id ?? null,
        case_id: caseRow?.id ?? null,
        suggested_tenancy_ids: [],
        match_reason: `Postcode "${postcodes[0]}" matched property "${property.name}"`,
      }
    }

    // Multiple postcode matches — refine with address hints
    if (postcodeMatchedProperties.length > 1) {
      const addressHints = extractAddressHints(subject)
      if (addressHints.length > 0) {
        const refined = postcodeMatchedProperties.filter((p) => {
          const normAddr = p.address_line_1 ? normaliseAddressLine(p.address_line_1) : ''
          return addressHints.some((hint) => normAddr.includes(hint) || hint.includes(normAddr))
        })
        if (refined.length === 1) {
          const property = refined[0]
          const tenancy = findBestTenancy(tenancies as TenancyRow[], property.id)
          const caseRow = tenancy ? await findOpenCase(supabase, tenancy.id) : null
          return {
            matched: true,
            confidence: 'medium',
            property_id: property.id,
            tenancy_id: tenancy?.id ?? null,
            case_id: caseRow?.id ?? null,
            suggested_tenancy_ids: [],
            match_reason: `Postcode + address hint matched property "${property.name}"`,
          }
        }
      }

      // Return suggestions for the operator
      const suggestedTenancyIds = postcodeMatchedProperties
        .map((p) => findBestTenancy(tenancies as TenancyRow[], p.id))
        .filter((t): t is TenancyRow => t !== null)
        .map((t) => t.id)

      return {
        ...noMatch,
        suggested_tenancy_ids: suggestedTenancyIds,
        match_reason: `Multiple properties matched postcode — needs operator review`,
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. Try matching by address line in subject
  // -----------------------------------------------------------------------

  const addressHints = extractAddressHints(subject)
  if (addressHints.length > 0) {
    const addressMatched = (properties as PropertyRow[]).filter((p) => {
      const normAddr = p.address_line_1 ? normaliseAddressLine(p.address_line_1) : ''
      return addressHints.some((hint) => normAddr.includes(hint) || hint.includes(normAddr))
    })

    if (addressMatched.length === 1) {
      const property = addressMatched[0]
      const tenancy = findBestTenancy(tenancies as TenancyRow[], property.id)
      const caseRow = tenancy ? await findOpenCase(supabase, tenancy.id) : null
      return {
        matched: true,
        confidence: 'low',
        property_id: property.id,
        tenancy_id: tenancy?.id ?? null,
        case_id: caseRow?.id ?? null,
        suggested_tenancy_ids: [],
        match_reason: `Address hint in subject matched property "${property.name}"`,
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Try matching sender domain to known inventory provider domains
  // -----------------------------------------------------------------------
  // Some inventory companies send from consistent domains. If only one
  // property has an active case, we can suggest it.

  const senderDomain = extractDomain(senderEmail)
  const inventoryDomains = [
    'helloreport.co.uk',
    'nolettinggo.co.uk',
    'inventorybase.co.uk',
    'inventoryhive.co.uk',
  ]

  if (inventoryDomains.includes(senderDomain)) {
    // Suggest all tenancies with open cases
    const activeTenancyIds = tenancies
      .filter((t: TenancyRow) => !t.end_date || new Date(t.end_date) >= new Date())
      .map((t: TenancyRow) => t.id)

    if (activeTenancyIds.length > 0) {
      return {
        ...noMatch,
        suggested_tenancy_ids: activeTenancyIds.slice(0, 10),
        match_reason: `Known inventory provider domain "${senderDomain}" — needs operator review`,
      }
    }
  }

  return noMatch
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the best tenancy for a property — prefer one without an end_date (active)
 * or with the latest end_date.
 */
function findBestTenancy(tenancies: TenancyRow[], propertyId: string): TenancyRow | null {
  const forProperty = tenancies.filter((t) => t.property_id === propertyId)
  if (forProperty.length === 0) return null
  // Prefer active (no end_date)
  const active = forProperty.find((t) => !t.end_date)
  if (active) return active
  // Otherwise latest end_date
  return forProperty.sort((a, b) => {
    const da = a.end_date ? new Date(a.end_date).getTime() : 0
    const db = b.end_date ? new Date(b.end_date).getTime() : 0
    return db - da
  })[0]
}

/**
 * Find an open case for a tenancy.
 */
async function findOpenCase(
  supabase: SupabaseClient,
  tenancyId: string
): Promise<CaseRow | null> {
  const { data } = await supabase
    .from('cases')
    .select('id, tenancy_id, status')
    .eq('tenancy_id', tenancyId)
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(1)

  return (data?.[0] as CaseRow) ?? null
}
