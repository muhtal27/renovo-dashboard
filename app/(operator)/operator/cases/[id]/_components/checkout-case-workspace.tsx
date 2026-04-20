'use client'

import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bot,
  Calculator,
  Check,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  Gauge,
  Keyboard,
  Lock,
  MessageSquare,
  Receipt,
  Sparkles,
  User,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useTransition, type ComponentType } from 'react'
import { formatAddress, formatCurrency, formatDate } from '@/app/eot/_components/eot-ui'
import { WorkspaceBadge, WorkspaceSkeleton, WorkspaceSkeletonCard, WorkspaceSkeletonMetrics } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { cn } from '@/lib/ui'
import { relativeTime } from '@/lib/relative-time'
import type { EotCaseStatus } from '@/lib/eot-types'
import {
  normalizeWorkspaceStep,
  type WorkspaceStep,
  type OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

/* ────────────────────────────────────────────────────────────── */
/*  Workflow step definitions                                     */
/* ────────────────────────────────────────────────────────────── */

// Prototype ref: public/demo.html:2311-2312 — 7 steps; step keys and labels are aligned
// with the demo HTML. Analysis step shows "Ready to analyse" while
// caseStatus === 'analysis' and switches to the combined review content once
// the case has progressed to 'review' or later (see renderAnalysisStep dispatch
// in step-analysis.tsx / step-review.tsx).
const WORKFLOW_STEPS: {
  step: WorkspaceStep
  label: string
  icon: typeof ClipboardList
  statusStart: EotCaseStatus | null
}[] = [
  { step: 'inventory',   label: 'Inventory',           icon: ClipboardList, statusStart: null },
  { step: 'checkout',    label: 'Checkout',            icon: FileCheck,     statusStart: 'draft' },
  { step: 'readings',    label: 'Handover',            icon: Gauge,         statusStart: 'collecting_evidence' },
  { step: 'analysis',    label: 'Analysis & Review',   icon: Sparkles,      statusStart: 'analysis' },
  { step: 'deductions',  label: 'Deductions',          icon: Receipt,       statusStart: 'draft_sent' },
  { step: 'negotiation', label: 'Negotiation',         icon: MessageSquare, statusStart: 'ready_for_claim' },
  { step: 'refund',      label: 'Refund',              icon: Banknote,      statusStart: 'submitted' },
]

const STATUS_ORDER: EotCaseStatus[] = [
  'draft',
  'collecting_evidence',
  'analysis',
  'review',
  'draft_sent',
  'ready_for_claim',
  'submitted',
  'resolved',
]

function statusToStep(status: EotCaseStatus): WorkspaceStep {
  if (status === 'disputed') return 'refund'
  if (status === 'resolved') return 'refund'
  if (status === 'submitted') return 'refund'
  if (status === 'ready_for_claim') return 'negotiation'
  if (status === 'draft_sent') return 'deductions'
  // review is folded into analysis per the prototype (Analysis & Review).
  if (status === 'review') return 'analysis'
  if (status === 'analysis') return 'analysis'
  if (status === 'collecting_evidence') return 'readings'
  if (status === 'draft') return 'checkout'
  return 'inventory'
}

// Statuses where the analysis step should show the post-analysis view
// (defect review, liability breakdown, room conditions) rather than the
// "Ready to analyse" intro. Kept as a module constant so step-analysis.tsx
// and StepNavigation can share the definition.
export const ANALYSIS_DONE_STATUSES: ReadonlySet<EotCaseStatus> = new Set<EotCaseStatus>([
  'review',
  'draft_sent',
  'ready_for_claim',
  'submitted',
  'disputed',
  'resolved',
])

function isAnalysisDone(status: EotCaseStatus): boolean {
  return ANALYSIS_DONE_STATUSES.has(status)
}

function getStatusPresentation(status: EotCaseStatus) {
  switch (status) {
    case 'draft':
      return { label: 'Draft', tone: 'draft' as const }
    case 'collecting_evidence':
      return { label: 'Collecting evidence', tone: 'processing' as const }
    case 'analysis':
      return { label: 'Analysing', tone: 'warning' as const }
    case 'review':
      return { label: 'In review', tone: 'review' as const }
    case 'draft_sent':
      return { label: 'Draft sent', tone: 'sent' as const }
    case 'ready_for_claim':
      return { label: 'Ready for claim', tone: 'accepted' as const }
    case 'submitted':
      return { label: 'Submitted', tone: 'submitted' as const }
    case 'disputed':
      return { label: 'Disputed', tone: 'disputed' as const }
    case 'resolved':
      return { label: 'Resolved', tone: 'accepted' as const }
    default:
      return { label: 'Unknown', tone: 'neutral' as const }
  }
}

function priorityBadgeTone(priority: string | null | undefined) {
  switch (priority) {
    case 'high':
      return 'disputed' as const
    case 'medium':
      return 'warning' as const
    default:
      return 'neutral' as const
  }
}

function getDepositSchemeLabel(scheme: string | null | undefined): string | null {
  if (!scheme) return null
  switch (scheme) {
    case 'tds': return 'TDS'
    case 'dps': return 'DPS'
    case 'mydeposits': return 'mydeposits'
    case 'safedeposits_scotland': return 'SafeDeposits Scotland'
    default: return scheme.toUpperCase()
  }
}

// Prototype ref: public/demo.html:2320 — header meta shows human-friendly
// region name derived from the UK country code.
function getRegionLabel(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null
  const code = countryCode.toUpperCase().replace(/^GB[-_]?/, '')
  switch (code) {
    case 'ENG':
    case 'GB-ENG':
      return 'England'
    case 'SCT':
    case 'GB-SCT':
      return 'Scotland'
    case 'WLS':
    case 'GB-WLS':
      return 'Wales'
    case 'NIR':
    case 'GB-NIR':
      return 'Northern Ireland'
    case 'GB':
    case '':
      return 'United Kingdom'
    default:
      return null
  }
}

function getDepositTypeLabel(depositType: string | null | undefined): string | null {
  if (depositType === 'custodial') return 'Custodial'
  if (depositType === 'insurance') return 'Insurance-backed'
  return null
}

// Prototype ref: public/demo.html:1402 — days-until badge for deposit deadline.
function WorkspaceDeadlineBadge({ endDate }: { endDate: string | null | undefined }) {
  if (!endDate) return <WorkspaceBadge label="—" tone="neutral" />
  const target = new Date(endDate)
  if (Number.isNaN(target.getTime())) {
    return <WorkspaceBadge label="—" tone="neutral" />
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) {
    return <WorkspaceBadge label={`${Math.abs(days)}d overdue`} tone="disputed" />
  }
  if (days <= 7) {
    return <WorkspaceBadge label={`${days}d left`} tone="disputed" />
  }
  if (days <= 14) {
    return <WorkspaceBadge label={`${days}d left`} tone="warning" />
  }
  return <WorkspaceBadge label={`${days}d`} tone="neutral" />
}

/* ────────────────────────────────────────────────────────────── */
/*  Step navigation (HTML design: card with icon+label tabs)     */
/* ────────────────────────────────────────────────────────────── */

function WorkflowNav({
  activeStep,
  currentStatus,
  onStepClick,
}: {
  activeStep: WorkspaceStep
  currentStatus: EotCaseStatus
  onStepClick: (step: WorkspaceStep) => void
}) {
  const currentStepKey = statusToStep(currentStatus)
  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => s.step === currentStepKey)
  const isResolved = currentStatus === 'resolved'

  return (
    <div className="overflow-hidden rounded-[10px] border border-zinc-200 bg-white">
      <nav className="flex" aria-label="Case workflow">
        {WORKFLOW_STEPS.map((item, index) => {
          const isComplete = index < currentStepIdx || (isResolved && index <= currentStepIdx)
          const isCurrent = index === currentStepIdx && !isResolved
          const isActive = item.step === activeStep
          // Step locking — prototype ref: public/demo.html:1398-1399.
          // Steps beyond the case's current status are locked; the Continue
          // button is what advances the case (and with it, what unlocks the
          // next step).
          const isLocked = !isResolved && index > currentStepIdx
          const Icon = item.icon

          return (
            <button
              key={item.step}
              type="button"
              onClick={isLocked ? undefined : () => onStepClick(item.step)}
              disabled={isLocked}
              aria-disabled={isLocked}
              aria-current={isActive ? 'step' : undefined}
              title={isLocked ? 'Complete previous steps first' : item.label}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-medium whitespace-nowrap transition-all',
                isActive
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold'
                  : isComplete
                    ? 'border-emerald-300 text-emerald-600 hover:bg-zinc-50'
                    : isLocked
                      ? 'cursor-not-allowed border-transparent text-zinc-300 opacity-60'
                      : 'border-transparent text-zinc-500 hover:bg-zinc-50',
              )}
            >
              {isLocked ? (
                <span className="text-zinc-300">
                  <Lock className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              ) : isComplete ? (
                <span className="text-emerald-500">
                  <CheckCircle className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              ) : (
                <span className={cn('opacity-60', isActive && 'opacity-100')}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              )}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Sidebar cards (Case Overview, Claim Summary, Documents)      */
/* ────────────────────────────────────────────────────────────── */

function WorkspaceSidebar({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const propertyAddress = formatAddress([
    data.workspace.property.address_line_1,
    data.workspace.property.address_line_2,
    data.workspace.property.city,
    data.workspace.property.postcode,
  ])
  const depositAmount = data.workspace.totals.depositAmount
  const depositScheme = getDepositSchemeLabel(data.checkoutCase?.depositScheme)
  const startDate = data.workspace.tenancy.start_date
  const endDate = data.workspace.tenancy.end_date
  const reference = data.checkoutCase?.caseReference ?? data.workspace.case.id.slice(0, 8).toUpperCase()
  const caseStatus = data.workspace.case.status
  const showDeadline = caseStatus !== 'resolved'

  const totalClaim = data.workspace.totals.totalClaimed ?? 0
  const defectCount = data.defects.length
  const returnToTenant = data.workspace.totals.returnToTenant
  const claimPct = depositAmount ? Math.round((totalClaim / depositAmount) * 100) : 0

  // Prototype ref: public/demo.html:2352-2354 — documents list is data-driven,
  // not hardcoded to check-in/checkout/analysis labels.
  const documents = buildWorkspaceDocumentEntries(data)
  const timeline = data.timeline ?? []

  return (
    <div className="space-y-4">
      {/* Case Overview */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900">Case Overview</h4>
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Property</div>
            <div className="mt-1 text-[13px] text-zinc-700">{propertyAddress}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Deposit</div>
            <div className="mt-1 text-[13px] font-semibold text-zinc-700">
              {depositAmount ? formatCurrency(depositAmount) : '—'}
              {depositScheme ? ` · ${depositScheme}` : ''}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Period</div>
            <div className="mt-1 text-[13px] text-zinc-700">
              {formatDate(startDate)} – {formatDate(endDate)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Deadline</div>
            <div className="mt-1">
              {showDeadline ? (
                <WorkspaceDeadlineBadge endDate={endDate} />
              ) : (
                <WorkspaceBadge label="Closed" tone="neutral" />
              )}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Reference</div>
            <div className="mt-1 text-[13px] text-zinc-700">{reference}</div>
          </div>
        </div>
      </div>

      {/* Claim Summary */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900">Claim Summary</h4>
        <div className="text-2xl font-bold tabular-nums text-emerald-600">
          {formatCurrency(totalClaim)}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {defectCount} item{defectCount !== 1 ? 's' : ''}
          {returnToTenant != null ? ` · ${formatCurrency(returnToTenant)} return to tenant` : ''}
        </div>
        {depositAmount ? (
          <>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(claimPct, 100)}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">{claimPct}% of deposit</div>
          </>
        ) : null}
      </div>

      {/* Documents — prototype ref: public/demo.html:2352-2354 */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h4 className="mb-3 text-sm font-semibold text-zinc-900">Documents</h4>
        <div className="space-y-3">
          {documents.length > 0 ? (
            documents.map((doc) => {
              const Icon = doc.icon
              return (
                <div key={doc.id} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="truncate text-[13px] text-zinc-700">{doc.label}</span>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-zinc-400">No documents linked yet</p>
          )}
        </div>
      </div>

      {/* Activity Log — prototype ref: public/demo.html:1400 wsAuditLog */}
      {timeline.length > 0 ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h4 className="mb-3 text-sm font-semibold text-zinc-900">Activity Log</h4>
          <ol className="space-y-3">
            {timeline.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-zinc-700">{entry.eventDescription}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {entry.performedBy ? `${entry.performedBy} · ` : ''}
                    {relativeTime(entry.eventDate)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

// Prototype ref: public/demo.html:2352-2354 — the sidebar Documents list
// is driven by the actual uploaded documents plus a synthetic "AI Analysis
// Report" entry once analysis has completed.
function buildWorkspaceDocumentEntries(
  data: OperatorCheckoutWorkspaceData
): Array<{ id: string; label: string; icon: typeof FileCheck }> {
  const entries: Array<{ id: string; label: string; icon: typeof FileCheck }> = []
  const seen = new Set<string>()

  for (const doc of data.documents) {
    const label = docLabel(doc)
    if (seen.has(label)) continue
    seen.add(label)
    entries.push({ id: doc.id, label, icon: FileCheck })
  }

  const status = data.workspace.case.status
  const analysisDone = status !== 'draft' && status !== 'collecting_evidence'
  if (analysisDone) {
    entries.push({ id: 'ai-analysis', label: 'AI Analysis Report', icon: Sparkles })
  }

  return entries
}

function docLabel(doc: { documentType: string; documentName: string | null }): string {
  switch (doc.documentType) {
    case 'checkin': return 'Check-in Report'
    case 'checkout': return 'Checkout Report'
    case 'tenancy': return 'Tenancy Agreement'
    case 'schedule_of_condition': return 'Schedule of Condition'
    case 'previous_inspection': return 'Previous Inspection'
    case 'contractor_quote': return 'Contractor Quote'
    case 'correspondence': return 'Correspondence'
    default: return doc.documentName || 'Document'
  }
}

/* ────────────────────────────────────────────────────────────── */
/*  Step navigation buttons (Back / Continue)                     */
/* ────────────────────────────────────────────────────────────── */

const STEP_NAV: Record<WorkspaceStep, { prevStep: WorkspaceStep | null; nextStep: WorkspaceStep | null; nextLabel: string }> = {
  inventory:   { prevStep: null,          nextStep: 'checkout',    nextLabel: 'Continue to Checkout' },
  checkout:    { prevStep: 'inventory',   nextStep: 'readings',    nextLabel: 'Continue to Handover' },
  readings:    { prevStep: 'checkout',    nextStep: 'analysis',    nextLabel: 'Continue to Analysis' },
  analysis:    { prevStep: 'readings',    nextStep: 'deductions',  nextLabel: 'Continue to Deductions' },
  deductions:  { prevStep: 'analysis',    nextStep: 'negotiation', nextLabel: 'Continue to Negotiation' },
  negotiation: { prevStep: 'deductions',  nextStep: 'refund',      nextLabel: 'Continue to Refund' },
  refund:      { prevStep: 'negotiation', nextStep: null,          nextLabel: '' },
}

function StepNavigation({
  activeStep,
  caseStatus,
  onStepClick,
}: {
  activeStep: WorkspaceStep
  caseStatus: string
  onStepClick: (step: WorkspaceStep) => void
}) {
  const nav = STEP_NAV[activeStep]
  if (!nav) return null

  /* Analysis step: only show "Start Review" when analysis is complete */
  const analysisComplete = activeStep === 'analysis' && ['review', 'draft_sent', 'ready_for_claim', 'submitted', 'resolved', 'disputed'].includes(caseStatus)
  const showNext = activeStep === 'analysis' ? analysisComplete : nav.nextStep !== null
  /* Refund step handles its own action buttons */
  const isRefund = activeStep === 'refund'

  return (
    <div className={cn('flex pt-2', nav.prevStep ? 'justify-between' : 'justify-end')}>
      {nav.prevStep ? (
        <button
          type="button"
          onClick={() => onStepClick(nav.prevStep!)}
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      ) : null}
      {showNext && !isRefund && nav.nextStep ? (
        <button
          type="button"
          onClick={() => onStepClick(nav.nextStep!)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          {nav.nextLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Step → component mapping                                      */
/* ────────────────────────────────────────────────────────────── */

const STEP_COMPONENTS: Record<WorkspaceStep, ComponentType<{ data: OperatorCheckoutWorkspaceData }>> = {
  inventory:   dynamic(() => import('./step-inventory').then((m) => m.StepInventory)),
  checkout:    dynamic(() => import('./step-checkout-report').then((m) => m.StepCheckoutReport)),
  readings:    dynamic(() => import('./step-readings').then((m) => m.StepReadings)),
  // Analysis step dispatches internally to the "ready to analyse" or
  // "Analysis & Review" view based on case status (prototype wsAnalysisDone).
  analysis:    dynamic(() => import('./step-analysis').then((m) => m.StepAnalysis)),
  deductions:  dynamic(() => import('./step-deductions').then((m) => m.StepDeductions)),
  negotiation: dynamic(() => import('./step-negotiation').then((m) => m.StepNegotiation)),
  refund:      dynamic(() => import('./step-refund').then((m) => m.StepRefund)),
}

/* ────────────────────────────────────────────────────────────── */
/*  Main workspace                                                */
/* ────────────────────────────────────────────────────────────── */

export function CheckoutCaseWorkspace({
  data,
  initialTab,
}: {
  data: OperatorCheckoutWorkspaceData
  initialTab: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const urlStep = normalizeWorkspaceStep(searchParams.get('step') ?? searchParams.get('tab'))
  const activeStep = urlStep || (normalizeWorkspaceStep(initialTab) as WorkspaceStep)
  const ActiveStepComponent = STEP_COMPONENTS[activeStep]

  const currentStatus = data.workspace.case.status
  const status = getStatusPresentation(currentStatus)

  const propertyName = data.workspace.property.address_line_1 || formatAddress([
    data.workspace.property.address_line_1,
    data.workspace.property.city,
  ])
  const caseReference = data.checkoutCase?.caseReference ?? data.workspace.case.id.slice(0, 8).toUpperCase()
  const tenantName = data.workspace.tenant.name
  const landlordName = data.workspace.overview.landlords[0]?.fullName
  const lastModified = data.checkoutCase?.updatedAt ?? data.workspace.case.updated_at
  const assignedTo = data.checkoutCase?.assignedTo
  const priority = data.workspace.case.priority
  // Prototype ref: public/demo.html:2320 — header meta includes region
  // and deposit type so the operator can see jurisdiction + custodial/insured
  // at a glance.
  const regionLabel = getRegionLabel(data.workspace.property.country_code)
  const depositTypeLabel = getDepositTypeLabel(data.checkoutCase?.depositType)
  const headerMetaParts = [
    caseReference,
    tenantName,
    landlordName,
    regionLabel,
    depositTypeLabel,
  ].filter((part): part is string => Boolean(part))

  // Analysis step goes full-width once analysis is complete, matching the
  // prototype's `state.wsStep==='analysis' && state.wsAnalysisDone` layout.
  const isFullWidthStep = activeStep === 'analysis' && isAnalysisDone(currentStatus)

  const handleStepClick = useCallback(
    (step: WorkspaceStep) => {
      if (!pathname) return

      if (
        (window as unknown as Record<string, boolean>).__workspaceDirty &&
        !window.confirm('You have unsaved changes. Discard and switch steps?')
      ) {
        return
      }

      startTransition(() => {
        const nextParams = new URLSearchParams(searchParams.toString())
        nextParams.delete('tab')

        if (step === 'inventory') {
          nextParams.delete('step')
        } else {
          nextParams.set('step', step)
        }

        const query = nextParams.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      })
    },
    [pathname, router, searchParams, startTransition]
  )

  // Keyboard navigation: Ctrl+← / Ctrl+→ to move between steps. Respects
  // the same lock rule as the nav tabs — cannot jump ahead of the case's
  // current status.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      e.preventDefault()
      const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.step === activeStep)
      if (currentIndex < 0) return

      const currentStepKey = statusToStep(currentStatus)
      const maxReachableIdx = WORKFLOW_STEPS.findIndex((s) => s.step === currentStepKey)

      const nextIndex =
        e.key === 'ArrowRight'
          ? Math.min(currentIndex + 1, maxReachableIdx >= 0 ? maxReachableIdx : WORKFLOW_STEPS.length - 1)
          : Math.max(currentIndex - 1, 0)

      if (nextIndex !== currentIndex) {
        handleStepClick(WORKFLOW_STEPS[nextIndex].step)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeStep, currentStatus, handleStepClick])

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* ── Case Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/tenancies"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-[200px] flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{propertyName}</h2>
          <p className="text-[13px] text-zinc-500">{headerMetaParts.join(' · ')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {lastModified ? (
            <span className="text-xs text-zinc-400">{relativeTime(lastModified)}</span>
          ) : null}
          {priority ? (
            <WorkspaceBadge
              label={priority.charAt(0).toUpperCase() + priority.slice(1)}
              tone={priorityBadgeTone(priority)}
            />
          ) : null}
          {assignedTo ? (
            <span className="text-xs font-medium text-zinc-700">{assignedTo}</span>
          ) : (
            <WorkspaceBadge label="Unassigned" tone="warning" />
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Bot className="h-3.5 w-3.5" />
            AI
          </button>
        </div>
      </div>

      {/* ── Step Navigation ── */}
      <WorkflowNav
        activeStep={activeStep}
        currentStatus={currentStatus}
        onStepClick={handleStepClick}
      />

      {/* ── Step Content (2-col with sidebar, or full-width for review) ── */}
      {isPending ? (
        <div className="space-y-6 animate-fade-in-up">
          <WorkspaceSkeletonMetrics count={4} />
          <WorkspaceSkeleton width="w-1/3" height="h-4" />
          <WorkspaceSkeleton width="w-full" height="h-3" />
          <WorkspaceSkeleton width="w-2/3" height="h-3" />
          <WorkspaceSkeletonCard />
        </div>
      ) : isFullWidthStep ? (
        /* Analysis & Review (post-analysis) — full-width, no sidebar */
        <div className="space-y-4">
          <ActiveStepComponent data={data} />
          <StepNavigation activeStep={activeStep} caseStatus={currentStatus} onStepClick={handleStepClick} />
        </div>
      ) : (
        /* All other steps — 2-column with sidebar */
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4 min-w-0">
            <ActiveStepComponent data={data} />
            <StepNavigation activeStep={activeStep} caseStatus={currentStatus} onStepClick={handleStepClick} />
          </div>
          <WorkspaceSidebar data={data} />
        </div>
      )}
    </div>
  )
}
