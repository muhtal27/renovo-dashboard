'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Download,
  Mail,
  Minus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/ui'

type TabKey =
  | 'adjudicator'
  | 'risk'
  | 'elasticity'
  | 'benchmarks'
  | 'predictive'
  | 'cohorts'
  | 'letters'
  | 'dwell'
  | 'assessors'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'adjudicator', label: 'Adjudicator Patterns' },
  { key: 'risk', label: 'Portfolio Risk' },
  { key: 'elasticity', label: 'Recovery Elasticity' },
  { key: 'benchmarks', label: 'Cost Benchmarks' },
  { key: 'predictive', label: 'Predictive Scoring' },
  { key: 'cohorts', label: 'Cohort Analytics' },
  { key: 'letters', label: 'Letter Effectiveness' },
  { key: 'dwell', label: 'Deposit Dwell Cost' },
  { key: 'assessors', label: 'Assessor Quality' },
]

const ADJ_PATTERNS = [
  {
    scheme: 'SafeDeposits Scotland',
    cells: [
      { type: 'Cleaning', rate: 88, n: 24 },
      { type: 'Damage', rate: 72, n: 31 },
      { type: 'Maintenance', rate: 81, n: 14 },
      { type: 'Garden', rate: 54, n: 8 },
      { type: 'Decoration', rate: 48, n: 11 },
    ],
  },
  {
    scheme: 'mydeposits Scotland',
    cells: [
      { type: 'Cleaning', rate: 79, n: 18 },
      { type: 'Damage', rate: 65, n: 22 },
      { type: 'Maintenance', rate: 74, n: 9 },
      { type: 'Garden', rate: 42, n: 6 },
      { type: 'Decoration', rate: 39, n: 7 },
    ],
  },
  {
    scheme: 'TDS',
    cells: [
      { type: 'Cleaning', rate: 91, n: 42 },
      { type: 'Damage', rate: 68, n: 48 },
      { type: 'Maintenance', rate: 84, n: 21 },
      { type: 'Garden', rate: 58, n: 12 },
      { type: 'Decoration', rate: 51, n: 18 },
    ],
  },
  {
    scheme: 'DPS',
    cells: [
      { type: 'Cleaning', rate: 86, n: 38 },
      { type: 'Damage', rate: 71, n: 44 },
      { type: 'Maintenance', rate: 79, n: 19 },
      { type: 'Garden', rate: 49, n: 10 },
      { type: 'Decoration', rate: 44, n: 15 },
    ],
  },
]

const ADJ_INSIGHTS = [
  'DPS awards 91% of cleaning claims with timestamped checkout photos but only 34% without.',
  'Decoration claims have the lowest award rate across all schemes (avg 46%) — pair with a contractor quote to lift acceptance.',
  'mydeposits Scotland reduces garden maintenance claims by ~58% on tenancies under 12 months.',
]

const RISK_HEATMAP = [
  { property: '12 Carrington Mews', disputes: 3, tenancies: 4, riskScore: 92, topReason: 'Recurring damp claim disagreement', action: 'Review inventory standard for damp documentation' },
  { property: '156 Causewayside', disputes: 2, tenancies: 3, riskScore: 84, topReason: 'Garden maintenance disputes', action: 'Add seasonal photo schedule to inventory' },
  { property: '42 Leith Walk', disputes: 2, tenancies: 5, riskScore: 71, topReason: 'Carpet wear interpretation', action: 'Specify carpet age and lifespan in check-in' },
  { property: '9 Haymarket Terrace', disputes: 1, tenancies: 2, riskScore: 68, topReason: 'Cleaning standard ambiguity', action: 'Attach professional clean receipt at check-in' },
  { property: '67 Easter Road', disputes: 1, tenancies: 4, riskScore: 54, topReason: 'Appliance lifespan dispute', action: 'Record appliance install dates in inventory' },
  { property: '8 Morningside Road', disputes: 1, tenancies: 6, riskScore: 38, topReason: 'One-off bathroom tile', action: 'No action — within expected variance' },
]

const ELASTICITY_DATA = [
  { factor: 'Add 1 dated photo per damage item', uplift: 38, unit: '£/item', confidence: 'high' as const },
  { factor: 'Attach contractor quote (≥1)', uplift: 73, unit: '£/case', confidence: 'high' as const },
  { factor: 'Add check-in/checkout pair shot', uplift: 54, unit: '£/item', confidence: 'medium' as const },
  { factor: 'Narrative >150 words per item', uplift: 21, unit: '£/item', confidence: 'medium' as const },
  { factor: 'Include written tenant correspondence', uplift: 42, unit: '£/case', confidence: 'high' as const },
  { factor: 'Submit within 7 days of dispute', uplift: 18, unit: '£/case', confidence: 'low' as const },
]

const BENCHMARKS = [
  { category: 'End-of-tenancy clean (2 bed)', yours: 185, peerMedian: 165, peerP25: 140, peerP75: 195, verdict: 'high' as const },
  { category: 'Carpet steam clean (room)', yours: 75, peerMedian: 65, peerP25: 55, peerP75: 85, verdict: 'normal' as const },
  { category: 'Oven deep clean', yours: 95, peerMedian: 75, peerP25: 60, peerP75: 90, verdict: 'high' as const },
  { category: 'Wall repaint (room)', yours: 120, peerMedian: 140, peerP25: 110, peerP75: 170, verdict: 'low' as const },
  { category: 'Garden tidy (small)', yours: 80, peerMedian: 90, peerP25: 70, peerP75: 110, verdict: 'normal' as const },
  { category: 'Lock change (single)', yours: 115, peerMedian: 95, peerP25: 75, peerP75: 115, verdict: 'high' as const },
]

const PREDICTIVE = [
  { caseId: 'CHK-2026-002', property: '42 Leith Walk', disputeProb: 68, expectedLow: 280, expectedHigh: 420, actions: ['Add timestamped checkout photo for hallway scuff', 'Get contractor quote for carpet stain', 'Reduce general cleaning charge by 20%'] },
  { caseId: 'CHK-2026-006', property: '156 Causewayside', disputeProb: 91, expectedLow: 240, expectedHigh: 380, actions: ['Submit prescribed information evidence (currently missing)', 'Add check-in pair photo for kitchen extractor', 'Document garden seasonal condition'] },
  { caseId: 'CHK-2026-009', property: '12 Stockbridge', disputeProb: 22, expectedLow: 90, expectedHigh: 160, actions: ['Case is well-evidenced — proceed to draft'] },
  { caseId: 'CHK-2026-004', property: '91 Gorgie Road', disputeProb: 34, expectedLow: 210, expectedHigh: 320, actions: ['Strengthen oven clean evidence with before/after pair'] },
  { caseId: 'CHK-2026-008', property: '67 Easter Road', disputeProb: 45, expectedLow: 130, expectedHigh: 220, actions: ['Assign operator (currently unassigned)', 'Attach contractor quote for appliance'] },
]

const COHORTS = {
  byTenancyLength: [
    { bucket: '< 12 months', disputeRate: 12, awardRate: 84, cases: 18 },
    { bucket: '12–24 months', disputeRate: 28, awardRate: 71, cases: 42 },
    { bucket: '24–36 months', disputeRate: 41, awardRate: 58, cases: 31 },
    { bucket: '> 36 months', disputeRate: 54, awardRate: 46, cases: 14 },
  ],
  byDepositSize: [
    { bucket: '< £750', disputeRate: 18, awardRate: 79, cases: 21 },
    { bucket: '£750–£1,200', disputeRate: 31, awardRate: 68, cases: 48 },
    { bucket: '£1,200–£1,800', disputeRate: 38, awardRate: 62, cases: 29 },
    { bucket: '> £1,800', disputeRate: 44, awardRate: 55, cases: 7 },
  ],
  byTenantType: [
    { bucket: 'Single occupant', disputeRate: 22, awardRate: 74, cases: 38 },
    { bucket: 'Couple / family', disputeRate: 29, awardRate: 69, cases: 51 },
    { bucket: 'HMO / shared', disputeRate: 48, awardRate: 53, cases: 16 },
  ],
}

const LETTER_EFFECTIVENESS = [
  { template: 'Itemised + photo evidence', sent: 34, agreedDays: 6, disputeRate: 18, winRate: 81 },
  { template: 'Itemised, no photos', sent: 21, agreedDays: 11, disputeRate: 38, winRate: 62 },
  { template: 'Lump sum justification', sent: 14, agreedDays: 19, disputeRate: 57, winRate: 44 },
  { template: 'Plain text deduction notice', sent: 9, agreedDays: 24, disputeRate: 67, winRate: 38 },
]

const DWELL_COST = [
  { bucket: '0–14 days', cases: 12, heldValue: 14250, opportunityCost: 23 },
  { bucket: '15–30 days', cases: 18, heldValue: 21300, opportunityCost: 71 },
  { bucket: '31–60 days', cases: 9, heldValue: 12100, opportunityCost: 81 },
  { bucket: '61+ days', cases: 4, heldValue: 5400, opportunityCost: 108 },
]

const ASSESSORS = [
  { id: 'A1', name: 'Sarah Patel', type: 'In-house', cases: 38, quality: 91, flagRate: 7, disputeRate: 14, winRate: 89, avgRecovery: 78, trend: [82, 85, 86, 88, 89, 90, 91], topFlags: [] as string[] },
  { id: 'A2', name: 'Marcus Chen', type: 'In-house', cases: 29, quality: 84, flagRate: 14, disputeRate: 21, winRate: 76, avgRecovery: 71, trend: [78, 79, 81, 82, 83, 83, 84], topFlags: ['Missing check-in pair photo on 18% of items'] },
  { id: 'A3', name: 'Reliable Inventories Ltd', type: 'External', cases: 42, quality: 79, flagRate: 19, disputeRate: 24, winRate: 72, avgRecovery: 68, trend: [81, 80, 79, 79, 78, 79, 79], topFlags: ['Generic condition wording ("worn", "damaged") on 23% of items', 'Photos lack timestamp metadata on 15% of items'] },
  { id: 'A4', name: 'Edinburgh Inventory Co.', type: 'External', cases: 24, quality: 67, flagRate: 28, disputeRate: 33, winRate: 61, avgRecovery: 58, trend: [72, 71, 69, 68, 67, 67, 67], topFlags: ['Blurry close-up shots on 31% of damage items', 'Missing room-wide context shots on 24% of items', 'No contractor quote attached on 19% of damage items'] },
  { id: 'A5', name: 'James Cross', type: 'In-house', cases: 31, quality: 54, flagRate: 38, disputeRate: 42, winRate: 47, avgRecovery: 49, trend: [62, 60, 58, 57, 56, 55, 54], topFlags: ['No timestamp on 41% of damage photos', 'Missing check-in comparison shot on 36% of kitchen items', 'Vague condition wording on 29% of items', 'Late upload (>72h after checkout) on 22% of cases'] },
]

function fmtMoney(n: number) {
  return '£' + n.toLocaleString('en-GB')
}

function rateColour(r: number) {
  if (r >= 80) return 'bg-emerald-500'
  if (r >= 65) return 'bg-emerald-400'
  if (r >= 50) return 'bg-amber-400'
  if (r >= 35) return 'bg-orange-500'
  return 'bg-rose-500'
}

function StatCard({ label, value, hint, valueClass }: { label: string; value: string; hint?: string; valueClass?: string }) {
  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{label}</div>
      <div className={cn('mt-1 text-2xl font-bold tabular-nums', valueClass || 'text-zinc-900')}>{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-zinc-500">{hint}</div> : null}
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-[10px] border border-zinc-200 bg-white', className)}>{children}</div>
}

export function IntelligenceClient() {
  const [tab, setTab] = useState<TabKey>('adjudicator')
  const [assessorId, setAssessorId] = useState<string | null>(null)

  const { winRate, avgRecovery, moneyInLimbo } = useMemo(() => {
    const allCells = ADJ_PATTERNS.flatMap((s) => s.cells)
    const wr = Math.round(
      allCells.reduce((sum, c) => sum + c.rate * c.n, 0) / allCells.reduce((sum, c) => sum + c.n, 0)
    )
    const ar = Math.round(
      ASSESSORS.reduce((s, a) => s + a.avgRecovery * a.cases, 0) /
        ASSESSORS.reduce((s, a) => s + a.cases, 0)
    )
    const mil = DWELL_COST.reduce((s, d) => s + d.heldValue, 0)
    return { winRate: wr, avgRecovery: ar, moneyInLimbo: mil }
  }, [])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Intelligence</h2>
          <p className="mt-1 text-[13px] text-zinc-500">
            Forward-looking analytics: why outcomes happen, what&apos;s likely next, and what to change
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-[34px] rounded-md border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700">
            <option>Last 12 months</option>
            <option>Last 6 months</option>
            <option>Year to date</option>
            <option>All time</option>
          </select>
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Adjudicator Win Rate" value={`${winRate}%`} hint="across all schemes" valueClass="text-emerald-600" />
        <StatCard label="Avg Recovery" value={`${avgRecovery}%`} hint="£ awarded / £ claimed" />
        <StatCard label="Recovery Uplift YoY" value="+14%" hint="vs same period 2025" valueClass="text-emerald-600" />
        <StatCard label="Money in Limbo" value={fmtMoney(moneyInLimbo)} hint="held in undecided cases" valueClass="text-amber-700" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key)
              setAssessorId(null)
            }}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition',
              tab === t.key
                ? 'border-emerald-500 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === 'adjudicator' ? <AdjudicatorTab /> : null}
        {tab === 'risk' ? <RiskTab /> : null}
        {tab === 'elasticity' ? <ElasticityTab /> : null}
        {tab === 'benchmarks' ? <BenchmarksTab /> : null}
        {tab === 'predictive' ? <PredictiveTab /> : null}
        {tab === 'cohorts' ? <CohortsTab /> : null}
        {tab === 'letters' ? <LettersTab /> : null}
        {tab === 'dwell' ? <DwellTab /> : null}
        {tab === 'assessors' ? (
          <AssessorsTab assessorId={assessorId} onSelect={setAssessorId} />
        ) : null}
      </div>
    </div>
  )
}

function AdjudicatorTab() {
  const types = ADJ_PATTERNS[0].cells.map((c) => c.type)
  return (
    <>
      <Card className="p-5">
        <h4 className="text-[14px] font-semibold text-zinc-900">Award Rate by Scheme × Defect Type</h4>
        <p className="mt-1 text-[12px] text-zinc-500">% of claims that win at adjudication. Sample sizes shown in parentheses.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
                <th className="w-[200px] py-2">Scheme</th>
                {types.map((t) => (
                  <th key={t} className="py-2 text-center">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ADJ_PATTERNS.map((s) => (
                <tr key={s.scheme} className="border-t border-zinc-100">
                  <td className="py-3 text-[13px] font-medium text-zinc-900">{s.scheme}</td>
                  {s.cells.map((c) => (
                    <td key={c.type} className="px-2 py-3 text-center">
                      <div className={cn('inline-block min-w-[64px] rounded-md px-2 py-1.5 text-[13px] font-semibold tabular-nums text-white', rateColour(c.rate))}>
                        {c.rate}%
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">({c.n})</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-5">
        <h4 className="text-[14px] font-semibold text-zinc-900">Key Insights</h4>
        <div className="mt-3 space-y-3">
          {ADJ_INSIGHTS.map((i) => (
            <div key={i} className="flex gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-700" />
              <span className="text-[13px] text-zinc-700">{i}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function RiskTab() {
  return (
    <>
      <Card className="border-l-[3px] border-l-amber-500 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
          <div>
            <div className="text-[13px] font-medium text-amber-700">3 properties flagged as high-risk</div>
            <div className="mt-1 text-[12px] text-zinc-500">
              Properties with historical dispute clustering. Adjusting inventory standard or evidence routine reduces repeat disputes.
            </div>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <th className="px-4 py-2.5">Property</th>
              <th className="px-4 py-2.5">Disputes / Tenancies</th>
              <th className="px-4 py-2.5">Risk Score</th>
              <th className="px-4 py-2.5">Top Reason</th>
              <th className="px-4 py-2.5">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {RISK_HEATMAP.map((r) => {
              const colour = r.riskScore >= 80 ? 'bg-rose-500' : r.riskScore >= 60 ? 'bg-amber-500' : 'bg-zinc-400'
              const text = r.riskScore >= 80 ? 'text-rose-600' : r.riskScore >= 60 ? 'text-amber-600' : 'text-zinc-500'
              return (
                <tr key={r.property} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-[13px] font-medium text-zinc-900">{r.property}</td>
                  <td className="px-4 py-3 text-[13px] tabular-nums text-zinc-700">{r.disputes} / {r.tenancies}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[120px] items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                        <div className={cn('h-full rounded-full', colour)} style={{ width: `${r.riskScore}%` }} />
                      </div>
                      <span className={cn('text-[13px] font-semibold tabular-nums', text)}>{r.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-zinc-700">{r.topReason}</td>
                  <td className="px-4 py-3 text-[13px] text-zinc-500">{r.action}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </>
  )
}

function ElasticityTab() {
  const max = Math.max(...ELASTICITY_DATA.map((d) => d.uplift))
  const confBadge = (c: 'high' | 'medium' | 'low') =>
    c === 'high'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : c === 'medium'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-zinc-50 text-zinc-700 ring-zinc-200'
  return (
    <>
      <Card className="border-l-[3px] border-l-emerald-500 p-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 text-emerald-600" />
          <div>
            <div className="text-[13px] font-medium text-emerald-700">Marginal uplift per evidence improvement</div>
            <div className="mt-1 text-[12px] text-zinc-500">
              Inferred from your historical adjudication outcomes. The numbers below show the average extra £ recovered per change applied.
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <h4 className="text-[14px] font-semibold text-zinc-900">Recovery Levers</h4>
        <div className="mt-4 space-y-5">
          {ELASTICITY_DATA.map((d) => {
            const pct = (d.uplift / max) * 100
            return (
              <div key={d.factor}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium text-zinc-900">{d.factor}</div>
                    <span className={cn('mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', confBadge(d.confidence))}>
                      {d.confidence} confidence
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold tabular-nums text-emerald-600">+£{d.uplift}</div>
                    <div className="text-[11px] text-zinc-500">{d.unit}</div>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

function BenchmarksTab() {
  return (
    <>
      <Card className="border-l-[3px] border-l-indigo-500 p-4">
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 h-4 w-4 text-indigo-600" />
          <div>
            <div className="text-[13px] font-medium text-indigo-700">Cost benchmarks vs anonymised peer median</div>
            <div className="mt-1 text-[12px] text-zinc-500">
              Compare your typical claim values against ~140 peer agencies in your region. Overclaims lose more often; underclaims leave money on the table.
            </div>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5 text-right">You</th>
              <th className="px-4 py-2.5 text-right">Peer P25</th>
              <th className="px-4 py-2.5 text-right">Peer Median</th>
              <th className="px-4 py-2.5 text-right">Peer P75</th>
              <th className="px-4 py-2.5">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {BENCHMARKS.map((b) => {
              const cls =
                b.verdict === 'high'
                  ? 'bg-rose-50 text-rose-700 ring-rose-200'
                  : b.verdict === 'low'
                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              const lbl = b.verdict === 'high' ? 'Above market' : b.verdict === 'low' ? 'Below market' : 'In line'
              return (
                <tr key={b.category} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-[13px] font-medium text-zinc-900">{b.category}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums">£{b.yours}</td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums text-zinc-500">£{b.peerP25}</td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums">£{b.peerMedian}</td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums text-zinc-500">£{b.peerP75}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ring-1', cls)}>{lbl}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </>
  )
}

function PredictiveTab() {
  return (
    <>
      <Card className="border-l-[3px] border-l-violet-500 p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-violet-600" />
          <div>
            <div className="text-[13px] font-medium text-violet-700">Predictive case scoring</div>
            <div className="mt-1 text-[12px] text-zinc-500">
              For every active case, model output: probability of dispute, expected recovery range, and the top actions to improve outcome.
            </div>
          </div>
        </div>
      </Card>
      <div className="space-y-4">
        {PREDICTIVE.map((p) => {
          const border =
            p.disputeProb >= 70 ? 'border-l-rose-500' : p.disputeProb >= 40 ? 'border-l-amber-500' : 'border-l-emerald-500'
          const text =
            p.disputeProb >= 70 ? 'text-rose-600' : p.disputeProb >= 40 ? 'text-amber-600' : 'text-emerald-600'
          return (
            <Card key={p.caseId} className={cn('border-l-[3px] p-4', border)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-medium text-zinc-900">{p.property}</div>
                  <div className="text-[11px] text-zinc-500">{p.caseId}</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Dispute Risk</div>
                    <div className={cn('text-[14px] font-bold tabular-nums', text)}>{p.disputeProb}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Expected Recovery</div>
                    <div className="text-[14px] font-bold tabular-nums text-zinc-900">
                      {fmtMoney(p.expectedLow)} – {fmtMoney(p.expectedHigh)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Top Actions to Improve Outcome</div>
                {p.actions.map((a) => (
                  <div key={a} className="flex items-start gap-1.5 border-b border-zinc-100 py-1.5 text-[12px] text-zinc-700 last:border-b-0">
                    <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}

function CohortsTab() {
  const block = (
    title: string,
    arr: { bucket: string; cases: number; disputeRate: number; awardRate: number }[],
    labelKey: string
  ) => (
    <Card className="p-5" key={title}>
      <h4 className="text-[14px] font-semibold text-zinc-900">{title}</h4>
      <table className="mt-3 w-full text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <th className="py-2">{labelKey}</th>
            <th className="py-2 text-right">Cases</th>
            <th className="py-2 text-right">Dispute Rate</th>
            <th className="py-2 text-right">Avg Recovery</th>
          </tr>
        </thead>
        <tbody>
          {arr.map((b) => (
            <tr key={b.bucket} className="border-t border-zinc-100">
              <td className="py-2.5 text-[13px] font-medium text-zinc-900">{b.bucket}</td>
              <td className="py-2.5 text-right text-[13px] tabular-nums">{b.cases}</td>
              <td className={cn('py-2.5 text-right text-[13px] tabular-nums', b.disputeRate > 40 ? 'text-rose-600' : b.disputeRate > 25 ? 'text-amber-600' : 'text-emerald-600')}>{b.disputeRate}%</td>
              <td className={cn('py-2.5 text-right text-[13px] tabular-nums', b.awardRate >= 70 ? 'text-emerald-600' : b.awardRate >= 55 ? 'text-amber-600' : 'text-rose-600')}>{b.awardRate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
  return (
    <div className="space-y-4">
      {block('By Tenancy Length', COHORTS.byTenancyLength, 'Length')}
      {block('By Deposit Size', COHORTS.byDepositSize, 'Deposit Band')}
      {block('By Tenant Composition', COHORTS.byTenantType, 'Type')}
    </div>
  )
}

function LettersTab() {
  return (
    <>
      <Card className="border-l-[3px] border-l-cyan-500 p-4">
        <div className="flex items-start gap-2">
          <Mail className="mt-0.5 h-4 w-4 text-cyan-600" />
          <div>
            <div className="text-[13px] font-medium text-cyan-700">Deduction letter effectiveness</div>
            <div className="mt-1 text-[12px] text-zinc-500">
              Win rate, days-to-agreement, and dispute rate by template. Strong correlation between itemised + photo evidence and faster settlement.
            </div>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <th className="px-4 py-2.5">Template</th>
              <th className="px-4 py-2.5 text-right">Sent</th>
              <th className="px-4 py-2.5 text-right">Avg Days to Agree</th>
              <th className="px-4 py-2.5 text-right">Dispute Rate</th>
              <th className="px-4 py-2.5 text-right">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {LETTER_EFFECTIVENESS.map((l) => (
              <tr key={l.template} className="border-t border-zinc-100">
                <td className="px-4 py-3 text-[13px] font-medium text-zinc-900">{l.template}</td>
                <td className="px-4 py-3 text-right text-[13px] tabular-nums">{l.sent}</td>
                <td className="px-4 py-3 text-right text-[13px] tabular-nums">{l.agreedDays}d</td>
                <td className={cn('px-4 py-3 text-right text-[13px] tabular-nums', l.disputeRate > 40 ? 'text-rose-600' : l.disputeRate > 25 ? 'text-amber-600' : 'text-emerald-600')}>{l.disputeRate}%</td>
                <td className={cn('px-4 py-3 text-right text-[13px] tabular-nums', l.winRate >= 70 ? 'text-emerald-600' : l.winRate >= 55 ? 'text-amber-600' : 'text-rose-600')}>{l.winRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

function DwellTab() {
  const total = DWELL_COST.reduce((s, d) => s + d.heldValue, 0)
  const totalCost = DWELL_COST.reduce((s, d) => s + d.opportunityCost, 0)
  const totalCases = DWELL_COST.reduce((s, d) => s + d.cases, 0)
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cases in Limbo" value={String(totalCases)} />
        <StatCard label="Total Held" value={fmtMoney(total)} />
        <StatCard label="Opportunity Cost (est.)" value={`£${totalCost}`} valueClass="text-rose-700" />
      </div>
      <Card className="p-5">
        <h4 className="text-[14px] font-semibold text-zinc-900">Held Deposit Ageing</h4>
        <div className="mt-4 space-y-4">
          {DWELL_COST.map((d) => {
            const colour = d.bucket.includes('61+') ? 'bg-rose-500' : d.bucket.includes('31') ? 'bg-amber-500' : 'bg-emerald-500'
            const pct = (d.heldValue / total) * 100
            return (
              <div key={d.bucket}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium text-zinc-900">{d.bucket}</div>
                    <div className="text-[11px] text-zinc-500">{d.cases} cases</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold tabular-nums">{fmtMoney(d.heldValue)}</div>
                    <div className="text-[11px] text-zinc-500">opportunity cost ~£{d.opportunityCost}</div>
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className={cn('h-full rounded-full', colour)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-[12px] text-zinc-500">Opportunity cost calculated against a 4.5% money-market reference rate.</p>
      </Card>
    </>
  )
}

function AssessorsTab({ assessorId, onSelect }: { assessorId: string | null; onSelect: (id: string | null) => void }) {
  if (assessorId) {
    const a = ASSESSORS.find((x) => x.id === assessorId)
    if (!a) {
      onSelect(null)
      return null
    }
    const colour = a.quality >= 85 ? 'bg-emerald-500' : a.quality >= 70 ? 'bg-amber-500' : 'bg-rose-500'
    const text = a.quality >= 85 ? 'text-emerald-600' : a.quality >= 70 ? 'text-amber-600' : 'text-rose-600'
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to leaderboard
        </button>
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[18px] font-semibold text-zinc-900">{a.name}</h3>
              <p className="mt-1 text-[13px] text-zinc-500">{a.type} • {a.cases} cases assessed</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Evidence Quality</div>
              <div className={cn('text-[32px] font-bold tabular-nums', text)}>{a.quality}</div>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Flag Rate" value={`${a.flagRate}%`} valueClass={a.flagRate > 20 ? 'text-rose-600' : a.flagRate > 10 ? 'text-amber-600' : 'text-emerald-600'} />
          <StatCard label="Dispute Rate" value={`${a.disputeRate}%`} valueClass={a.disputeRate > 30 ? 'text-rose-600' : a.disputeRate > 20 ? 'text-amber-600' : 'text-emerald-600'} />
          <StatCard label="Adjudication Win Rate" value={`${a.winRate}%`} valueClass={a.winRate >= 75 ? 'text-emerald-600' : a.winRate >= 60 ? 'text-amber-600' : 'text-rose-600'} />
          <StatCard label="Avg Recovery" value={`${a.avgRecovery}%`} />
        </div>
        <Card className="p-5">
          <h4 className="text-[14px] font-semibold text-zinc-900">Quality Trend (7 months)</h4>
          <div className="mt-4 flex h-32 items-end gap-2">
            {a.trend.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={cn('w-full rounded-t-sm', colour)} style={{ height: `${v}%` }} />
                <div className="text-[11px] text-zinc-500">M{i + 1}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h4 className="text-[14px] font-semibold text-zinc-900">Common Evidence Flags</h4>
          {a.topFlags.length === 0 ? (
            <div className="mt-3 text-[13px] text-zinc-500">No recurring flags — evidence quality is consistently strong.</div>
          ) : (
            <div className="mt-3 space-y-3">
              {a.topFlags.map((f) => (
                <div key={f} className="flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                  <span className="text-[13px] text-zinc-700">{f}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        {a.quality < 70 ? (
          <Card className="border-l-[3px] border-l-rose-500 bg-rose-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-700" />
              <div>
                <div className="text-[13px] font-medium text-rose-700">Recommended action</div>
                <div className="mt-1 text-[12px] text-rose-700">
                  Re-training or reassignment recommended. Reassigning {a.name}&apos;s properties to a top-quartile assessor could lift portfolio recovery by an estimated £{Math.round((85 - a.quality) * 40)}/yr.
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    )
  }

  const sorted = [...ASSESSORS].sort((a, b) => b.quality - a.quality)
  const top = sorted[0]
  const bottom = sorted[sorted.length - 1]
  return (
    <>
      <Card className="border-l-[3px] border-l-violet-500 p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-violet-600" />
          <div>
            <div className="text-[13px] font-medium text-violet-700">
              {top.name} produces evidence that wins {top.winRate}% of adjudications. {bottom.name} sits at {bottom.winRate}%.
            </div>
            <div className="mt-1 text-[12px] text-zinc-500">
              Reassigning {bottom.name}&apos;s properties could lift portfolio recovery by an estimated £{Math.round((top.avgRecovery - bottom.avgRecovery) * 30)}/yr.
            </div>
          </div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <th className="px-4 py-2.5">Assessor</th>
              <th className="px-4 py-2.5 text-right">Cases</th>
              <th className="px-4 py-2.5 text-right">Quality</th>
              <th className="px-4 py-2.5 text-right">Flag Rate</th>
              <th className="px-4 py-2.5 text-right">Dispute Rate</th>
              <th className="px-4 py-2.5 text-right">Win Rate</th>
              <th className="px-4 py-2.5 text-right">Trend</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => {
              const colour = a.quality >= 85 ? 'bg-emerald-500' : a.quality >= 70 ? 'bg-amber-500' : 'bg-rose-500'
              const text = a.quality >= 85 ? 'text-emerald-600' : a.quality >= 70 ? 'text-amber-600' : 'text-rose-600'
              const last = a.trend[a.trend.length - 1]
              const first = a.trend[0]
              const Trend = last > first ? TrendingUp : last < first ? TrendingDown : Minus
              const trendColour = last > first ? 'text-emerald-600' : last < first ? 'text-rose-600' : 'text-zinc-500'
              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a.id)}
                  className="cursor-pointer border-t border-zinc-100 transition hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-zinc-900">{a.name}</div>
                    <div className="text-[11px] text-zinc-500">{a.type}</div>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] tabular-nums">{a.cases}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-100">
                        <div className={cn('h-full rounded-full', colour)} style={{ width: `${a.quality}%` }} />
                      </div>
                      <span className={cn('text-[13px] font-semibold tabular-nums', text)}>{a.quality}</span>
                    </div>
                  </td>
                  <td className={cn('px-4 py-3 text-right text-[13px] tabular-nums', a.flagRate > 20 ? 'text-rose-600' : a.flagRate > 10 ? 'text-amber-600' : 'text-emerald-600')}>{a.flagRate}%</td>
                  <td className={cn('px-4 py-3 text-right text-[13px] tabular-nums', a.disputeRate > 30 ? 'text-rose-600' : a.disputeRate > 20 ? 'text-amber-600' : 'text-emerald-600')}>{a.disputeRate}%</td>
                  <td className={cn('px-4 py-3 text-right text-[13px] tabular-nums', a.winRate >= 75 ? 'text-emerald-600' : a.winRate >= 60 ? 'text-amber-600' : 'text-rose-600')}>{a.winRate}%</td>
                  <td className="px-4 py-3 text-right">
                    <Trend className={cn('inline-block h-3.5 w-3.5', trendColour)} />
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    <ArrowRight className="inline-block h-3.5 w-3.5" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </>
  )
}
