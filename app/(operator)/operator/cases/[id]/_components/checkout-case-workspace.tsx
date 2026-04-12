'use client'

import {
  Check,
  ClipboardList,
  ClipboardCheck,
  Gauge,
  Sparkles,
  Eye,
  Calculator,
  Banknote,
  User,
  Clock,
  Keyboard,
  Shield,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useTransition, type ComponentType } from 'react'
import { formatAddress, formatDate } from '@/app/eot/_components/eot-ui'
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

const WORKFLOW_STEPS: {
  step: WorkspaceStep
  label: string
  icon: typeof ClipboardList
  /** The first status that maps to this step */
  statusStart: EotCaseStatus | null
}[] = [
  { step: 'inventory', label: 'Inventory', icon: ClipboardList, statusStart: null },
  { step: 'checkout', label: 'Checkout', icon: ClipboardCheck, statusStart: 'draft' },
  { step: 'readings', label: 'Readings', icon: Gauge, statusStart: 'collecting_evidence' },
  { step: 'analysis', label: 'Analysis', icon: Sparkles, statusStart: 'analysis' },
  { step: 'review', label: 'Review', icon: Eye, statusStart: 'review' },
  { step: 'deductions', label: 'Deductions', icon: Calculator, statusStart: 'draft_sent' },
  { step: 'refund', label: 'Refund', icon: Banknote, statusStart: 'submitted' },
]

/** Ordered list of statuses for progress comparison */
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

function getStatusIndex(status: EotCaseStatus): number {
  const index = STATUS_ORDER.indexOf(status)
  return index >= 0 ? index : 0
}

function statusToStep(status: EotCaseStatus): WorkspaceStep {
  if (status === 'disputed') return 'refund'
  if (status === 'resolved') return 'refund'
  if (status === 'submitted') return 'refund'
  if (status === 'ready_for_claim') return 'deductions'
  if (status === 'draft_sent') return 'deductions'
  if (status === 'review') return 'review'
  if (status === 'analysis') return 'analysis'
  if (status === 'collecting_evidence') return 'readings'
  if (status === 'draft') return 'checkout'
  return 'inventory'
}

/** Get the date to show under a step, if any */
function getStepDate(step: WorkspaceStep, data: OperatorCheckoutWorkspaceData): string | null {
  switch (step) {
    case 'inventory':
      return data.checkoutCase?.checkinDate ?? null
    case 'checkout':
      return data.checkoutCase?.checkoutDate ?? data.workspace.tenancy.end_date ?? null
    default:
      return null
  }
}

/* ────────────────────────────────────────────────────────────── */
/*  Visual workflow navigation (competitor-style step bar)        */
/* ────────────────────────────────────────────────────────────── */

function WorkflowNav({
  activeStep,
  currentStatus,
  data,
  onStepClick,
}: {
  activeStep: WorkspaceStep
  currentStatus: EotCaseStatus
  data: OperatorCheckoutWorkspaceData
  onStepClick: (step: WorkspaceStep) => void
}) {
  const currentStepKey = statusToStep(currentStatus)
  const currentStepIdx = WORKFLOW_STEPS.findIndex((s) => s.step === currentStepKey)
  const isDisputed = currentStatus === 'disputed'
  const isResolved = currentStatus === 'resolved'

  return (
    <nav className="w-full overflow-x-auto scrollbar-none" aria-label="Case workflow">
      <div className="flex items-start justify-between gap-0 min-w-[480px]">
        {WORKFLOW_STEPS.map((item, index) => {
          const stepIdx = index
          const isComplete = stepIdx < currentStepIdx || (isResolved && stepIdx <= currentStepIdx)
          const isCurrent = stepIdx === currentStepIdx && !isResolved
          const isActive = item.step === activeStep
          const isProcessing = isCurrent && currentStatus === 'analysis'

          const Icon = item.icon
          const dateLabel = getStepDate(item.step, data)

          return (
            <div key={item.step} className="flex items-start" style={{ flex: '1 1 0' }}>
              {/* Connecting line (before this step) */}
              {index > 0 ? (
                <div className="flex-1 pt-[16px] sm:pt-[18px]">
                  <div
                    className={cn(
                      'h-[2px] w-full',
                      isComplete || isCurrent ? 'bg-sky-400' : 'bg-zinc-200/60'
                    )}
                  />
                </div>
              ) : null}

              {/* Step column */}
              <button
                type="button"
                onClick={() => onStepClick(item.step)}
                className={cn(
                  'group flex flex-col items-center gap-1.5 px-1',
                  'transition-colors focus:outline-none',
                  isActive ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                )}
              >
                {/* Icon circle */}
                <div
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors sm:h-9 sm:w-9',
                    isComplete
                      ? 'border-sky-400 bg-sky-400 text-white'
                      : isCurrent
                        ? isDisputed
                          ? 'border-rose-500 bg-rose-500 text-white'
                          : isProcessing
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-sky-500 bg-sky-500 text-white'
                        : isActive
                          ? 'border-sky-300 bg-sky-50 text-sky-600'
                          : 'border-zinc-200/60 bg-white text-zinc-400 group-hover:border-zinc-300 group-hover:text-zinc-500'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : isProcessing ? (
                    <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-30" />
                  ) : null}
                  {isComplete ? null : <Icon className="h-4 w-4" strokeWidth={2} />}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'text-[11px] font-semibold leading-tight',
                    isComplete
                      ? 'text-sky-600'
                      : isCurrent
                        ? isDisputed
                          ? 'text-rose-600'
                          : 'text-zinc-950'
                        : isActive
                          ? 'text-sky-600'
                          : 'text-zinc-400 group-hover:text-zinc-600'
                  )}
                >
                  {item.label}
                </span>

                {/* Date below label */}
                {dateLabel ? (
                  <span className="text-[10px] text-zinc-400">{formatDate(dateLabel)}</span>
                ) : null}
              </button>

              {/* Connecting line (after this step) */}
              {index < WORKFLOW_STEPS.length - 1 ? (
                <div className="flex-1 pt-[16px] sm:pt-[18px]">
                  <div
                    className={cn(
                      'h-[2px] w-full',
                      isComplete ? 'bg-sky-400' : 'bg-zinc-200/60'
                    )}
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Step → component mapping                                      */
/* ────────────────────────────────────────────────────────────── */

const STEP_COMPONENTS: Record<WorkspaceStep, ComponentType<{ data: OperatorCheckoutWorkspaceData }>> = {
  inventory: dynamic(() => import('./step-inventory').then((m) => m.StepInventory)),
  checkout: dynamic(() => import('./step-checkout-report').then((m) => m.StepCheckoutReport)),
  readings: dynamic(() => import('./step-readings').then((m) => m.StepReadings)),
  analysis: dynamic(() => import('./step-analysis').then((m) => m.StepAnalysis)),
  review: dynamic(() => import('./step-review').then((m) => m.StepReview)),
  deductions: dynamic(() => import('./step-deductions').then((m) => m.StepDeductions)),
  refund: dynamic(() => import('./step-refund').then((m) => m.StepRefund)),
}

/* ────────────────────────────────────────────────────────────── */
/*  Status badge presentation                                     */
/* ────────────────────────────────────────────────────────────── */

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

/* ────────────────────────────────────────────────────────────── */
/*  Deposit scheme labels                                         */
/* ────────────────────────────────────────────────────────────── */

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

  const propertyAddress = formatAddress([
    data.workspace.property.address_line_1,
    data.workspace.property.address_line_2,
    data.workspace.property.city,
    data.workspace.property.postcode,
    data.workspace.property.country_code,
  ])
  const caseReference =
    data.checkoutCase?.caseReference ?? data.workspace.case.id.slice(0, 8).toUpperCase()

  const depositSchemeLabel = getDepositSchemeLabel(data.checkoutCase?.depositScheme)
  const lastModified = data.checkoutCase?.updatedAt ?? data.workspace.case.updated_at
  const assignedTo = data.checkoutCase?.assignedTo

  const handleStepClick = useCallback(
    (step: WorkspaceStep) => {
      if (!pathname) return

      // Guard against navigating away with unsaved changes (#21)
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

  // Keyboard navigation: Ctrl+← / Ctrl+→ to move between steps
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger with Ctrl/Cmd modifier to avoid interfering with text editing
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      // Don't trigger when inside input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      e.preventDefault()
      const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.step === activeStep)
      if (currentIndex < 0) return

      const nextIndex =
        e.key === 'ArrowRight'
          ? Math.min(currentIndex + 1, WORKFLOW_STEPS.length - 1)
          : Math.max(currentIndex - 1, 0)

      if (nextIndex !== currentIndex) {
        handleStepClick(WORKFLOW_STEPS[nextIndex].step)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeStep, handleStepClick])

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Case header */}
      <section className="border border-zinc-200/60 bg-white px-6 py-6 md:px-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            {`Case #${caseReference}`}
          </p>
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            {assignedTo ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <User className="h-3 w-3" />
                {assignedTo}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-500">
                <User className="h-3 w-3" />
                Unassigned
              </span>
            )}
            {lastModified ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                <Clock className="h-3 w-3" />
                {relativeTime(lastModified)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-zinc-950 [overflow-wrap:anywhere]">
              {propertyAddress}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <WorkspaceBadge label={status.label} tone={status.tone} />
              {depositSchemeLabel ? (
                <WorkspaceBadge label={depositSchemeLabel} tone="info" />
              ) : null}
              <span className="text-xs text-zinc-400">
                Checkout {formatDate(data.checkoutCase?.checkoutDate ?? data.workspace.tenancy.end_date)}
              </span>
              {data.defects.length > 0 ? (
                <span className="text-xs text-zinc-400">
                  · {data.defects.length} defects · {data.rooms.length} rooms
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Workflow navigation — competitor-style step bar */}
        <div className="mt-6 border-t border-zinc-100/80 pt-5">
          <WorkflowNav
            activeStep={activeStep}
            currentStatus={currentStatus}
            data={data}
            onStepClick={handleStepClick}
          />
          <p className="mt-2 hidden items-center gap-1 text-[10px] text-zinc-400 sm:flex">
            <Keyboard className="h-3 w-3" />
            <kbd className="border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[9px] font-medium">Ctrl</kbd>
            <span>+</span>
            <kbd className="border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[9px] font-medium">&larr;</kbd>
            <kbd className="border border-zinc-200 bg-zinc-50 px-1 py-0.5 text-[9px] font-medium">&rarr;</kbd>
            <span>to navigate steps</span>
          </p>
        </div>
      </section>

      {/* Step content */}
      <section
        aria-busy={isPending}
        className="border border-zinc-200/60 bg-white px-6 py-6 md:px-7"
      >
        {isPending ? (
          <div className="space-y-6 animate-fade-in-up">
            <WorkspaceSkeletonMetrics count={4} />
            <WorkspaceSkeleton width="w-1/3" height="h-4" />
            <WorkspaceSkeleton width="w-full" height="h-3" />
            <WorkspaceSkeleton width="w-2/3" height="h-3" />
            <WorkspaceSkeletonCard />
          </div>
        ) : (
          <ActiveStepComponent data={data} />
        )}
      </section>
    </div>
  )
}
