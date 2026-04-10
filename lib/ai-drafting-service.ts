import 'server-only'

import OpenAI from 'openai'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import type { AIDraftType } from '@/lib/operator-checkout-workspace-types'

type CaseContext = {
  propertyAddress: string
  tenantName: string
  tenantEmail: string
  tenancyStart: string
  tenancyEnd: string
  tenancyDurationDays: number | null
  depositAmount: string
  depositScheme: string
  claimTotal: string
  negotiationStatus: string
  agencyName: string
  defects: {
    room: string
    item: string
    type: string
    description: string
    liability: string
    cost: string
    aiReasoning: string
    condition: string | null
  }[]
  issues: {
    title: string
    description: string
    severity: string
    status: string
    recommendationDecision: string | null
    recommendationRationale: string | null
    recommendationCost: string | null
  }[]
  claimBreakdown: { title: string; amount: string }[]
}

function str(v: unknown, fallback = 'Not recorded'): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

type Row = Record<string, unknown>

async function loadCaseContext(caseId: string, tenantId: string): Promise<CaseContext> {
  const supabase = getSupabaseServiceRoleClient()

  // Load the case
  const { data: caseRow, error: caseErr } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (caseErr) throw new Error(`Failed to load case: ${caseErr.message}`)
  if (!caseRow) throw new Error('Case not found')

  const tenancyId = caseRow.tenancy_id as string | null

  // Load tenancy + property, checkout case, claims, issues in parallel
  const [tenancyResult, checkoutResult, claimsResult, issuesResult] = await Promise.all([
    tenancyId
      ? supabase.from('tenancies').select('*').eq('id', tenancyId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('checkout_cases')
      .select('*')
      .eq('case_id', caseId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('claims')
      .select('*')
      .eq('case_id', caseId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('issues')
      .select('*, recommendations(*)')
      .eq('case_id', caseId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null),
  ])

  const tenancy = tenancyResult.data as Row | null
  const checkoutCase = checkoutResult.data as Row | null
  const claim = ((claimsResult.data as Row[] | null) ?? [])[0] ?? null

  // Load property if tenancy has one
  const propertyId = tenancy?.property_id as string | null
  let property: Row | null = null
  if (propertyId) {
    const { data } = await supabase.from('properties').select('*').eq('id', propertyId).maybeSingle()
    property = data as Row | null
  }

  // Build address
  const address = property
    ? [property.address_line_1, property.address_line_2, property.city, property.postcode]
        .filter((p): p is string => typeof p === 'string' && p.length > 0)
        .join(', ')
    : str(checkoutCase?.property_address)

  // Load defects and rooms if checkout case exists
  const checkoutCaseId = checkoutCase?.id as string | null
  let defects: Row[] = []
  let rooms: Row[] = []
  if (checkoutCaseId) {
    const [defectsResult, roomsResult] = await Promise.all([
      supabase
        .from('checkout_defects')
        .select('*')
        .eq('case_id', checkoutCaseId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true }),
      supabase
        .from('checkout_rooms')
        .select('*')
        .eq('case_id', checkoutCaseId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true }),
    ])
    defects = (defectsResult.data ?? []) as Row[]
    rooms = (roomsResult.data ?? []) as Row[]
  }

  const roomMap = new Map(rooms.map((r) => [r.id as string, str(r.room_name, 'Room')]))

  // Tenancy duration
  const startDate = tenancy?.start_date ? str(tenancy.start_date) : null
  const endDate = tenancy?.end_date ? str(tenancy.end_date) : null
  let tenancyDurationDays: number | null = null
  if (startDate && endDate && startDate !== 'Not recorded' && endDate !== 'Not recorded') {
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
    tenancyDurationDays = Math.round(diff / (1000 * 60 * 60 * 24))
  }

  // Deposit
  let deposit: number | null = num(checkoutCase?.deposit_held)
  if (deposit === null) deposit = num(tenancy?.deposit_amount)

  // Issues with recommendations
  const rawIssues = (issuesResult.data ?? []) as Row[]
  const issues = rawIssues
    .filter((i) => !i.deleted_at)
    .map((i) => {
      const recs = Array.isArray(i.recommendations) ? (i.recommendations as Row[]) : []
      const rec = recs.find((r) => !r.deleted_at) ?? null
      return {
        title: str(i.title, ''),
        description: str(i.description, ''),
        severity: str(i.severity, 'medium'),
        status: str(i.status, 'open'),
        recommendationDecision: rec ? str(rec.decision, undefined) : null,
        recommendationRationale: rec ? str(rec.rationale, undefined) : null,
        recommendationCost: rec && num(rec.estimated_cost) !== null
          ? (num(rec.estimated_cost) as number).toFixed(2)
          : null,
      }
    })

  // Claim breakdown
  const claimBreakdown = Array.isArray(claim?.breakdown)
    ? (claim.breakdown as Row[]).map((item) => ({
        title: str(item.title, 'Item'),
        amount: str(item.amount, '0.00'),
      }))
    : []

  return {
    propertyAddress: address,
    tenantName: str(tenancy?.tenant_name),
    tenantEmail: str(tenancy?.tenant_email),
    tenancyStart: startDate && startDate !== 'Not recorded' ? startDate : 'Not recorded',
    tenancyEnd: endDate && endDate !== 'Not recorded' ? endDate : 'Not recorded',
    tenancyDurationDays,
    depositAmount: deposit !== null ? deposit.toFixed(2) : 'Not recorded',
    depositScheme: str(checkoutCase?.deposit_scheme),
    claimTotal: claim && num(claim.total_amount) !== null
      ? (num(claim.total_amount) as number).toFixed(2)
      : '0.00',
    negotiationStatus: str(checkoutCase?.negotiation_status, 'pending'),
    agencyName: str(checkoutCase?.agency_name),
    defects: defects.map((d) => {
      const liability = str(d.operator_liability, '') || str(d.ai_suggested_liability, 'unassigned')
      const cost = num(d.cost_adjusted) ?? num(d.cost_estimate) ?? 0
      return {
        room: roomMap.get(d.room_id as string) ?? 'Unknown room',
        item: str(d.item_name, 'Item'),
        type: str(d.defect_type, 'maintenance'),
        description: str(d.description, ''),
        liability,
        cost: cost.toFixed(2),
        aiReasoning: str(d.ai_reasoning, ''),
        condition: typeof d.condition_current === 'string' ? d.condition_current : null,
      }
    }),
    issues,
    claimBreakdown,
  }
}

function formatContextForPrompt(ctx: CaseContext): string {
  const lines = [
    `Property: ${ctx.propertyAddress}`,
    `Tenant: ${ctx.tenantName}`,
    `Tenant email: ${ctx.tenantEmail}`,
    `Tenancy: ${ctx.tenancyStart} to ${ctx.tenancyEnd}`,
    ctx.tenancyDurationDays ? `Tenancy duration: ${ctx.tenancyDurationDays} days` : 'Tenancy duration: Unknown',
    `Deposit held: \u00a3${ctx.depositAmount}`,
    `Deposit scheme: ${ctx.depositScheme}`,
    `Total claim: \u00a3${ctx.claimTotal}`,
    `Negotiation status: ${ctx.negotiationStatus}`,
    `Agency: ${ctx.agencyName}`,
  ]

  if (ctx.defects.length > 0) {
    lines.push(`\nDEFECTS IDENTIFIED (${ctx.defects.length} items):`)
    ctx.defects.forEach((d, i) => {
      lines.push(
        `  ${i + 1}. [${d.room}] ${d.item} (${d.type})\n` +
        `     Description: ${d.description}\n` +
        `     Liability: ${d.liability} | Estimated cost: \u00a3${d.cost}\n` +
        `     AI reasoning: ${d.aiReasoning || 'N/A'}`
      )
    })
  }

  if (ctx.issues.length > 0) {
    lines.push(`\nISSUES (${ctx.issues.length} items):`)
    ctx.issues.forEach((issue, i) => {
      lines.push(
        `  ${i + 1}. ${issue.title} [severity: ${issue.severity}, status: ${issue.status}]\n` +
        `     ${issue.description || 'No description'}\n` +
        `     Recommendation: ${issue.recommendationDecision || 'None'}` +
        ` \u2014 ${issue.recommendationRationale || 'N/A'}` +
        ` (est. \u00a3${issue.recommendationCost || '0.00'})`
      )
    })
  }

  if (ctx.claimBreakdown.length > 0) {
    lines.push('\nCLAIM BREAKDOWN:')
    ctx.claimBreakdown.forEach((item) => {
      lines.push(`  - ${item.title}: \u00a3${item.amount}`)
    })
  }

  return lines.join('\n')
}

const SYSTEM_PROMPTS: Record<AIDraftType, string> = {
  liability_assessment:
    'You are Renovo\'s end-of-tenancy liability assessment specialist for UK lettings. ' +
    'Produce a professional, formal liability assessment document suitable for a letting ' +
    'agency operator to review and share with landlords. ' +
    'Apply UK tenancy deposit protection legislation and TDS/DPS adjudication precedent. ' +
    'For each defect, clearly state whether the tenant, landlord, or both bear liability ' +
    'and explain why, referencing fair wear and tear, betterment, tenancy duration, and ' +
    'the condition at check-in vs check-out. ' +
    'Be conservative, proportionate, and defensible. Use clear, professional English. ' +
    'Return strict JSON only.',
  proposed_charges:
    'You are Renovo\'s end-of-tenancy charges specialist for UK lettings. ' +
    'Produce a structured proposed charges document with clear line items, ' +
    'amounts, and justifications. Each charge must be defensible under UK deposit ' +
    'protection adjudication standards. ' +
    'Apply betterment, proportionality, and realistic UK market rates. ' +
    'Do not inflate costs. Separate cleaning charges from damage charges. ' +
    'Include a total, deposit balance calculation, and amount to return to tenant. ' +
    'Return strict JSON only.',
  tenant_negotiation:
    'You are Renovo\'s tenant communication specialist for UK letting agencies. ' +
    'Draft a professional, firm but fair email to the tenant regarding end-of-tenancy ' +
    'charges. The tone should be respectful, transparent, and professional. ' +
    'Clearly explain each charge, why it is being proposed, and the tenant\'s right ' +
    'to dispute via the deposit protection scheme. ' +
    'Include the total amount, deposit held, and proposed return amount. ' +
    'Reference the relevant deposit scheme and adjudication process. ' +
    'The letter should encourage resolution but make the agency\'s position clear. ' +
    'Return strict JSON only.',
  combined_report:
    'You are Renovo\'s end-of-tenancy reporting specialist for UK letting agencies. ' +
    'Produce a comprehensive, professional end-of-tenancy report that combines all ' +
    'identified issues into a clear, presentable document. ' +
    'The report should be suitable for sharing with landlords and for use in deposit ' +
    'scheme adjudication if required. ' +
    'Structure it with clear sections: executive summary, property details, tenancy ' +
    'details, defects by room, financial summary, and recommendation. ' +
    'Be thorough but concise. Use professional language appropriate for the UK ' +
    'lettings industry. Return strict JSON only.',
}

const USER_PROMPT_PREFIX: Record<AIDraftType, string> = {
  liability_assessment: 'Generate a formal liability assessment for this end-of-tenancy case.',
  proposed_charges: 'Generate a proposed charges schedule for this end-of-tenancy case.',
  tenant_negotiation: 'Draft a tenant negotiation email for this end-of-tenancy case.',
  combined_report: 'Generate a comprehensive end-of-tenancy report for this case.',
}

const JSON_SCHEMAS: Record<AIDraftType, string> = {
  liability_assessment: `Respond with JSON: {"summary":"...","property_address":"...","tenant_name":"...","tenancy_dates":"...","issues":[{"room":"...","item":"...","defect_type":"...","description":"...","liability":"tenant|landlord|shared","reasoning":"...","confidence":"high|medium|low"}],"conclusion":"..."}`,
  proposed_charges: `Respond with JSON: {"summary":"...","total_amount":"...","deposit_held":"...","return_to_tenant":"...","charges":[{"item":"...","room":"...","category":"...","description":"...","liability":"...","amount":"...","justification":"..."}],"notes":"..."}`,
  tenant_negotiation: `Respond with JSON: {"subject":"...","salutation":"...","opening":"...","body":"...","itemised_charges":"...","closing":"...","sign_off":"..."}`,
  combined_report: `Respond with JSON: {"title":"...","executive_summary":"...","property_details":"...","tenancy_details":"...","sections":[{"heading":"...","content":"..."}],"financial_summary":"...","recommendation":"..."}`,
}

type AnyParsed = Record<string, unknown>

function formatLiabilityAssessment(result: AnyParsed): string {
  const issues = Array.isArray(result.issues) ? (result.issues as AnyParsed[]) : []
  const lines = [
    'LIABILITY ASSESSMENT',
    '='.repeat(60),
    '',
    `Property: ${result.property_address ?? ''}`,
    `Tenant: ${result.tenant_name ?? ''}`,
    `Tenancy period: ${result.tenancy_dates ?? ''}`,
    '',
    'SUMMARY',
    '-'.repeat(40),
    String(result.summary ?? ''),
    '',
  ]

  if (issues.length > 0) {
    lines.push('DETAILED LIABILITY ANALYSIS')
    lines.push('-'.repeat(40))
    issues.forEach((issue, i) => {
      lines.push(
        `\n${i + 1}. ${issue.item} \u2014 ${issue.room}`,
        `   Type: ${issue.defect_type}`,
        `   Description: ${issue.description}`,
        `   Liability: ${String(issue.liability ?? '').toUpperCase()}`,
        `   Confidence: ${issue.confidence}`,
        `   Reasoning: ${issue.reasoning}`,
      )
    })
    lines.push('')
  }

  lines.push('CONCLUSION', '-'.repeat(40), String(result.conclusion ?? ''))
  return lines.join('\n')
}

function formatProposedCharges(result: AnyParsed): string {
  const charges = Array.isArray(result.charges) ? (result.charges as AnyParsed[]) : []
  const lines = [
    'PROPOSED CHARGES SCHEDULE',
    '='.repeat(60),
    '',
    String(result.summary ?? ''),
    '',
    'CHARGES',
    '-'.repeat(40),
  ]

  charges.forEach((charge, i) => {
    lines.push(
      `\n${i + 1}. ${charge.item} \u2014 ${charge.room}`,
      `   Category: ${charge.category}`,
      `   Description: ${charge.description}`,
      `   Liability: ${charge.liability}`,
      `   Amount: \u00a3${charge.amount}`,
      `   Justification: ${charge.justification}`,
    )
  })

  lines.push(
    '',
    'FINANCIAL SUMMARY',
    '-'.repeat(40),
    `Total charges: \u00a3${result.total_amount}`,
    `Deposit held: \u00a3${result.deposit_held}`,
    `Return to tenant: \u00a3${result.return_to_tenant}`,
    '',
    'NOTES',
    '-'.repeat(40),
    String(result.notes ?? ''),
  )
  return lines.join('\n')
}

function formatTenantNegotiation(result: AnyParsed): string {
  return [
    `Subject: ${result.subject}`,
    '',
    String(result.salutation ?? ''),
    '',
    String(result.opening ?? ''),
    '',
    String(result.body ?? ''),
    '',
    'Itemised Charges:',
    String(result.itemised_charges ?? ''),
    '',
    String(result.closing ?? ''),
    '',
    String(result.sign_off ?? ''),
  ].join('\n')
}

function formatCombinedReport(result: AnyParsed): string {
  const sections = Array.isArray(result.sections) ? (result.sections as AnyParsed[]) : []
  const lines = [
    String(result.title ?? 'END-OF-TENANCY REPORT').toUpperCase(),
    '='.repeat(60),
    '',
    'EXECUTIVE SUMMARY',
    '-'.repeat(40),
    String(result.executive_summary ?? ''),
    '',
    'PROPERTY DETAILS',
    '-'.repeat(40),
    String(result.property_details ?? ''),
    '',
    'TENANCY DETAILS',
    '-'.repeat(40),
    String(result.tenancy_details ?? ''),
    '',
  ]

  sections.forEach((section) => {
    lines.push(
      String(section.heading ?? '').toUpperCase(),
      '-'.repeat(40),
      String(section.content ?? ''),
      '',
    )
  })

  lines.push(
    'FINANCIAL SUMMARY',
    '-'.repeat(40),
    String(result.financial_summary ?? ''),
    '',
    'RECOMMENDATION',
    '-'.repeat(40),
    String(result.recommendation ?? ''),
  )
  return lines.join('\n')
}

const FORMATTERS: Record<AIDraftType, (result: AnyParsed) => string> = {
  liability_assessment: formatLiabilityAssessment,
  proposed_charges: formatProposedCharges,
  tenant_negotiation: formatTenantNegotiation,
  combined_report: formatCombinedReport,
}

const DRAFT_TITLES: Record<AIDraftType, string> = {
  liability_assessment: 'Liability Assessment',
  proposed_charges: 'Proposed Charges',
  tenant_negotiation: 'Tenant Negotiation Letter',
  combined_report: 'End-of-Tenancy Report',
}

export async function generateAIDraft(
  caseId: string,
  tenantId: string,
  draftType: AIDraftType,
): Promise<{ draftId: string; title: string; content: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const context = await loadCaseContext(caseId, tenantId)
  const formattedContext = formatContextForPrompt(context)

  const client = new OpenAI({ apiKey, timeout: 90_000 })

  const systemPrompt = SYSTEM_PROMPTS[draftType]
  const userPrompt = `${USER_PROMPT_PREFIX[draftType]}\n\n${JSON_SCHEMAS[draftType]}\n\n${formattedContext}`

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    temperature: 0.2,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('OpenAI returned an empty response.')

  let parsed: AnyParsed
  try {
    parsed = JSON.parse(raw) as AnyParsed
  } catch {
    throw new Error('OpenAI returned invalid JSON.')
  }

  const formatter = FORMATTERS[draftType]
  const content = formatter(parsed)
  const title = DRAFT_TITLES[draftType]

  // Save to Supabase (soft-delete old draft, insert new)
  const supabase = getSupabaseServiceRoleClient()
  const now = new Date().toISOString()

  // Soft-delete existing draft of the same type
  await supabase
    .from('ai_drafts')
    .update({ deleted_at: now, updated_at: now })
    .eq('case_id', caseId)
    .eq('tenant_id', tenantId)
    .eq('draft_type', draftType)
    .is('deleted_at', null)

  // Insert new draft
  const { data: draft, error: insertErr } = await supabase
    .from('ai_drafts')
    .insert({
      case_id: caseId,
      tenant_id: tenantId,
      draft_type: draftType,
      title,
      content,
      metadata: {},
      generated_at: now,
    })
    .select('id')
    .single()

  if (insertErr) throw new Error(`Failed to save draft: ${insertErr.message}`)

  return { draftId: draft.id as string, title, content }
}
