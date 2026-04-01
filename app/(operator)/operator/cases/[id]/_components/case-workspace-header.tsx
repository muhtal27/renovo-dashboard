'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={workspace.case.status} />
          </div>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950 [overflow-wrap:anywhere]">
            {propertyAddress}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {workspace.tenant.name}
            {workspace.tenant.email ? ` · ${workspace.tenant.email}` : ''}
            <span className="mx-1.5 text-zinc-300">·</span>
            {formatDate(workspace.tenancy.start_date)} to {formatDate(workspace.tenancy.end_date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={isAnalysing}
            onClick={() => void handleAnalyse()}
            className="inline-flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAnalysing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {isAnalysing ? 'Analysing...' : 'Analyse'}
          </button>
        </div>
      </div>
      {analysisSuccess ? (
        <p className="text-sm text-emerald-700">{analysisSuccess}</p>
      ) : null}
      {analysisError ? (
        <p className="text-sm text-rose-700">{analysisError}</p>
      ) : null}

      <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
        <div className="py-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Issues</span>
          <div className="mt-0.5 text-xl font-semibold tabular-nums leading-tight text-zinc-950">{workspace.issues.length}</div>
        </div>
        <div className="py-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Deductions</span>
          <div className="mt-0.5 text-xl font-semibold tabular-nums leading-tight text-zinc-950">{formatCurrency(workspace.totals.proposedDeductions)}</div>
        </div>
        <div className="py-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Remaining</span>
          <div className="mt-0.5 text-xl font-semibold tabular-nums leading-tight text-zinc-950">{workspace.totals.remainingDeposit == null ? '—' : formatCurrency(workspace.totals.remainingDeposit)}</div>
        </div>
        <div className="py-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Deposit</span>
          <div className="mt-0.5 text-xl font-semibold tabular-nums leading-tight text-zinc-950">{workspace.totals.depositAmount == null ? '—' : formatCurrency(workspace.totals.depositAmount)}</div>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-1 border-b border-zinc-200 pb-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-baseline justify-between gap-3 py-1">
          <span className="text-xs text-zinc-500">Reference</span>
          <span className="text-sm font-medium text-zinc-950">{workspace.case.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1">
          <span className="text-xs text-zinc-500">Deposit scheme</span>
          <span className="text-sm font-medium text-zinc-950">{depositScheme}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-1">
          <span className="text-xs text-zinc-500">Certificate</span>
          <span className="text-sm font-medium text-zinc-950">{certificateNumber}</span>
        </div>
      </div>
    </div>
  )
}
