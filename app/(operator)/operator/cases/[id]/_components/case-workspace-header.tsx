'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { SectionCard } from '@/app/operator-ui'
import { formatAddress, formatCurrency, formatDate } from '@/app/eot/_components/eot-ui'
import { CaseStatusBadge } from '@/app/(operator)/operator/cases/[id]/_components/case-status-badge'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

function getDepositField(
  workspace: OperatorCaseWorkspaceData,
  field: 'scheme' | 'certificate'
) {
  const patterns =
    field === 'scheme'
      ? [/deposit scheme[:\s-]+([^\n;]+)/i, /\b(dps|tds|mydeposits)\b/i]
      : [/certificate(?: number)?[:\s-]+([^\n;]+)/i, /reference[:\s-]+([^\n;]+)/i]

  const candidates = [
    workspace.tenancy.notes ?? '',
    ...workspace.documents.flatMap((document) => [
      document.name,
      document.document_type,
      typeof document.metadata?.label === 'string' ? document.metadata.label : '',
      typeof document.metadata?.reference === 'string' ? document.metadata.reference : '',
      typeof document.metadata?.certificate_number === 'string' ? document.metadata.certificate_number : '',
      typeof document.metadata?.scheme === 'string' ? document.metadata.scheme : '',
    ]),
    ...workspace.evidence.flatMap((item) => [
      item.area ?? '',
      typeof item.metadata?.label === 'string' ? item.metadata.label : '',
      typeof item.metadata?.reference === 'string' ? item.metadata.reference : '',
      typeof item.metadata?.certificate_number === 'string' ? item.metadata.certificate_number : '',
      typeof item.metadata?.scheme === 'string' ? item.metadata.scheme : '',
    ]),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    for (const pattern of patterns) {
      const match = candidate.match(pattern)
      const value = match?.[1] ?? match?.[0]

      if (value?.trim()) {
        return value.trim().replace(/^deposit scheme[:\s-]*/i, '').replace(/^certificate(?: number)?[:\s-]*/i, '')
      }
    }
  }

  return 'Not recorded'
}

export function CaseWorkspaceHeader({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  const router = useRouter()
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null)
  const propertyAddress = formatAddress([
    workspace.property.address_line_1,
    workspace.property.address_line_2,
    workspace.property.city,
    workspace.property.postcode,
    workspace.property.country_code,
  ])
  const depositScheme = getDepositField(workspace, 'scheme')
  const certificateNumber = getDepositField(workspace, 'certificate')

  async function handleAnalyse() {
    if (isAnalysing) {
      return
    }

    setIsAnalysing(true)
    setAnalysisError(null)
    setAnalysisSuccess(null)

    try {
      const response = await fetch(`/api/operator/cases/${workspace.case.id}/analyse`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })
      const payload = (await response.json().catch(() => null)) as
        | {
            detail?: string
            error?: string
            success?: boolean
          }
        | null

      if (!response.ok) {
        throw new Error(payload?.detail || payload?.error || 'Unable to analyse this case right now.')
      }

      setAnalysisSuccess('Analysis complete. Workspace refreshed with the latest results.')
      router.refresh()
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : 'Unable to analyse this case right now.'
      )
    } finally {
      setIsAnalysing(false)
    }
  }

  return (
    <SectionCard className="px-6 py-6 md:px-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={workspace.case.status} />
          </div>
          <h2 className="mt-3 max-w-5xl text-[1.7rem] font-semibold tracking-[-0.04em] text-zinc-950 [overflow-wrap:anywhere]">
            {propertyAddress}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
            {workspace.tenant.name}
            {workspace.tenant.email ? ` · ${workspace.tenant.email}` : ''}
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {formatDate(workspace.tenancy.start_date)} to {formatDate(workspace.tenancy.end_date)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button
              type="button"
              disabled={isAnalysing}
              onClick={() => void handleAnalyse()}
              className="inline-flex h-10 items-center justify-center gap-2 border border-zinc-900 bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
            >
              {isAnalysing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isAnalysing ? 'Analysing...' : 'Analyse'}
            </button>
          </div>
          {analysisSuccess ? (
            <p className="max-w-md text-sm leading-6 text-emerald-700 [overflow-wrap:anywhere]">
              {analysisSuccess}
            </p>
          ) : null}
          {analysisError ? (
            <p className="max-w-md text-sm leading-6 text-rose-700 [overflow-wrap:anywhere]">
              {analysisError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Issues
              </dt>
              <dd className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-zinc-950">
                {workspace.issues.length}
              </dd>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Items currently in operator review.</p>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Proposed deductions
              </dt>
              <dd className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-zinc-950">
                {formatCurrency(workspace.totals.proposedDeductions)}
              </dd>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Current claim position from recommendations.</p>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Remaining deposit
              </dt>
              <dd className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-zinc-950">
                {workspace.totals.remainingDeposit == null
                  ? 'Not recorded'
                  : formatCurrency(workspace.totals.remainingDeposit)}
              </dd>
              <p className="mt-2 text-sm leading-6 text-zinc-600">Estimated return after deductions.</p>
            </div>
          </dl>

          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:content-start">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
              <dt className="text-sm text-zinc-500">Deposit</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                {workspace.totals.depositAmount == null
                  ? 'Not recorded'
                  : formatCurrency(workspace.totals.depositAmount)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
              <dt className="text-sm text-zinc-500">Case reference</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                {workspace.case.id.slice(0, 8)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
              <dt className="text-sm text-zinc-500">Deposit scheme</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                {depositScheme}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
              <dt className="text-sm text-zinc-500">Certificate number</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
                {certificateNumber}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </SectionCard>
  )
}
