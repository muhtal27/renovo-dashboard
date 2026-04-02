'use client'

import { Check } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition, type ComponentType } from 'react'
import { formatAddress, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { WorkspaceBadge, WorkspaceTabBar, type WorkspaceTabItem } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { CaseDefects } from '@/app/(operator)/operator/cases/[id]/_components/case-defects'
import { CaseDocuments } from '@/app/(operator)/operator/cases/[id]/_components/case-documents'
import { CaseNegotiation } from '@/app/(operator)/operator/cases/[id]/_components/case-negotiation'
import { CaseOverview } from '@/app/(operator)/operator/cases/[id]/_components/case-overview'
import { CaseProcess } from '@/app/(operator)/operator/cases/[id]/_components/case-process'
import { CaseSendOut } from '@/app/(operator)/operator/cases/[id]/_components/case-send-out'
import { CaseSubmission } from '@/app/(operator)/operator/cases/[id]/_components/case-submission'
import { CaseUtilities } from '@/app/(operator)/operator/cases/[id]/_components/case-utilities'
import { cn } from '@/lib/ui'
import type { EotCaseStatus } from '@/lib/eot-types'
import {
  normalizeCheckoutWorkspaceTab,
  type CheckoutWorkspaceTab,
  type OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

const WORKFLOW_STEPS: { status: EotCaseStatus; label: string }[] = [
  { status: 'draft', label: 'Draft' },
  { status: 'collecting_evidence', label: 'Evidence' },
  { status: 'analysis', label: 'Analysing' },
  { status: 'review', label: 'Review' },
  { status: 'draft_sent', label: 'Draft sent' },
  { status: 'ready_for_claim', label: 'Ready' },
  { status: 'submitted', label: 'Submitted' },
  { status: 'resolved', label: 'Resolved' },
]

function getStepIndex(status: EotCaseStatus): number {
  const index = WORKFLOW_STEPS.findIndex((s) => s.status === status)
  return index >= 0 ? index : 0
}

function WorkflowProgressTrack({ currentStatus }: { currentStatus: EotCaseStatus }) {
  const currentIndex = getStepIndex(currentStatus)
  const isDisputed = currentStatus === 'disputed'

  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {WORKFLOW_STEPS.map((step, index) => {
        const isComplete = !isDisputed && index < currentIndex
        const isCurrent = step.status === currentStatus
        const isProcessing = isCurrent && currentStatus === 'analysis'

        return (
          <div key={step.status} className="flex items-center gap-0.5">
            {index > 0 ? (
              <div className={`h-px w-4 ${isComplete ? 'bg-emerald-300' : 'bg-zinc-200'}`} />
            ) : null}
            <div
              className={`flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-medium ${
                isCurrent
                  ? 'text-zinc-950'
                  : isComplete
                    ? 'text-emerald-600'
                    : 'text-zinc-400'
              }`}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
              ) : isCurrent ? (
                <div
                  className={`h-2 w-2 rounded-full ${
                    isProcessing ? 'animate-pulse bg-amber-500' : 'bg-zinc-900'
                  }`}
                />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
              )}
              {step.label}
            </div>
          </div>
        )
      })}
      {isDisputed ? (
        <div className="flex items-center gap-0.5">
          <div className="h-px w-4 bg-zinc-200" />
          <div className="flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-medium text-rose-700">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            Disputed
          </div>
        </div>
      ) : null}
    </div>
  )
}

const TAB_ITEMS: WorkspaceTabItem<CheckoutWorkspaceTab>[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'process', label: 'Process' },
  { id: 'documents', label: 'Documents' },
  { id: 'defects', label: 'Defects & liability' },
  { id: 'utilities', label: 'Utilities & keys' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'send-out', label: 'Send out' },
  { id: 'submission', label: 'Submission' },
]

const TAB_COMPONENTS: Record<
  CheckoutWorkspaceTab,
  ComponentType<{ data: OperatorCheckoutWorkspaceData }>
> = {
  overview: CaseOverview,
  process: CaseProcess,
  documents: CaseDocuments,
  defects: CaseDefects,
  utilities: CaseUtilities,
  negotiation: CaseNegotiation,
  'send-out': CaseSendOut,
  submission: CaseSubmission,
}

function getStatusPresentation(status: string | null | undefined) {
  switch (status) {
    case 'ready':
      return {
        label: 'Ready to finalise',
        tone: 'accepted' as const,
      }
    case 'sent':
      return {
        label: 'Sent',
        tone: 'sent' as const,
      }
    case 'submitted':
      return {
        label: 'Submitted',
        tone: 'submitted' as const,
      }
    case 'disputed':
      return {
        label: 'Disputed',
        tone: 'disputed' as const,
      }
    case 'closed':
      return {
        label: 'Closed',
        tone: 'neutral' as const,
      }
    case 'in_review':
    default:
      return {
        label: 'In review',
        tone: 'review' as const,
      }
  }
}

function getWorkspaceHref(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function CheckoutCaseWorkspace({
  data,
  initialTab,
}: {
  data: OperatorCheckoutWorkspaceData
  initialTab: CheckoutWorkspaceTab
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const urlTab = normalizeCheckoutWorkspaceTab(searchParams.get('tab'))
  const activeTab = urlTab || initialTab
  const ActiveTabComponent = TAB_COMPONENTS[activeTab]
  const status = getStatusPresentation(data.checkoutCase?.status)
  const propertyAddress = formatAddress([
    data.workspace.property.address_line_1,
    data.workspace.property.address_line_2,
    data.workspace.property.city,
    data.workspace.property.postcode,
    data.workspace.property.country_code,
  ])
  const caseReference = data.checkoutCase?.caseReference ?? data.workspace.case.id.slice(0, 8).toUpperCase()
  const metadataItems = [
    {
      label: 'Checkout',
      value: formatDate(data.checkoutCase?.checkoutDate ?? data.workspace.tenancy.end_date),
    },
    {
      label: 'Assessor',
      value: data.checkoutCase?.assessorName ?? 'Not recorded',
    },
    {
      label: 'Agency',
      value: data.checkoutCase?.agencyName ?? 'Not recorded',
    },
    {
      label: 'Source',
      value: data.checkoutCase?.reportSource ?? 'Not recorded',
    },
  ]

  function handleTabChange(tabId: CheckoutWorkspaceTab) {
    if (!pathname) {
      return
    }

    startTransition(() => {
      const nextSearchParams = new URLSearchParams(searchParams.toString())

      if (tabId === 'overview') {
        nextSearchParams.delete('tab')
      } else {
        nextSearchParams.set('tab', tabId)
      }

      router.replace(getWorkspaceHref(pathname, nextSearchParams), { scroll: false })
    })
  }

  return (
    <div className="space-y-6">
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          {`Case #${caseReference}`}
        </p>
        <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-zinc-950 [overflow-wrap:anywhere]">
              {propertyAddress}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <WorkspaceBadge label={status.label} tone={status.tone} />
            </div>
            <div className="mt-4">
              <WorkflowProgressTrack currentStatus={data.workspace.case.status} />
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 border-t border-zinc-200 pt-6 text-sm text-zinc-600 md:grid-cols-2 xl:grid-cols-4">
          {metadataItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                {item.label}
              </dt>
              <dd className="mt-2 text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-busy={isPending}
        className={cn(
          'overflow-hidden border border-zinc-200/80 bg-white',
          isPending ? 'opacity-80' : null
        )}
      >
        <div className="px-6 pt-4 md:px-7">
          <WorkspaceTabBar
            activeTab={activeTab}
            ariaLabel="Checkout workspace sections"
            items={TAB_ITEMS}
            onChange={handleTabChange}
          />
        </div>
        <div className="border-t border-zinc-200 px-6 py-6 md:px-7">
          <ActiveTabComponent data={data} />
        </div>
      </section>
    </div>
  )
}
