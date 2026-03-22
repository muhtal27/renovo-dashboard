'use client'

import { useState } from 'react'

type DemoTab = 'overview' | 'evidence' | 'issues' | 'recommendation' | 'claim'
type DocumentRole = 'check_in' | 'check_out' | 'photo'
type IssueType = 'damage' | 'repair' | 'redecoration' | 'missing_item'
type IssueSeverity = 'high' | 'medium' | 'low'
type IssueResponsibility = 'tenant' | 'shared'

type DemoDocument = {
  id: string
  name: string
  role: DocumentRole
  format: string
  uploadedAt: string
}

type DemoIssue = {
  id: string
  title: string
  area: string
  type: IssueType
  responsibility: IssueResponsibility
  severity: IssueSeverity
  amount: number
  status: 'accepted'
  description: string
  evidence: string
}

type DemoLineItem = {
  id: string
  description: string
  category: IssueType
  amount: number
}

type DemoToast = {
  id: number
  message: string
  visible: boolean
}

const CASE_REFERENCE = 'EOT-2024-0041'
const PROPERTY_ADDRESS = '14 Bruntsfield Place, Edinburgh EH10 4HJ'
const TENANT_NAME = 'James Holbrook'
const LANDLORD_NAME = 'Mrs D. Cairns'
const MOVE_OUT_DATE = '8 March 2024'
const TENANCY_DURATION = '18 months'
const DEPOSIT_DISPLAY = '£1,200 — MyDeposits scheme'
const RENT_DISPLAY = '£1,100/month'
const CLAIM_REFERENCE = 'DPS-2022-881234'
const RECOMMENDED_TOTAL = 640
const DEPOSIT_TOTAL = 1200
const AI_CONFIDENCE = 82

const DEMO_TABS: Array<{ id: DemoTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'issues', label: 'Issues' },
  { id: 'recommendation', label: 'Recommendation' },
  { id: 'claim', label: 'Claim output' },
]

const DEMO_DOCUMENTS: DemoDocument[] = [
  {
    id: 'doc-1',
    name: 'Check-in inventory report',
    role: 'check_in',
    format: 'PDF',
    uploadedAt: '4 Sep 2022',
  },
  {
    id: 'doc-2',
    name: 'Check-out inspection report',
    role: 'check_out',
    format: 'PDF',
    uploadedAt: '10 Mar 2024',
  },
  {
    id: 'doc-3',
    name: 'Move-out photos, living room',
    role: 'photo',
    format: '14 images',
    uploadedAt: '10 Mar 2024',
  },
  {
    id: 'doc-4',
    name: 'Move-out photos, bedroom 1',
    role: 'photo',
    format: '9 images',
    uploadedAt: '10 Mar 2024',
  },
  {
    id: 'doc-5',
    name: 'Move-out photos, kitchen',
    role: 'photo',
    format: '7 images',
    uploadedAt: '10 Mar 2024',
  },
]

const DEMO_ISSUES: DemoIssue[] = [
  {
    id: 'issue-1',
    title: 'Carpet staining',
    area: 'living room',
    type: 'damage',
    responsibility: 'tenant',
    severity: 'high',
    amount: 280,
    status: 'accepted',
    description: 'Significant staining is visible in the living room carpet compared with the check-in condition.',
    evidence: 'check-out report p.5, living room photos #3 and #7',
  },
  {
    id: 'issue-2',
    title: 'Broken kitchen cupboard door',
    area: 'kitchen',
    type: 'repair',
    responsibility: 'tenant',
    severity: 'high',
    amount: 160,
    status: 'accepted',
    description: 'The kitchen cupboard door is detached and requires a direct repair or replacement.',
    evidence: 'check-out report p.8, kitchen photos #2',
  },
  {
    id: 'issue-3',
    title: 'Scuff marks',
    area: 'bedroom 1 wall',
    type: 'redecoration',
    responsibility: 'shared',
    severity: 'medium',
    amount: 120,
    status: 'accepted',
    description: 'Wall scuffs in bedroom 1 exceed normal wear but still require a proportional shared assessment.',
    evidence: 'bedroom photos #4, #5',
  },
  {
    id: 'issue-4',
    title: 'Missing picture hooks',
    area: 'hallway',
    type: 'missing_item',
    responsibility: 'tenant',
    severity: 'low',
    amount: 80,
    status: 'accepted',
    description: 'Picture hooks recorded at check-in are now missing from the hallway finish.',
    evidence: 'check-in inventory p.3',
  },
]

const RECOMMENDATION = {
  outcome: 'partial_claim',
  outcomeLabel: 'Partial claim recommended',
  status: 'Needs your review',
  totalRecommended: RECOMMENDED_TOTAL,
  confidence: AI_CONFIDENCE,
  summary: 'Evidence supports a partial claim of £640 from the £1,200 deposit.',
  rationale:
    'The carpet stain and broken cupboard door are clearly documented in the check-out report with photographic comparison to check-in condition. The bedroom wall scuffs are borderline given the 18-month tenancy, but the extent shown exceeds typical fair wear and tear. The picture hooks are a minor item but traceable in the check-in inventory. Responsible amounts have been assessed proportionally.',
  sources: [
    'Check-in inventory p.3',
    'Check-out report p.5, p.8',
    'Living room photos #3, #7',
    'Deposit scheme guidance',
    'Fair wear and tear policy',
  ],
}

const CLAIM_LINE_ITEMS: DemoLineItem[] = [
  {
    id: 'line-1',
    description: 'Carpet replacement — living room',
    category: 'damage',
    amount: 280,
  },
  {
    id: 'line-2',
    description: 'Kitchen cupboard door repair',
    category: 'repair',
    amount: 160,
  },
  {
    id: 'line-3',
    description: 'Bedroom wall redecoration',
    category: 'redecoration',
    amount: 120,
  },
  {
    id: 'line-4',
    description: 'Missing picture hooks',
    category: 'missing_item',
    amount: 80,
  },
]

const WORKFLOW_STEPS = [
  { label: 'Evidence collected', state: 'complete' as const },
  { label: 'Issues assessed', state: 'complete' as const },
  { label: 'Recommendation drafted', state: 'complete' as const },
  { label: 'Manager review', state: 'current' as const },
  { label: 'Claim output', state: 'pending' as const },
]

const ROLE_BADGE_STYLES: Record<DocumentRole, string> = {
  check_in: 'bg-sky-100 text-sky-800 border-sky-200',
  check_out: 'bg-amber-100 text-amber-800 border-amber-200',
  photo: 'bg-violet-100 text-violet-800 border-violet-200',
}

const ROLE_LABELS: Record<DocumentRole, string> = {
  check_in: 'Check-in',
  check_out: 'Check-out',
  photo: 'Photos',
}

const ISSUE_TYPE_STYLES: Record<IssueType, string> = {
  damage: 'bg-red-100 text-red-800 border-red-200',
  repair: 'bg-amber-100 text-amber-800 border-amber-200',
  redecoration: 'bg-violet-100 text-violet-800 border-violet-200',
  missing_item: 'bg-stone-100 text-stone-700 border-stone-200',
}

const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  damage: 'Damage',
  repair: 'Repair',
  redecoration: 'Redecoration',
  missing_item: 'Missing item',
}

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

const RESPONSIBILITY_STYLES: Record<IssueResponsibility, string> = {
  tenant: 'bg-red-100 text-red-800 border-red-200',
  shared: 'bg-amber-100 text-amber-800 border-amber-200',
}

const RESPONSIBILITY_LABELS: Record<IssueResponsibility, string> = {
  tenant: 'Tenant',
  shared: 'Shared',
}

const TOAST_MESSAGES = {
  approve:
    'In the live product, this approves the recommendation and creates the deposit claim.',
  revise:
    'In the live product, this returns the recommendation for revision with your notes.',
  reject: 'In the live product, this rejects the recommendation and logs the reason.',
  submit: 'In the live product, this submits the claim to MyDeposits.',
  download: 'PDF export is available in the live product.',
} as const

function formatMoney(value: number) {
  return value.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
}

function DemoBadge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`rounded-[1.4rem] border border-stone-200 bg-white ${className}`}>{children}</div>
}

export default function HomepageDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>('overview')
  const [toast, setToast] = useState<DemoToast | null>(null)

  function showToast(message: string) {
    const id = Date.now()

    setToast({ id, message, visible: true })

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? { ...current, visible: false } : current))
    }, 2400)

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 3000)
  }

  function renderOverviewTab() {
    return (
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Documents reviewed', value: '5' },
            { label: 'Issues identified', value: '4', meta: '2 high · 1 medium · 1 low' },
            { label: 'Recommended claim', value: formatMoney(RECOMMENDED_TOTAL) },
            { label: 'AI confidence', value: `${AI_CONFIDENCE}%` },
          ].map((item) => (
            <SectionCard key={item.label} className="p-4 shadow-sm">
              <p className="text-sm text-stone-500">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
                {item.value}
              </p>
              {item.meta ? <p className="mt-2 text-sm text-stone-600">{item.meta}</p> : null}
            </SectionCard>
          ))}
        </div>

        <SectionCard className="p-5 shadow-sm">
          <p className="text-sm leading-7 text-stone-700">
            Renovo has reviewed 5 documents, identified 4 issues, and drafted a partial claim
            recommendation of £640 from a £1,200 deposit. Two issues have high confidence
            photographic evidence. One issue requires manager judgement on fair wear and tear.
            Awaiting your review.
          </p>
        </SectionCard>

        <SectionCard className="p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            {WORKFLOW_STEPS.map((step, index) => {
              const isComplete = step.state === 'complete'
              const isCurrent = step.state === 'current'

              return (
                <div key={step.label} className="flex items-start gap-3 md:flex-col md:gap-4">
                  <div className="flex items-center gap-3 md:w-full">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        isComplete
                          ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
                          : isCurrent
                            ? 'border-amber-200 bg-amber-100 text-amber-800'
                            : 'border-stone-200 bg-stone-100 text-stone-500'
                      }`}
                    >
                      {isComplete ? '✓' : index + 1}
                    </div>
                    {index < WORKFLOW_STEPS.length - 1 ? (
                      <div
                        className={`hidden h-1 flex-1 rounded-full md:block ${
                          isComplete ? 'bg-emerald-200' : isCurrent ? 'bg-amber-200' : 'bg-stone-200'
                        }`}
                      />
                    ) : null}
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      isComplete
                        ? 'text-emerald-900'
                        : isCurrent
                          ? 'text-amber-900'
                          : 'text-stone-500'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>
    )
  }

  function renderEvidenceTab() {
    return (
      <div className="space-y-4">
        <SectionCard className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50/90">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  <th className="px-4 py-3">Document name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Date uploaded</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {DEMO_DOCUMENTS.map((document) => (
                  <tr key={document.id} className="text-sm text-stone-700">
                    <td className="px-4 py-4 font-medium text-stone-900">{document.name}</td>
                    <td className="px-4 py-4">
                      <DemoBadge
                        label={ROLE_LABELS[document.role]}
                        className={ROLE_BADGE_STYLES[document.role]}
                      />
                    </td>
                    <td className="px-4 py-4">{document.format}</td>
                    <td className="px-4 py-4">{document.uploadedAt}</td>
                    <td className="px-4 py-4">
                      <DemoBadge
                        label="Extracted ✓"
                        className="border-emerald-200 bg-emerald-100 text-emerald-800"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <p className="text-sm leading-7 text-stone-500">
          All 5 documents have been extracted and cross-referenced. Facts compared across check-in
          and check-out reports.
        </p>
      </div>
    )
  }

  function renderIssuesTab() {
    return (
      <div className="space-y-4">
        {DEMO_ISSUES.map((issue) => (
          <SectionCard key={issue.id} className="p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-stone-900">
                    {issue.title} — {issue.area}
                  </h3>
                  <DemoBadge
                    label={ISSUE_TYPE_LABELS[issue.type]}
                    className={ISSUE_TYPE_STYLES[issue.type]}
                  />
                  <DemoBadge
                    label={issue.severity[0].toUpperCase() + issue.severity.slice(1)}
                    className={SEVERITY_STYLES[issue.severity]}
                  />
                  <DemoBadge
                    label={RESPONSIBILITY_LABELS[issue.responsibility]}
                    className={RESPONSIBILITY_STYLES[issue.responsibility]}
                  />
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-600">{issue.description}</p>
                <p className="mt-3 text-sm italic text-stone-500">Evidence: {issue.evidence}</p>
              </div>
              <div className="shrink-0 text-left md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Proposed amount
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-900">
                  {formatMoney(issue.amount)}
                </p>
              </div>
            </div>
          </SectionCard>
        ))}

        <div className="flex justify-end border-t border-stone-200 pt-4">
          <p className="text-sm font-semibold text-stone-900">
            Total proposed: {formatMoney(RECOMMENDED_TOTAL)}
          </p>
        </div>
      </div>
    )
  }

  function renderRecommendationTab() {
    return (
      <div className="space-y-4">
        <SectionCard className="border-emerald-200 bg-emerald-50/85 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="app-kicker !text-emerald-700">Recommendation</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">
                {RECOMMENDATION.outcomeLabel}
              </h3>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-emerald-950">
                {formatMoney(RECOMMENDATION.totalRecommended)}
              </p>
              <p className="mt-2 text-sm text-emerald-900/85">
                from {formatMoney(DEPOSIT_TOTAL)} deposit · 4 of 4 issues upheld
              </p>
            </div>
            <DemoBadge
              label={RECOMMENDATION.status}
              className="border-amber-200 bg-amber-100 text-amber-800"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-emerald-900">
              <span>Confidence</span>
              <span className="font-semibold">{RECOMMENDATION.confidence}%</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-white/80">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${RECOMMENDATION.confidence}%` }}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard className="p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">AI rationale</h3>
          <p className="mt-4 text-sm leading-7 text-stone-700">{RECOMMENDATION.rationale}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RECOMMENDATION.sources.map((source) => (
              <span
                key={source}
                className="inline-flex rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
              >
                {source}
              </span>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => showToast(TOAST_MESSAGES.approve)}
              className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium"
            >
              Approve and generate claim
            </button>
            <button
              type="button"
              onClick={() => showToast(TOAST_MESSAGES.revise)}
              className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium"
            >
              Send back for revision
            </button>
            <button
              type="button"
              onClick={() => showToast(TOAST_MESSAGES.reject)}
              className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-50"
            >
              Reject
            </button>
          </div>

          {toast ? (
            <div
              className={`rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition-all duration-300 ${
                toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              }`}
            >
              {toast.message}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  function renderClaimTab() {
    return (
      <div className="space-y-4">
        <SectionCard className="border-emerald-200 bg-emerald-50/85 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-900">Partial claim · Draft</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-950">
                {formatMoney(RECOMMENDED_TOTAL)} of {formatMoney(DEPOSIT_TOTAL)} deposit
              </p>
              <p className="mt-2 text-sm text-emerald-900/85">
                MyDeposits · Ref {CLAIM_REFERENCE}
              </p>
            </div>
            <DemoBadge
              label="Ready to submit"
              className="border-emerald-200 bg-emerald-100 text-emerald-800"
            />
          </div>
        </SectionCard>

        <SectionCard className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50/90">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {CLAIM_LINE_ITEMS.map((item) => (
                  <tr key={item.id} className="text-sm text-stone-700">
                    <td className="px-4 py-4 font-medium text-stone-900">{item.description}</td>
                    <td className="px-4 py-4">
                      <DemoBadge
                        label={ISSUE_TYPE_LABELS[item.category]}
                        className={ISSUE_TYPE_STYLES[item.category]}
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-stone-900">
                      {formatMoney(item.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50/60 text-sm font-semibold text-stone-900">
                  <td className="px-4 py-4" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-4 text-right">{formatMoney(RECOMMENDED_TOTAL)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => showToast(TOAST_MESSAGES.submit)}
              className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium"
            >
              Submit to deposit scheme
            </button>
            <button
              type="button"
              onClick={() => showToast(TOAST_MESSAGES.download)}
              className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium"
            >
              Download PDF summary
            </button>
          </div>

          {toast ? (
            <div
              className={`rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 transition-all duration-300 ${
                toast.visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
              }`}
            >
              {toast.message}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="app-surface min-h-[520px] overflow-hidden rounded-[1.9rem] border border-stone-200 shadow-[0_18px_44px_rgba(55,43,27,0.1)]">
      <div className="border-b border-stone-200 bg-stone-50/90 px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            </div>
            <p className="app-kicker">Renovo</p>
          </div>

          <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-stone-600">
            {CASE_REFERENCE} · 14 Bruntsfield Place
          </p>

          <DemoBadge
            label="Live demo"
            className="border-emerald-200 bg-emerald-100 text-emerald-800"
          />
        </div>
      </div>

      <div className="border-b border-stone-200 bg-white/90 px-3 py-2 md:px-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DEMO_TABS.map((tab) => {
            const active = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-white hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-5 bg-[linear-gradient(180deg,rgba(250,247,242,0.32),rgba(255,255,255,0.92))] p-4 md:p-5">
        <SectionCard className="p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Case context
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                {PROPERTY_ADDRESS}
              </h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Tenant: {TENANT_NAME} · Landlord: {LANDLORD_NAME} · Move-out date: {MOVE_OUT_DATE}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Tenancy
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">{TENANCY_DURATION}</p>
              </div>
              <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Deposit
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">{DEPOSIT_DISPLAY}</p>
              </div>
              <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50/80 px-4 py-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Rent
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">{RENT_DISPLAY}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {activeTab === 'overview' ? renderOverviewTab() : null}
        {activeTab === 'evidence' ? renderEvidenceTab() : null}
        {activeTab === 'issues' ? renderIssuesTab() : null}
        {activeTab === 'recommendation' ? renderRecommendationTab() : null}
        {activeTab === 'claim' ? renderClaimTab() : null}
      </div>
    </div>
  )
}
