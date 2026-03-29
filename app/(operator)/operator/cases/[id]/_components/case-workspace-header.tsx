import { SectionCard } from '@/app/operator-ui'
import { formatAddress, formatCurrency, formatDate } from '@/app/eot/_components/eot-ui'
import { CaseStatusBadge } from '@/app/(operator)/operator/cases/[id]/_components/case-status-badge'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

function ActionStubButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500"
    >
      {label}
    </button>
  )
}

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
  const propertyAddress = formatAddress([
    workspace.property.address_line_1,
    workspace.property.address_line_2,
    workspace.property.city,
    workspace.property.postcode,
    workspace.property.country_code,
  ])
  const depositScheme = getDepositField(workspace, 'scheme')
  const certificateNumber = getDepositField(workspace, 'certificate')

  return (
    <SectionCard className="px-6 py-6 md:px-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CaseStatusBadge status={workspace.case.status} />
          </div>
          <h2 className="mt-3 max-w-5xl text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950 [overflow-wrap:anywhere]">
            {propertyAddress}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {workspace.tenant.name}
            {workspace.tenant.email ? ` · ${workspace.tenant.email}` : ''}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {formatDate(workspace.tenancy.start_date)} to {formatDate(workspace.tenancy.end_date)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
          <ActionStubButton label="Analyse" />
          <ActionStubButton label="Approve Claim" />
          <ActionStubButton label="Export Claim" />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Issues
              </dt>
              <dd className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-slate-950">
                {workspace.issues.length}
              </dd>
              <p className="mt-2 text-sm leading-6 text-slate-600">Items currently in operator review.</p>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Proposed deductions
              </dt>
              <dd className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-slate-950">
                {formatCurrency(workspace.totals.proposedDeductions)}
              </dd>
              <p className="mt-2 text-sm leading-6 text-slate-600">Current claim position from recommendations.</p>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Remaining deposit
              </dt>
              <dd className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em] text-slate-950">
                {workspace.totals.remainingDeposit == null
                  ? 'Not recorded'
                  : formatCurrency(workspace.totals.remainingDeposit)}
              </dd>
              <p className="mt-2 text-sm leading-6 text-slate-600">Estimated return after deductions.</p>
            </div>
          </dl>

          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:content-start">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Deposit</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {workspace.totals.depositAmount == null
                  ? 'Not recorded'
                  : formatCurrency(workspace.totals.depositAmount)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Case reference</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {workspace.case.id.slice(0, 8)}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Deposit scheme</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {depositScheme}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3">
              <dt className="text-sm text-slate-500">Certificate number</dt>
              <dd className="min-w-0 text-right text-sm font-medium text-slate-950 [overflow-wrap:anywhere]">
                {certificateNumber}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </SectionCard>
  )
}
