/**
 * Mock data fixtures for report tabs that don't yet have real backend data.
 * Isolated from production logic — swap these out when Supabase tables are ready.
 */

// ── AI Accuracy ──────────────────────────────────────────────────────

export type AiAccuracyCategory = {
  type: string
  total: number
  agreed: number
  overridden: number
  agreePct: number
}

export type AiAccuracyTrend = {
  month: string
  agreePct: number
}

export type AiAccuracySummary = {
  overallAgreementRate: number
  totalDecisions: number
  totalOverrides: number
  avgConfidence: number
  improvementTrend: number
  categories: AiAccuracyCategory[]
  monthlyTrend: AiAccuracyTrend[]
}

export const MOCK_AI_ACCURACY: AiAccuracySummary = {
  overallAgreementRate: 87,
  totalDecisions: 156,
  totalOverrides: 20,
  avgConfidence: 82,
  improvementTrend: 4.2,
  categories: [
    { type: 'cleaning', total: 64, agreed: 58, overridden: 6, agreePct: 91 },
    { type: 'damage', total: 52, agreed: 43, overridden: 9, agreePct: 83 },
    { type: 'maintenance', total: 28, agreed: 25, overridden: 3, agreePct: 89 },
    { type: 'fair_wear', total: 12, agreed: 10, overridden: 2, agreePct: 83 },
  ],
  monthlyTrend: [
    { month: 'Nov', agreePct: 79 },
    { month: 'Dec', agreePct: 82 },
    { month: 'Jan', agreePct: 84 },
    { month: 'Feb', agreePct: 86 },
    { month: 'Mar', agreePct: 88 },
    { month: 'Apr', agreePct: 91 },
  ],
}

// ── SLA Metrics ─────────────────────────────────────────────────────

export type SlaTarget = {
  metric: string
  label: string
  targetDays: number
  actualDays: number
  casesInTarget: number
  totalCases: number
  compliancePct: number
}

export type SlaSummary = {
  overallCompliance: number
  totalCasesMet: number
  totalCasesMissed: number
  pipelineValue: number
  projectedRecovery: number
  recoveryRate: number
  targets: SlaTarget[]
  weeklyCompliance: Array<{ week: string; pct: number }>
}

export const MOCK_SLA: SlaSummary = {
  overallCompliance: 92,
  totalCasesMet: 138,
  totalCasesMissed: 12,
  pipelineValue: 47850,
  projectedRecovery: 38280,
  recoveryRate: 80,
  targets: [
    {
      metric: 'first_contact',
      label: 'First Contact',
      targetDays: 2,
      actualDays: 1.4,
      casesInTarget: 142,
      totalCases: 150,
      compliancePct: 95,
    },
    {
      metric: 'draft_sent',
      label: 'Draft Sent',
      targetDays: 10,
      actualDays: 8.2,
      casesInTarget: 128,
      totalCases: 140,
      compliancePct: 91,
    },
    {
      metric: 'resolution',
      label: 'Resolution',
      targetDays: 30,
      actualDays: 24.6,
      casesInTarget: 108,
      totalCases: 120,
      compliancePct: 90,
    },
    {
      metric: 'scheme_submission',
      label: 'Scheme Submission',
      targetDays: 5,
      actualDays: 3.8,
      casesInTarget: 95,
      totalCases: 100,
      compliancePct: 95,
    },
  ],
  weeklyCompliance: [
    { week: 'W1', pct: 88 },
    { week: 'W2', pct: 90 },
    { week: 'W3', pct: 91 },
    { week: 'W4', pct: 93 },
    { week: 'W5', pct: 94 },
    { week: 'W6', pct: 92 },
  ],
}

// ── Recovery Analytics ──────────────────────────────────────────────

export type RecoveryByScheme = {
  scheme: string
  claimed: number
  awarded: number
  cases: number
  successRate: number
}

export const MOCK_RECOVERY_BY_SCHEME: RecoveryByScheme[] = [
  { scheme: 'SafeDeposits Scotland', claimed: 12400, awarded: 10850, cases: 14, successRate: 88 },
  { scheme: 'mydeposits Scotland', claimed: 8200, awarded: 6560, cases: 9, successRate: 80 },
  { scheme: 'DPS', claimed: 5600, awarded: 4760, cases: 7, successRate: 85 },
  { scheme: 'mydeposits', claimed: 3200, awarded: 2400, cases: 4, successRate: 75 },
]

// ── Case Workspace Defects ──────────────────────────────────────────

export type WorkspaceDefect = {
  id: string
  title: string
  description: string
  room: string
  type: 'damage' | 'cleaning' | 'maintenance'
  severity: 'high' | 'medium' | 'low'
  checkinCondition: string
  checkoutCondition: string
  aiLiability: 'tenant' | 'shared' | 'landlord'
  operatorLiability: 'tenant' | 'shared' | 'landlord' | null
  estimatedCost: number
  adjustedCost: number | null
  excluded: boolean
  reviewed: boolean
  rationale: string
  aiConfidence: number
  expectedLifespan: number | null
  ageAtCheckout: number | null
  evidenceQuality: 'good' | 'fair' | 'poor'
}

export const MOCK_DEFECTS: WorkspaceDefect[] = [
  {
    id: 'D1',
    title: 'Carpet staining in living room',
    description: 'Multiple dark stains on light-coloured carpet near seating area, not present in check-in report.',
    room: 'Living Room',
    type: 'damage',
    severity: 'high',
    checkinCondition: 'Good',
    checkoutCondition: 'Poor',
    aiLiability: 'tenant',
    operatorLiability: null,
    estimatedCost: 320,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'Staining inconsistent with fair wear and tear. Check-in report confirms good condition. Carpet age (3 years) within expected lifespan (8 years).',
    aiConfidence: 94,
    expectedLifespan: 8,
    ageAtCheckout: 3,
    evidenceQuality: 'good',
  },
  {
    id: 'D2',
    title: 'Kitchen deep clean required',
    description: 'Grease build-up on extractor hood, behind cooker, and inside oven. General kitchen hygiene below standard.',
    room: 'Kitchen',
    type: 'cleaning',
    severity: 'medium',
    checkinCondition: 'Good',
    checkoutCondition: 'Fair',
    aiLiability: 'tenant',
    operatorLiability: null,
    estimatedCost: 180,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'Cleaning obligation specified in tenancy agreement. Condition at checkout does not meet the standard documented at check-in.',
    aiConfidence: 91,
    expectedLifespan: null,
    ageAtCheckout: null,
    evidenceQuality: 'good',
  },
  {
    id: 'D3',
    title: 'Bedroom wall marks and scuffs',
    description: 'Multiple scuff marks and picture hook holes on bedroom walls.',
    room: 'Master Bedroom',
    type: 'damage',
    severity: 'low',
    checkinCondition: 'Excellent',
    checkoutCondition: 'Fair',
    aiLiability: 'shared',
    operatorLiability: null,
    estimatedCost: 120,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'Some marks are consistent with fair wear and tear (minor scuffs). Picture hook holes exceed what is considered reasonable use. Shared liability recommended.',
    aiConfidence: 72,
    expectedLifespan: 5,
    ageAtCheckout: 2,
    evidenceQuality: 'fair',
  },
  {
    id: 'D4',
    title: 'Bathroom sealant deterioration',
    description: 'Silicone sealant around bath and shower is discoloured and peeling in several sections.',
    room: 'Bathroom',
    type: 'maintenance',
    severity: 'medium',
    checkinCondition: 'Good',
    checkoutCondition: 'Poor',
    aiLiability: 'landlord',
    operatorLiability: null,
    estimatedCost: 90,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'Sealant deterioration is typically a maintenance item. Expected lifespan of sealant (3–5 years) has been exceeded. Landlord responsibility.',
    aiConfidence: 88,
    expectedLifespan: 4,
    ageAtCheckout: 5,
    evidenceQuality: 'good',
  },
  {
    id: 'D5',
    title: 'Hallway carpet wear',
    description: 'Visible wear pattern in high-traffic hallway area. Carpet thinning near front door.',
    room: 'Hallway',
    type: 'damage',
    severity: 'low',
    checkinCondition: 'Fair',
    checkoutCondition: 'Poor',
    aiLiability: 'landlord',
    operatorLiability: null,
    estimatedCost: 200,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'High-traffic area wear is consistent with fair wear and tear. Carpet age (7 years) near end of expected lifespan (8 years). No charge recommended.',
    aiConfidence: 61,
    expectedLifespan: 8,
    ageAtCheckout: 7,
    evidenceQuality: 'fair',
  },
  {
    id: 'D6',
    title: 'Missing window blind',
    description: 'Roller blind missing from kitchen window. Bracket still attached to wall.',
    room: 'Kitchen',
    type: 'damage',
    severity: 'medium',
    checkinCondition: 'Good',
    checkoutCondition: 'Poor',
    aiLiability: 'tenant',
    operatorLiability: null,
    estimatedCost: 45,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'Blind was present and in good condition at check-in. Missing at checkout indicates tenant responsibility for replacement.',
    aiConfidence: 97,
    expectedLifespan: 10,
    ageAtCheckout: 2,
    evidenceQuality: 'good',
  },
  {
    id: 'D7',
    title: 'Garden maintenance required',
    description: 'Overgrown lawn and flower beds. Garden waste and debris in several areas.',
    room: 'Garden',
    type: 'cleaning',
    severity: 'low',
    checkinCondition: 'Good',
    checkoutCondition: 'Fair',
    aiLiability: 'tenant',
    operatorLiability: null,
    estimatedCost: 150,
    adjustedCost: null,
    excluded: false,
    reviewed: false,
    rationale: 'Tenancy agreement specifies tenant responsibility for garden maintenance. Condition does not meet the standard at check-in.',
    aiConfidence: 85,
    expectedLifespan: null,
    ageAtCheckout: null,
    evidenceQuality: 'fair',
  },
]

// ── Workspace step definitions ──────────────────────────────────────

export type WorkspaceStep =
  | 'inventory'
  | 'readings'
  | 'analysis'
  | 'review'
  | 'deductions'
  | 'negotiation'
  | 'refund'

export const WORKSPACE_STEPS: Array<{ key: WorkspaceStep; label: string; shortLabel: string }> = [
  { key: 'inventory', label: 'Inventory', shortLabel: 'Inv' },
  { key: 'readings', label: 'Readings', shortLabel: 'Read' },
  { key: 'analysis', label: 'Analysis', shortLabel: 'AI' },
  { key: 'review', label: 'Review', shortLabel: 'Rev' },
  { key: 'deductions', label: 'Deductions', shortLabel: 'Ded' },
  { key: 'negotiation', label: 'Negotiation', shortLabel: 'Neg' },
  { key: 'refund', label: 'Refund', shortLabel: 'Ref' },
]

// ── Workspace utility readings ──────────────────────────────────────

export type UtilityReading = {
  type: string
  checkin: string
  checkout: string
  usage: string
  unit: string
  meter: string
}

export const MOCK_UTILITIES: UtilityReading[] = [
  { type: 'Electric', checkin: '14,230', checkout: '17,891', usage: '3,661 kWh', unit: 'kWh', meter: 'Cupboard under stairs' },
  { type: 'Gas', checkin: '5,102', checkout: '6,845', usage: '1,743 m³', unit: 'm³', meter: 'External meter box' },
  { type: 'Water', checkin: '234', checkout: '312', usage: '78 m³', unit: 'm³', meter: 'Front garden boundary' },
]

// ── Workspace keys ──────────────────────────────────────────────────

export type KeySet = {
  set: string
  count: number
  status: 'returned' | 'outstanding'
  notes: string
}

export const MOCK_KEYS: KeySet[] = [
  { set: 'Front Door', count: 2, status: 'returned', notes: 'Both keys accounted for' },
  { set: 'Back Door', count: 1, status: 'returned', notes: 'Single key returned' },
  { set: 'Garage', count: 1, status: 'outstanding', notes: 'Key not returned at checkout' },
]
