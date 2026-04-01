'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import {
  buildEvidenceTypeBreakdown,
  buildIssueSeverityBreakdown,
  buildRecentActivity,
  buildStatusBreakdown,
  flattenIssues,
  flattenRecommendations,
  getCasesRequiringAttention,
  getPortfolioStats,
  getClaimReadiness,
} from '@/lib/eot-dashboard'
import {
  ActivityTimeline,
  DataTable,
  EmptyState,
  KPIStatCard,
  SectionCard,
  SkeletonPanel,
  StatusBadge,
  ToolbarPill,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { useEotPortfolioData } from '@/app/eot/_components/use-eot-portfolio-data'
import { getEotUiErrorMessage } from '@/lib/eot-errors'
import type { EotPortfolioSnapshot } from '@/lib/eot-server-data'

type PortfolioViewMode =
  | 'overview'
  | 'tenancy'
  | 'disputes'
  | 'recommendations'
  | 'claims'
  | 'reports'

function DistributionBar({
  items,
}: {
  items: Array<{ label: string; value: number; tone?: string }>
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = total ? (item.value / total) * 100 : 0
        const color =
          item.tone === 'danger'
            ? 'bg-rose-500'
            : item.tone === 'warning'
              ? 'bg-amber-500'
              : item.tone === 'accent'
                ? 'bg-emerald-500'
                : 'bg-zinc-900'

        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm text-zinc-600">
              <span>{item.label}</span>
              <span className="font-medium text-zinc-900">{item.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-zinc-100">
              <div className={`h-full ${color}`} style={{ width: `${width}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function EotPortfolioClient({
  mode,
  initialSnapshot,
}: {
  mode: PortfolioViewMode
  initialSnapshot?: EotPortfolioSnapshot | null
}) {
  const searchParams = useSearchParams()
  const search = searchParams.get('search')?.trim().toLowerCase() ?? ''
  const { cases, workspaces, loading, error, hasData } = useEotPortfolioData(initialSnapshot)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [recommendationView, setRecommendationView] = useState<'all' | 'charge' | 'partial' | 'no_charge'>('all')
  const needsAttentionQueue = mode === 'overview'
  const needsRecentActivity = mode === 'overview'
  const needsStatusBreakdown = mode === 'overview' || mode === 'reports'
  const needsIssueSeverityBreakdown = mode === 'reports'
  const needsEvidenceTypeBreakdown = mode === 'overview'
  const needsIssues = mode === 'disputes'
  const needsRecommendationItems = mode === 'recommendations'
  const needsTenancyItems = mode === 'tenancy'

  const stats = useMemo(() => getPortfolioStats(cases, workspaces), [cases, workspaces])
  const attentionQueue = useMemo(
    () => (needsAttentionQueue ? getCasesRequiringAttention(workspaces, 6) : []),
    [needsAttentionQueue, workspaces]
  )
  const recentActivity = useMemo(
    () => (needsRecentActivity ? buildRecentActivity(workspaces, 8) : []),
    [needsRecentActivity, workspaces]
  )
  const statusBreakdown = useMemo(
    () => (needsStatusBreakdown ? buildStatusBreakdown(cases) : {}),
    [cases, needsStatusBreakdown]
  )
  const issueSeverityBreakdown = useMemo(
    () => (needsIssueSeverityBreakdown ? buildIssueSeverityBreakdown(workspaces) : {}),
    [needsIssueSeverityBreakdown, workspaces]
  )
  const evidenceTypeBreakdown = useMemo(
    () => (needsEvidenceTypeBreakdown ? buildEvidenceTypeBreakdown(workspaces) : {}),
    [needsEvidenceTypeBreakdown, workspaces]
  )

  const issues = useMemo(() => {
    if (!needsIssues) {
      return []
    }

    return flattenIssues(workspaces)
      .filter((issue) => {
        if (!search) return true
        return [
          issue.title,
          issue.description ?? '',
          issue.propertyName,
          issue.tenantName,
          issue.severity,
          issue.status,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
  }, [needsIssues, search, workspaces])

  const recommendationCount = useMemo(
    () =>
      workspaces.reduce(
        (count, workspace) =>
          count +
          workspace.issues.filter((issue) => issue.recommendation).length,
        0
      ),
    [workspaces]
  )

  const recommendations = useMemo(() => {
    if (!needsRecommendationItems) {
      return []
    }

    return flattenRecommendations(workspaces)
      .filter((item) => {
        if (recommendationView !== 'all' && item.recommendation.decision !== recommendationView) {
          return false
        }

        if (!search) return true
        return [
          item.issue.title,
          item.issue.description ?? '',
          item.recommendation.rationale ?? '',
          item.propertyName,
          item.tenantName,
          item.recommendation.decision ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((left, right) => new Date(right.recommendation.updated_at).getTime() - new Date(left.recommendation.updated_at).getTime())
  }, [needsRecommendationItems, recommendationView, search, workspaces])

  const tenancyItems = useMemo(() => {
    if (!needsTenancyItems) {
      return []
    }

    return workspaces
      .filter((workspace) => {
        if (!search) return true
        return [
          workspace.property.name,
          workspace.property.reference ?? '',
          workspace.tenancy.tenant_name,
          workspace.tenancy.tenant_email ?? '',
          workspace.case.status,
          workspace.case.priority,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort(
        (left, right) =>
          new Date(right.case.last_activity_at).getTime() - new Date(left.case.last_activity_at).getTime()
      )
  }, [needsTenancyItems, search, workspaces])

  const selectedTenancy = useMemo(() => {
    if (!tenancyItems.length) return null
    return tenancyItems.find((item) => item.case.id === selectedItemId) ?? tenancyItems[0]
  }, [selectedItemId, tenancyItems])

  const disputeItems = useMemo(() => {
    if (!needsIssues) {
      return []
    }

    return issues
      .filter((issue) => issue.caseStatus === 'disputed' || issue.status === 'disputed')
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
  }, [issues, needsIssues])

  const selectedDispute = useMemo(() => {
    if (!disputeItems.length) return null
    return disputeItems.find((item) => item.id === selectedItemId) ?? disputeItems[0]
  }, [disputeItems, selectedItemId])

  if (loading) {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    )
  }

  if (error) {
    return (
      <SectionCard className="px-6 py-10">
        <EmptyState title="Unable to load portfolio" body={getEotUiErrorMessage(error)} />
      </SectionCard>
    )
  }

  if (!hasData) {
    return (
      <SectionCard className="px-6 py-10">
        <EmptyState
          title="No live checkouts yet"
          body="Create the first end-of-tenancy checkout to populate the operations portfolio."
          action={
            <Link
              href="/eot"
              className="inline-flex items-center border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Open checkouts
            </Link>
          }
        />
      </SectionCard>
    )
  }

  if (mode === 'overview') {
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
          <KPIStatCard label="Active" value={stats.activeCases} />
          <KPIStatCard label="Ready" value={stats.readyForClaim} tone="accent" />
          <KPIStatCard label="Disputed" value={stats.disputed} tone="danger" />
          <KPIStatCard label="Evidence" value={stats.totalEvidence} />
          <KPIStatCard label="Resolved" value={stats.resolvedIssues} tone="warning" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Attention queue</h3>
            <div className="mt-2">
              {attentionQueue.map((workspace) => {
                const readiness = getClaimReadiness(workspace)

                return (
                  <div key={workspace.case.id} className="flex items-start justify-between gap-4 border-b border-zinc-100 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/operator/cases/${workspace.case.id}`}
                          className="text-sm font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900"
                        >
                          {workspace.property.name}
                        </Link>
                        <span className="text-xs text-zinc-400">{workspace.tenancy.tenant_name}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <StatusBadge label={formatEnumLabel(workspace.case.priority)} tone={workspace.case.priority} />
                      <StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Risk signals</h3>
            <div className="mt-2">
              {attentionQueue.slice(0, 4).map((workspace) => (
                <div key={workspace.case.id} className="flex items-start gap-2 border-b border-zinc-100 py-2">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-950">{workspace.property.name}</p>
                    <p className="text-xs text-zinc-500">
                      {workspace.case.status === 'ready_for_claim'
                        ? 'Ready for submission sign-off'
                        : workspace.case.status === 'disputed'
                          ? 'Dispute needs evidence narrative'
                          : 'Review evidence and advance'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Pipeline</h3>
            <div className="mt-2">
              <DistributionBar
                items={Object.entries(statusBreakdown).map(([label, value]) => ({
                  label: formatEnumLabel(label),
                  value,
                  tone:
                    label === 'disputed'
                      ? 'danger'
                      : label === 'ready_for_claim'
                        ? 'accent'
                        : label === 'review'
                          ? 'warning'
                          : undefined,
                }))}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Throughput</h3>
            <div className="mt-2 space-y-0">
              {[
                { label: 'Resolution rate', value: `${stats.totalIssues ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0}%` },
                { label: 'Claim total', value: formatCurrency(stats.claimAmount) },
                { label: 'Evidence / checkout', value: stats.averageEvidencePerCase.toFixed(1) },
                { label: 'Recommendations', value: String(recommendationCount) },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-2">
                  <span className="text-xs text-zinc-500">{item.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-950">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Recent activity</h3>
            <div className="mt-2">
              <ActivityTimeline
                items={recentActivity.map((item) => ({
                  id: item.id,
                  title: item.title,
                  detail: item.detail,
                  meta: formatDateTime(item.timestamp),
                  tone: 'accent',
                }))}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Evidence mix</h3>
            <div className="mt-2">
              <DistributionBar
                items={Object.entries(evidenceTypeBreakdown).map(([label, value]) => ({
                  label: formatEnumLabel(label),
                  value,
                  tone: label === 'image' ? 'accent' : label === 'video' ? 'warning' : undefined,
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'tenancy') {
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
          <KPIStatCard label="Active tenancies" value={tenancyItems.length} />
          <KPIStatCard label="Deposits captured" value={workspaces.filter((workspace) => workspace.tenancy.deposit_amount).length} tone="accent" />
          <KPIStatCard label="References present" value={workspaces.filter((workspace) => workspace.property.reference).length} />
          <KPIStatCard label="Ready for submission" value={workspaces.filter((workspace) => workspace.case.status === 'ready_for_claim').length} tone="warning" />
        </div>

        <DataTable>
          <table className="min-w-full table-fixed text-left">
            <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="w-[18%] px-3 py-2.5">Property</th>
                <th className="w-[16%] px-3 py-2.5">Tenant</th>
                <th className="w-[10%] px-3 py-2.5">Deposit</th>
                <th className="w-[20%] px-3 py-2.5">Tenancy dates</th>
                <th className="w-[10%] px-3 py-2.5">Evidence</th>
                <th className="w-[10%] px-3 py-2.5">Issues</th>
                <th className="w-[16%] px-3 py-2.5">Workflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tenancyItems.map((workspace) => (
                <tr key={workspace.case.id} className="hover:bg-zinc-50/70">
                  <td className="px-3 py-2.5">
                    <Link href={`/operator/cases/${workspace.case.id}`} className="block truncate text-sm font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{workspace.property.name}</Link>
                    <p className="truncate text-xs text-zinc-500">{workspace.property.reference || '—'}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="truncate text-sm text-zinc-950">{workspace.tenancy.tenant_name}</p>
                    <p className="truncate text-xs text-zinc-500">{workspace.tenancy.tenant_email || '—'}</p>
                  </td>
                  <td className="px-3 py-2.5 text-sm font-medium text-zinc-950">
                    {workspace.tenancy.deposit_amount ? formatCurrency(workspace.tenancy.deposit_amount) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-zinc-700">
                    {formatDate(workspace.tenancy.start_date)} – {formatDate(workspace.tenancy.end_date)}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-zinc-700">{workspace.evidence.length}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-700">{workspace.issues.length}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
                      <StatusBadge label={formatEnumLabel(workspace.case.priority)} tone={workspace.case.priority} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>
    )
  }

  if (mode === 'disputes') {
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
          <KPIStatCard label="Disputed checkouts" value={workspaces.filter((workspace) => workspace.case.status === 'disputed').length} tone="danger" />
          <KPIStatCard label="Disputed issues" value={disputeItems.length} tone="warning" />
          <KPIStatCard label="Charge recommendations" value={disputeItems.filter((issue) => issue.recommendation?.decision === 'charge').length} />
          <KPIStatCard label="Evidence links" value={disputeItems.reduce((sum, issue) => sum + issue.linked_evidence.length, 0)} />
        </div>

        <DataTable>
          <table className="min-w-full table-fixed text-left">
            <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="w-[22%] px-3 py-2.5">Issue</th>
                <th className="w-[16%] px-3 py-2.5">Property</th>
                <th className="w-[12%] px-3 py-2.5">Severity</th>
                <th className="w-[12%] px-3 py-2.5">Status</th>
                <th className="w-[12%] px-3 py-2.5">Decision</th>
                <th className="w-[12%] px-3 py-2.5">Evidence</th>
                <th className="w-[14%] px-3 py-2.5">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {disputeItems.map((issue) => (
                <tr key={issue.id} className="hover:bg-zinc-50/70">
                  <td className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-zinc-950">{issue.title}</p>
                    <p className="truncate text-xs text-zinc-500">{issue.description ? issue.description.slice(0, 80) + (issue.description.length > 80 ? '…' : '') : '—'}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/operator/cases/${issue.caseId}`} className="block truncate text-sm text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{issue.propertyName}</Link>
                    <p className="truncate text-xs text-zinc-500">{issue.tenantName}</p>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} /></td>
                  <td className="px-3 py-2.5"><StatusBadge label={issue.status === 'disputed' ? 'Contested' : formatEnumLabel(issue.status)} tone={issue.status} /></td>
                  <td className="px-3 py-2.5">{issue.recommendation?.decision ? <StatusBadge label={formatEnumLabel(issue.recommendation.decision)} tone={issue.recommendation.decision} /> : <span className="text-xs text-zinc-400">—</span>}</td>
                  <td className="px-3 py-2.5 text-sm text-zinc-700">{issue.linked_evidence.length}</td>
                  <td className="px-3 py-2.5 text-sm font-medium text-zinc-950">{issue.recommendation?.estimated_cost ? formatCurrency(issue.recommendation.estimated_cost) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>
    )
  }

  if (mode === 'recommendations') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-200">
          {[
            { value: 'all' as const, label: 'All decisions' },
            { value: 'charge' as const, label: 'Charge' },
            { value: 'partial' as const, label: 'Partial' },
            { value: 'no_charge' as const, label: 'No charge' },
          ].map((option) => (
            <button key={option.value} type="button" onClick={() => setRecommendationView(option.value)}>
              <ToolbarPill active={recommendationView === option.value}>{option.label}</ToolbarPill>
            </button>
          ))}
        </div>

        <DataTable>
          <table className="min-w-full table-fixed text-left">
            <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="w-[18%] px-3 py-2.5">Issue</th>
                <th className="w-[16%] px-3 py-2.5">Property</th>
                <th className="w-[12%] px-3 py-2.5">Decision</th>
                <th className="w-[12%] px-3 py-2.5">Severity</th>
                <th className="w-[30%] px-3 py-2.5">Rationale</th>
                <th className="w-[12%] px-3 py-2.5">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recommendations.map((item) => (
                <tr key={item.recommendation.id} className="hover:bg-zinc-50/70">
                  <td className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-zinc-950">{item.issue.title}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/operator/cases/${item.caseId}`} className="block truncate text-sm text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{item.propertyName}</Link>
                    <p className="truncate text-xs text-zinc-500">{item.tenantName}</p>
                  </td>
                  <td className="px-3 py-2.5"><StatusBadge label={formatEnumLabel(item.recommendation.decision)} tone={item.recommendation.decision ?? 'document'} /></td>
                  <td className="px-3 py-2.5"><StatusBadge label={formatEnumLabel(item.issue.severity)} tone={item.issue.severity} /></td>
                  <td className="max-w-xs px-3 py-2.5 text-sm text-zinc-600">{item.recommendation.rationale ? item.recommendation.rationale.slice(0, 120) + (item.recommendation.rationale.length > 120 ? '…' : '') : '—'}</td>
                  <td className="px-3 py-2.5 text-sm font-medium text-zinc-950">{item.recommendation.estimated_cost ? formatCurrency(item.recommendation.estimated_cost) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      </div>
    )
  }

  if (mode === 'claims') {
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
          <KPIStatCard label="Generated claims" value={workspaces.filter((workspace) => workspace.claim).length} tone="accent" />
          <KPIStatCard label="Awaiting submission" value={workspaces.filter((workspace) => workspace.case.status === 'ready_for_claim' && !workspace.claim).length} tone="warning" />
          <KPIStatCard label="Claim value" value={formatCurrency(stats.claimAmount)} />
          <KPIStatCard label="Recommendations" value={recommendationCount} />
        </div>

        <DataTable>
          <table className="min-w-full table-fixed text-left">
            <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="w-[20%] px-3 py-2.5">Property</th>
                <th className="w-[18%] px-3 py-2.5">Tenant</th>
                <th className="w-[15%] px-3 py-2.5">Status</th>
                <th className="w-[15%] px-3 py-2.5">Readiness</th>
                <th className="w-[14%] px-3 py-2.5">Claim value</th>
                <th className="w-[18%] px-3 py-2.5">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {workspaces.map((workspace) => {
                const readiness = getClaimReadiness(workspace)
                return (
                  <tr key={workspace.case.id} className="hover:bg-zinc-50/70">
                    <td className="px-3 py-2.5">
                      <Link href={`/operator/cases/${workspace.case.id}`} className="block truncate text-sm font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{workspace.property.name}</Link>
                    </td>
                    <td className="px-3 py-2.5 truncate text-sm text-zinc-700">{workspace.tenancy.tenant_name}</td>
                    <td className="px-3 py-2.5"><StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} /></td>
                    <td className="px-3 py-2.5"><StatusBadge label={readiness.label} tone={readiness.tone === 'ready' ? 'ready_for_claim' : readiness.tone === 'attention' ? 'attention' : 'document'} /></td>
                    <td className="px-3 py-2.5 text-sm font-medium text-zinc-950">{workspace.claim ? formatCurrency(workspace.claim.total_amount) : '—'}</td>
                    <td className="px-3 py-2.5 text-sm text-zinc-700">{formatDateTime(workspace.case.last_activity_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {workspaces.map((workspace) => (
        <Link
          key={workspace.case.id}
          href={`/operator/cases/${workspace.case.id}`}
          className="block border-b border-zinc-200 px-5 py-6 transition hover:bg-zinc-50/60"
        >
          <p className="text-base font-semibold text-zinc-950">
            {workspace.property.name}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {workspace.tenancy.tenant_name}
          </p>
        </Link>
      ))}
    </div>
  )
}
