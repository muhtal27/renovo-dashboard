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

  const { email: senderEmail } = parseFromField(fromAddress)

  // -----------------------------------------------------------------------
  // 1. Try matching by sender email → tenancy.tenant_email (narrowest query first)
  // -----------------------------------------------------------------------

  const { data: emailMatchedTenancies } = await supabase
    .from('tenancies')
    .select('id, property_id, tenant_email, tenant_name, end_date')
    .eq('tenant_id', tenantId)
    .eq('tenant_email', senderEmail)
    .is('deleted_at', null)
    .limit(10)

  if (emailMatchedTenancies && emailMatchedTenancies.length === 1) {
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
  // 2. Extract matching signals from the email content
  // -----------------------------------------------------------------------

  const searchText = [subject, bodyText ?? ''].join(' ')
  const postcodes = extractPostcodes(searchText)
  const addressHints = extractAddressHints(subject)

  // -----------------------------------------------------------------------
  // 3. Try matching by postcode — query only properties with those postcodes
  // -----------------------------------------------------------------------

  if (postcodes.length > 0) {
    const { data: postcodeProperties } = await supabase
      .from('properties')
      .select('id, name, address_line_1, postcode')
      .eq('tenant_id', tenantId)
      .in('postcode', postcodes)
      .is('deleted_at', null)
      .limit(50)

    const postcodeMatchedProperties = (postcodeProperties ?? []) as PropertyRow[]

    if (postcodeMatchedProperties.length === 1) {
      const property = postcodeMatchedProperties[0]
      const tenancy = await findBestTenancyForProperty(supabase, tenantId, property.id)
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
    if (postcodeMatchedProperties.length > 1 && addressHints.length > 0) {
      const refined = postcodeMatchedProperties.filter((p) => {
        const normAddr = p.address_line_1 ? normaliseAddressLine(p.address_line_1) : ''
        return addressHints.some((hint) => normAddr.includes(hint) || hint.includes(normAddr))
      })
      if (refined.length === 1) {
        const property = refined[0]
        const tenancy = await findBestTenancyForProperty(supabase, tenantId, property.id)
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

    if (postcodeMatchedProperties.length > 1) {
      const suggestedTenancies = await Promise.all(
        postcodeMatchedProperties.slice(0, 10).map((p) =>
          findBestTenancyForProperty(supabase, tenantId, p.id)
        )
      )
      const suggestedTenancyIds = suggestedTenancies
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
  // 4. Try matching by address line in subject (broader query, with limit)
  // -----------------------------------------------------------------------

  if (addressHints.length > 0) {
    const { data: allProperties } = await supabase
      .from('properties')
      .select('id, name, address_line_1, postcode')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .limit(2000)

    const addressMatched = (allProperties ?? []).filter((p) => {
      const normAddr = p.address_line_1 ? normaliseAddressLine(p.address_line_1) : ''
      return addressHints.some((hint) => normAddr.includes(hint) || hint.includes(normAddr))
    })

    if (addressMatched.length === 1) {
      const property = addressMatched[0]
      const tenancy = await findBestTenancyForProperty(supabase, tenantId, property.id)
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

  const senderDomain = extractDomain(senderEmail)
  const inventoryDomains = [
    'helloreport.co.uk',
    'nolettinggo.co.uk',
    'inventorybase.co.uk',
    'inventoryhive.co.uk',
  ]

  if (inventoryDomains.includes(senderDomain)) {
    const { data: activeTenancies } = await supabase
      .from('tenancies')
      .select('id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('end_date', new Date().toISOString())
      .limit(10)

    const activeTenancyIds = (activeTenancies ?? []).map((t: { id: string }) => t.id)

    if (activeTenancyIds.length > 0) {
      return {
        ...noMatch,
        suggested_tenancy_ids: activeTenancyIds,
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
 * Find the best tenancy for a property via a targeted DB query.
 * Prefers active tenancies (no end_date) or the one with the latest end_date.
 */
async function findBestTenancyForProperty(
  supabase: SupabaseClient,
  tenantId: string,
  propertyId: string
): Promise<TenancyRow | null> {
  const { data } = await supabase
    .from('tenancies')
    .select('id, property_id, tenant_email, tenant_name, end_date')
    .eq('tenant_id', tenantId)
    .eq('property_id', propertyId)
    .is('deleted_at', null)
    .order('end_date', { ascending: false, nullsFirst: true })
    .limit(1)

  return (data?.[0] as TenancyRow) ?? null
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
