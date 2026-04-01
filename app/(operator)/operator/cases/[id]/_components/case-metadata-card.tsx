import { formatDate, formatDateTime } from '@/app/eot/_components/eot-ui'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

export function CaseMetadataCard({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  return (
    <div className="min-w-0 border-l border-zinc-200 pl-0 xl:pl-5">
      <p className="text-sm font-semibold tracking-[-0.02em] text-zinc-950">Case metadata</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Tenancy, property, and audit detail for evidence review.
      </p>

      <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
          <dt className="text-sm text-zinc-500">Property reference</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
            {workspace.property.reference || 'Not set'}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
          <dt className="text-sm text-zinc-500">Tenancy ID</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
            {workspace.tenancy.id.slice(0, 8)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
          <dt className="text-sm text-zinc-500">Case created</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
            {formatDate(workspace.case.created_at)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
          <dt className="text-sm text-zinc-500">Last activity</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-zinc-950">{formatDateTime(workspace.case.last_activity_at)}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
          <dt className="text-sm text-zinc-500">Tenant</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
            {workspace.tenant.name}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-3">
          <dt className="text-sm text-zinc-500">Tenant email</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-zinc-950 [overflow-wrap:anywhere]">
            {workspace.tenant.email || 'Not recorded'}
          </dd>
        </div>
      </dl>

      {workspace.tenancy.notes ? (
        <div className="mt-5 border-t border-zinc-200 pt-4 text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
          {workspace.tenancy.notes}
        </div>
      ) : null}
    </div>
  )
}
