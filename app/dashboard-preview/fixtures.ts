import type { EotTenancyListItem, EotCaseListItem } from '@/lib/eot-types'

// Fixture data for the /dashboard-preview route — mirrors demo.html counts so
// visual diffs against the prototype compare the same numbers.
//
// Demo targets (prototype ref: private-content/demo.html renderDashboard):
//   Active Tenancies:   11
//   Open Cases:         9 (one per status for pipeline coverage)
//   Total Deposits:     £13,550
//   Claim Pipeline:     £1,650  (ready_for_claim + submitted deposit_amount)
//   Deadline Alert:     1 tenancy ending within 7 days
//
// Today's baseline is 2026-04-24 (see preview-client.tsx for the clock pin).

const TODAY_ISO = '2026-04-24T09:00:00.000Z'
const today = new Date(TODAY_ISO)

function isoDaysFromToday(days: number): string {
  const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  return d.toISOString()
}

type FixtureSeed = {
  id: string
  ref: string
  street: string
  city: string
  postcode: string
  tenant: string
  deposit: number
  endOffsetDays: number | null
}

const TENANCY_SEEDS: FixtureSeed[] = [
  { id: 'ten-001', ref: 'CHK-2026-001', street: '12 Rosewood Lane',   city: 'Manchester', postcode: 'M14 5PP', tenant: 'Marcus Reid',    deposit: 1200, endOffsetDays: 5 },
  { id: 'ten-002', ref: 'CHK-2026-002', street: '48 Orchard Gardens',  city: 'Leeds',      postcode: 'LS6 2HL', tenant: 'Priya Shah',     deposit: 1300, endOffsetDays: 21 },
  { id: 'ten-003', ref: 'CHK-2026-003', street: '7 Beechcroft Drive',  city: 'Bristol',    postcode: 'BS8 4DP', tenant: 'Tom Fletcher',   deposit: 1100, endOffsetDays: 38 },
  { id: 'ten-004', ref: 'CHK-2026-004', street: '23 Juniper Mews',     city: 'Birmingham', postcode: 'B15 2TY', tenant: 'Omar Rashid',    deposit: 1500, endOffsetDays: 82 },
  { id: 'ten-005', ref: 'CHK-2026-005', street: '61 Willow Bank',      city: 'Nottingham', postcode: 'NG7 1DR', tenant: 'Sophie Grant',   deposit: 1250, endOffsetDays: 110 },
  { id: 'ten-006', ref: 'CHK-2026-006', street: '9 Ashford Court',     city: 'Sheffield',  postcode: 'S10 2QA', tenant: 'Naomi Clarke',   deposit: 850,  endOffsetDays: 145 },
  { id: 'ten-007', ref: 'CHK-2026-007', street: '34 Primrose Avenue',  city: 'Liverpool',  postcode: 'L17 8XU', tenant: 'David Okafor',   deposit: 800,  endOffsetDays: 170 },
  { id: 'ten-008', ref: 'CHK-2026-008', street: '5 Mulberry Place',    city: 'Newcastle',  postcode: 'NE2 4RF', tenant: 'Hannah Bell',    deposit: 1050, endOffsetDays: 205 },
  { id: 'ten-009', ref: 'CHK-2026-009', street: '78 Linden Terrace',   city: 'Cardiff',    postcode: 'CF11 9AX',tenant: 'Ravi Iyengar',   deposit: 1350, endOffsetDays: 240 },
  { id: 'ten-010', ref: 'CHK-2026-010', street: '2 Holloway Gardens',  city: 'Southampton',postcode: 'SO17 1BF',tenant: 'Lily Gardner',   deposit: 1200, endOffsetDays: 280 },
  { id: 'ten-011', ref: 'CHK-2026-011', street: '16 Maple Heights',    city: 'Edinburgh',  postcode: 'EH9 2ED', tenant: 'Fergus Campbell',deposit: 950,  endOffsetDays: 320 },
]

export const FIXTURE_TENANCIES: EotTenancyListItem[] = TENANCY_SEEDS.map((seed, i) => ({
  id: seed.id,
  property: {
    id: `prop-${i + 1}`,
    name: `${seed.street}, ${seed.city}`,
    reference: seed.ref,
    address_line_1: seed.street,
    address_line_2: null,
    city: seed.city,
    postcode: seed.postcode,
  },
  tenant_name: seed.tenant,
  tenant_email: `${seed.tenant.toLowerCase().replace(/\s+/g, '.')}@example.com`,
  landlord_name: null,
  start_date: isoDaysFromToday(-365),
  end_date: seed.endOffsetDays == null ? null : isoDaysFromToday(seed.endOffsetDays),
  deposit_amount: String(seed.deposit),
  deposit_scheme: 'tds',
  case_id: null,
  case_status: null,
  created_at: isoDaysFromToday(-365),
  updated_at: isoDaysFromToday(-1),
}))

// One case per status, covers the full pipeline legend.
const CASE_SEEDS: Array<{
  id: string
  ref: string
  tenancyIndex: number
  status: EotCaseListItem['status']
  priority: EotCaseListItem['priority']
  deposit: number
  activityOffsetMinutes: number
}> = [
  { id: 'case-001', ref: 'CHK-2026-001', tenancyIndex: 0, status: 'collecting_evidence', priority: 'high',   deposit: 1200, activityOffsetMinutes: -30 },
  { id: 'case-002', ref: 'CHK-2026-002', tenancyIndex: 1, status: 'analysis',            priority: 'medium', deposit: 1300, activityOffsetMinutes: -90 },
  { id: 'case-003', ref: 'CHK-2026-003', tenancyIndex: 2, status: 'review',              priority: 'medium', deposit: 1100, activityOffsetMinutes: -180 },
  { id: 'case-004', ref: 'CHK-2026-004', tenancyIndex: 3, status: 'draft_sent',          priority: 'low',    deposit: 1500, activityOffsetMinutes: -2880 },
  { id: 'case-005', ref: 'CHK-2026-005', tenancyIndex: 4, status: 'submitted',           priority: 'medium', deposit: 800,  activityOffsetMinutes: -4320 },
  { id: 'case-006', ref: 'CHK-2026-006', tenancyIndex: 5, status: 'disputed',            priority: 'high',   deposit: 1050, activityOffsetMinutes: -300 },
  { id: 'case-007', ref: 'CHK-2026-007', tenancyIndex: 6, status: 'resolved',            priority: 'low',    deposit: 1350, activityOffsetMinutes: -10080 },
  { id: 'case-008', ref: 'CHK-2026-008', tenancyIndex: 7, status: 'ready_for_claim',     priority: 'medium', deposit: 850,  activityOffsetMinutes: -360 },
  { id: 'case-009', ref: 'CHK-2026-009', tenancyIndex: 8, status: 'draft',               priority: 'low',    deposit: 1200, activityOffsetMinutes: -15 },
]

export const FIXTURE_CASES: EotCaseListItem[] = CASE_SEEDS.map((seed) => {
  const t = FIXTURE_TENANCIES[seed.tenancyIndex]
  return {
    id: seed.id,
    property: t.property,
    tenant_name: t.tenant_name,
    landlord_name: t.landlord_name,
    deposit_amount: String(seed.deposit),
    deposit_scheme: 'tds',
    status: seed.status,
    assigned_to: null,
    priority: seed.priority,
    issue_count: 0,
    evidence_count: 0,
    last_activity_at: new Date(today.getTime() + seed.activityOffsetMinutes * 60 * 1000).toISOString(),
  }
})
