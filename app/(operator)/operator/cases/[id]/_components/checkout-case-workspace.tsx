'use client'

import { Check } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition, type ComponentType } from 'react'
import { formatAddress, formatDate } from '@/app/eot/_components/eot-ui'
import { WorkspaceBadge } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { StepOverview } from '@/app/(operator)/operator/cases/[id]/_components/step-overview'
import { StepDraft } from '@/app/(operator)/operator/cases/[id]/_components/step-draft'
import { StepEvidence } from '@/app/(operator)/operator/cases/[id]/_components/step-evidence'
import { StepAnalysis } from '@/app/(operator)/operator/cases/[id]/_components/step-analysis'
import { StepReview } from '@/app/(operator)/operator/cases/[id]/_components/step-review'
import { StepDraftSent } from '@/app/(operator)/operator/cases/[id]/_components/step-draft-sent'
import { StepReady } from '@/app/(operator)/operator/cases/[id]/_components/step-ready'
import { StepSubmitted } from '@/app/(operator)/operator/cases/[id]/_components/step-submitted'
import { StepResolved } from '@/app/(operator)/operator/cases/[id]/_components/step-resolved'
import { cn } from '@/lib/ui'
import type { EotCaseStatus } from '@/lib/eot-types'
import {
  normalizeWorkspaceStep,
  type WorkspaceStep,
  type OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

/* ────────────────────────────────────────────────────────────── */
/*  Workflow step definitions                                     */
/* ────────────────────────────────────────────────────────────── */

const WORKFLOW_STEPS: { step: WorkspaceStep; label: string; status: EotCaseStatus | null }[] = [
  { step: 'overview', label: 'Overview', status: null },
  { step: 'draft', label: 'Draft', status: 'draft' },
  { step: 'collecting-evidence', label: 'Evidence', status: 'collecting_evidence' },
  { step: 'analysis', label: 'Analysing', status: 'analysis' },
  { step: 'review', label: 'Review', status: 'review' },
  { step: 'draft-sent', label: 'Draft sent', status: 'draft_sent' },
  { step: 'ready-for-claim', label: 'Ready', status: 'ready_for_claim' },
  { step: 'submitted', label: 'Submitted', status: 'submitted' },
  { step: 'resolved', label: 'Resolved', status: 'resolved' },
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

function getStatusIndex(status: EotCaseStatus): number {
  const index = STATUS_ORDER.indexOf(status)
  return index >= 0 ? index : 0
}

function statusToStep(status: EotCaseStatus): WorkspaceStep {
  if (status === 'disputed') return 'resolved'
  const match = WORKFLOW_STEPS.find((s) => s.status === status)
  return match?.step ?? 'overview'
}

/* ────────────────────────────────────────────────────────────── */
/*  Clickable workflow navigation                                 */
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
  const currentIndex = getStatusIndex(currentStatus)
  const isDisputed = currentStatus === 'disputed'

  return (
    <nav className="flex flex-wrap items-center gap-0.5" aria-label="Case workflow">
      {WORKFLOW_STEPS.map((item, index) => {
        const stepStatusIndex = item.status ? STATUS_ORDER.indexOf(item.status) : -1
        const isComplete = !isDisputed && item.status != null && stepStatusIndex < currentIndex
        const isCurrent = item.status === currentStatus || (isDisputed && item.step === 'resolved')
        const isActive = item.step === activeStep
        const isProcessing = isCurrent && currentStatus === 'analysis'

        return (
          <div key={item.step} className="flex items-center gap-0.5">
            {index > 0 ? (
              <div className={`h-px w-4 ${isComplete ? 'bg-emerald-300' : 'bg-zinc-200'}`} />
            ) : null}
            <button
              type="button"
              onClick={() => onStepClick(item.step)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-950'
                  : isCurrent
                    ? 'text-zinc-950 hover:bg-zinc-50'
                    : isComplete
                      ? 'text-emerald-600 hover:bg-emerald-50/50'
                      : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'
              )}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
              ) : isCurrent ? (
                <div
                  className={`h-2 w-2 rounded-full ${
                    isProcessing ? 'animate-pulse bg-amber-500' : isDisputed ? 'bg-rose-500' : 'bg-zinc-900'
                  }`}
                />
              ) : item.step === 'overview' ? (
                <div className="h-2 w-2 rounded-full bg-zinc-400" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              )}
              {item.label}
            </button>
          </div>
        )
      })}
    </nav>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  Step → component mapping                                      */
/* ────────────────────────────────────────────────────────────── */

const STEP_COMPONENTS: Record<WorkspaceStep, ComponentType<{ data: OperatorCheckoutWorkspaceData }>> = {
  overview: StepOverview,
  draft: StepDraft,
  'collecting-evidence': StepEvidence,
  analysis: StepAnalysis,
  review: StepReview,
  'draft-sent': StepDraftSent,
  'ready-for-claim': StepReady,
  submitted: StepSubmitted,
  resolved: StepResolved,
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

  function handleStepClick(step: WorkspaceStep) {
    if (!pathname) return

    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.delete('tab')

      if (step === 'overview') {
        nextParams.delete('step')
      } else {
        nextParams.set('step', step)
      }

      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <div className="space-y-6">
      {/* Case header */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          {`Case #${caseReference}`}
        </p>
        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-zinc-950 [overflow-wrap:anywhere]">
              {propertyAddress}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <WorkspaceBadge label={status.label} tone={status.tone} />
              <span className="text-xs text-zinc-400">
                Checkout {formatDate(data.checkoutCase?.checkoutDate ?? data.workspace.tenancy.end_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Workflow navigation */}
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <WorkflowNav
            activeStep={activeStep}
            currentStatus={currentStatus}
            onStepClick={handleStepClick}
          />
        </div>
      </section>

      {/* Step content */}
      <section
        aria-busy={isPending}
        className={cn(
          'border border-zinc-200/80 bg-white px-6 py-6 md:px-7',
          isPending ? 'opacity-80' : null
        )}
      >
        <ActiveStepComponent data={data} />
      </section>
    </div>
  )
}
