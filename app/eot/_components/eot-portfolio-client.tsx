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
  DetailPanel,
  EmptyState,
  KPIStatCard,
  MetaItem,
  PageHeader,
  ProgressBar,
  SectionCard,
  SectionHeading,
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
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title="Portfolio command view"
          description="A live executive summary of checkout volume, dispute risk, workflow throughput, and the checkouts that need action next."
        />

        <section className="grid gap-4 xl:grid-cols-5">
          <KPIStatCard label="Active checkouts" value={stats.activeCases} detail={`${stats.totalCases} total live checkouts`} />
          <KPIStatCard label="Ready for submission" value={stats.readyForClaim} detail="Queue for final submission review." tone="accent" />
          <KPIStatCard label="Disputed" value={stats.disputed} detail="Checkouts currently in dispute handling." tone="danger" />
          <KPIStatCard label="Evidence logged" value={stats.totalEvidence} detail={`Avg ${stats.averageEvidencePerCase.toFixed(1)} per checkout`} />
          <KPIStatCard label="Resolved issues" value={stats.resolvedIssues} detail={`${stats.totalIssues} issues assessed overall`} tone="warning" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <SectionCard className="px-6 py-6">
            <SectionHeading
              eyebrow="Attention queue"
              title="Checkouts requiring operator focus"
              description="High-priority, disputed, or stalled files surfaced from the live workspace data."
            />
            <div className="mt-5 space-y-3">
              {attentionQueue.map((workspace) => {
                const readiness = getClaimReadiness(workspace)

                return (
                  <div
                    key={workspace.case.id}
                    className="border-b border-zinc-200 px-5 py-5 last:border-b-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={formatEnumLabel(workspace.case.priority)} tone={workspace.case.priority} />
                      <StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
                      <StatusBadge label={readiness.label} tone={readiness.tone === 'ready' ? 'ready_for_claim' : readiness.tone === 'attention' ? 'attention' : 'document'} />
                    </div>
                    <Link
                      href={`/operator/cases/${workspace.case.id}`}
                      className="mt-3 block text-base font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900"
                    >
                      {workspace.property.name}
                    </Link>
                    <p className="mt-1 text-sm text-zinc-600">{workspace.tenancy.tenant_name}</p>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">
                      {workspace.case.summary?.trim() || readiness.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <DetailPanel
            title="Upcoming risk and deadlines"
            description="Operational hotspots inferred from current workflow state."
          >
            {attentionQueue.slice(0, 4).map((workspace) => (
              <div key={workspace.case.id} className="border-b border-zinc-200 py-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">{workspace.property.name}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      {workspace.case.status === 'ready_for_claim'
                        ? 'Ready for submission review and operator sign-off.'
                        : workspace.case.status === 'disputed'
                          ? 'Dispute handling needs a clear evidence-backed narrative.'
                          : 'Review evidence quality and move the case forward.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </DetailPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <SectionCard className="px-6 py-6">
            <SectionHeading
              eyebrow="Pipeline"
              title="Status breakdown"
              description="Distribution of active checkouts across the end-of-tenancy workflow."
            />
            <div className="mt-5">
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
          </SectionCard>

          <SectionCard className="px-6 py-6">
            <SectionHeading
              eyebrow="Productivity"
              title="Operator throughput snapshot"
              description="Evidence intake, issue assessment, and recommendation mix across the current operator workload."
            />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <MetaItem label="Issue resolution rate" value={`${stats.totalIssues ? Math.round((stats.resolvedIssues / stats.totalIssues) * 100) : 0}%`} />
              <MetaItem label="Claim total" value={formatCurrency(stats.claimAmount)} />
              <MetaItem label="Evidence / checkout" value={stats.averageEvidencePerCase.toFixed(1)} />
              <MetaItem label="Recommendations" value={recommendationCount} />
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <SectionCard className="px-6 py-6">
            <SectionHeading
              eyebrow="Recent activity"
              title="Latest portfolio movement"
              description="Live activity stream across checkout workspaces."
            />
            <div className="mt-5">
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
          </SectionCard>

          <DetailPanel
            title="Evidence mix"
            description="Current media and document composition across active checkouts."
          >
            <DistributionBar
              items={Object.entries(evidenceTypeBreakdown).map(([label, value]) => ({
                label: formatEnumLabel(label),
                value,
                tone: label === 'image' ? 'accent' : label === 'video' ? 'warning' : undefined,
              }))}
            />
          </DetailPanel>
        </div>
      </div>
    )
  }

  if (mode === 'tenancy') {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Tenancy"
          title="Tenancy operations"
          description="Review resident, deposit, property, and workflow context across the live end-of-tenancy portfolio."
        />

        <section className="grid gap-4 xl:grid-cols-4">
          <KPIStatCard label="Active tenancies" value={tenancyItems.length} detail="Tenancy records currently attached to live checkouts." />
          <KPIStatCard label="Deposits captured" value={workspaces.filter((workspace) => workspace.tenancy.deposit_amount).length} detail="Checkouts with deposit values already recorded." tone="accent" />
          <KPIStatCard label="References present" value={workspaces.filter((workspace) => workspace.property.reference).length} detail="Properties with a usable internal reference." />
          <KPIStatCard label="Ready for submission" value={workspaces.filter((workspace) => workspace.case.status === 'ready_for_claim').length} detail="Tenancies ready for final submission work." tone="warning" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <SectionCard className="px-6 py-6">
            <SectionHeading
              title="Tenancy register"
              description={`${tenancyItems.length} tenancy record${tenancyItems.length === 1 ? '' : 's'} visible.`}
            />
            <div className="mt-5">
              <DataTable>
                <table className="min-w-full text-left">
                  <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Property</th>
                      <th className="px-4 py-3">Tenant</th>
                      <th className="px-4 py-3">Deposit</th>
                      <th className="px-4 py-3">Tenancy dates</th>
                      <th className="px-4 py-3">Workflow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {tenancyItems.map((workspace) => (
                      <tr
                        key={workspace.case.id}
                        className={selectedTenancy?.case.id === workspace.case.id ? 'bg-zinc-50/90' : 'hover:bg-zinc-50/70'}
                        onClick={() => setSelectedItemId(workspace.case.id)}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <Link href={`/operator/cases/${workspace.case.id}`} className="text-sm font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{workspace.property.name}</Link>
                            <p className="mt-1 text-sm text-zinc-600">{workspace.property.reference || 'Reference pending'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm font-medium text-zinc-950">{workspace.tenancy.tenant_name}</p>
                            <p className="mt-1 text-sm text-zinc-600">{workspace.tenancy.tenant_email || 'Email not recorded'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-zinc-950">
                          {workspace.tenancy.deposit_amount ? formatCurrency(workspace.tenancy.deposit_amount) : 'Not recorded'}
                        </td>
                        <td className="px-4 py-4 text-sm text-zinc-700">
                          {formatDate(workspace.tenancy.start_date)} to {formatDate(workspace.tenancy.end_date)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
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
          </SectionCard>

          {selectedTenancy ? (
            <DetailPanel
              title="Tenancy context"
              description="Deposit, case coverage, and supporting tenancy activity for the selected record."
            >
              <MetaItem label="Property" value={selectedTenancy.property.name} />
              <MetaItem label="Property reference" value={selectedTenancy.property.reference || 'Reference pending'} />
              <MetaItem label="Evidence logged" value={selectedTenancy.evidence.length} />
              <MetaItem label="Issues raised" value={selectedTenancy.issues.length} />
              <ProgressBar
                value={selectedTenancy.evidence.length ? Math.min(100, selectedTenancy.evidence.length * 14) : 8}
                label={
                  <>
                    <span>File completeness</span>
                    <span>{selectedTenancy.evidence.length ? 'In progress' : 'Just started'}</span>
                  </>
                }
              />
            </DetailPanel>
          ) : null}
        </div>
      </div>
    )
  }

  if (mode === 'disputes') {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Disputes"
          title="Dispute review queue"
          description="Review disputed checkouts, contested issues, linked evidence, and recommendation rationale before final resolution."
        />

        <section className="grid gap-4 xl:grid-cols-4">
          <KPIStatCard label="Disputed checkouts" value={workspaces.filter((workspace) => workspace.case.status === 'disputed').length} detail="Checkouts currently marked disputed." tone="danger" />
          <KPIStatCard label="Disputed issues" value={disputeItems.length} detail="Issue records needing dispute handling." tone="warning" />
          <KPIStatCard label="Charge recommendations" value={disputeItems.filter((issue) => issue.recommendation?.decision === 'charge').length} detail="Disputes with a full charge position." />
          <KPIStatCard label="Evidence links" value={disputeItems.reduce((sum, issue) => sum + issue.linked_evidence.length, 0)} detail="Evidence items attached to disputed issues." />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_360px]">
          <SectionCard className="px-6 py-6">
            <SectionHeading
              title="Active disputes"
              description={`${disputeItems.length} dispute item${disputeItems.length === 1 ? '' : 's'} visible.`}
            />
            <div className="mt-5 grid gap-3">
              {disputeItems.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedItemId(issue.id)}
                  className={`border px-4 py-4 text-left transition ${
                    selectedDispute?.id === issue.id
                      ? 'border-zinc-900 bg-zinc-900 text-white'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={formatEnumLabel(issue.severity)} tone={issue.severity} />
                    <StatusBadge
                      label={issue.status === 'disputed' ? 'Contested' : formatEnumLabel(issue.status)}
                      tone={issue.status}
                    />
                    <StatusBadge label={formatEnumLabel(issue.caseStatus)} tone={issue.caseStatus} />
                    {issue.recommendation?.decision ? (
                      <StatusBadge
                        label={formatEnumLabel(issue.recommendation.decision)}
                        tone={issue.recommendation.decision}
                      />
                      ) : null}
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${selectedDispute?.id === issue.id ? 'text-white' : 'text-zinc-950'}`}>
                    {issue.title}
                  </p>
                  <p className={`mt-1 text-sm ${selectedDispute?.id === issue.id ? 'text-zinc-200' : 'text-zinc-600'}`}>
                    {issue.propertyName} · {issue.tenantName}
                  </p>
                  <p className={`mt-3 text-sm leading-6 ${selectedDispute?.id === issue.id ? 'text-zinc-200' : 'text-zinc-600'}`}>
                    {issue.description || 'No additional narrative recorded.'}
                  </p>
                </button>
              ))}
            </div>
          </SectionCard>

          {selectedDispute ? (
            <DetailPanel
              title="Dispute context"
              description="Evidence linkage, cost position, and the narrative currently supporting the dispute."
            >
              <MetaItem label="Property" value={<Link href={`/operator/cases/${selectedDispute.caseId}`} className="underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{selectedDispute.propertyName}</Link>} />
              <MetaItem label="Tenant" value={selectedDispute.tenantName} />
              <MetaItem label="Linked evidence" value={selectedDispute.linked_evidence.length} />
              <MetaItem label="Checkout status" value={formatEnumLabel(selectedDispute.caseStatus)} />
              {selectedDispute.recommendation?.estimated_cost ? (
                <MetaItem
                  label="Estimated cost"
                  value={formatCurrency(selectedDispute.recommendation.estimated_cost)}
                />
              ) : null}
              {selectedDispute.recommendation?.rationale ? (
                <div className="border-b border-zinc-200 py-3 text-sm leading-6 text-zinc-600">
                  {selectedDispute.recommendation.rationale}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {selectedDispute.linked_evidence.map((item) => (
                  <StatusBadge
                    key={item.id}
                    label={item.area || formatEnumLabel(item.type)}
                    tone={item.type}
                  />
                ))}
              </div>
            </DetailPanel>
          ) : null}
        </div>
      </div>
    )
  }

  if (mode === 'recommendations') {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Recommendations"
          title="Charge recommendation review"
          description="Review recommendation decisions, cost estimates, and supporting rationale before submission generation."
        />

        <SectionCard className="px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
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

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {recommendations.map((item) => (
              <div key={item.recommendation.id} className="border-b border-zinc-200 px-5 py-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={formatEnumLabel(item.recommendation.decision)}
                    tone={item.recommendation.decision ?? 'document'}
                  />
                  <StatusBadge label={formatEnumLabel(item.issue.severity)} tone={item.issue.severity} />
                </div>
                <p className="mt-3 text-base font-semibold text-zinc-950">{item.issue.title}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  <Link href={`/operator/cases/${item.caseId}`} className="underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{item.propertyName}</Link> · {item.tenantName}
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {item.recommendation.rationale || 'No recommendation rationale recorded.'}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-zinc-950">
                    {item.recommendation.estimated_cost
                      ? formatCurrency(item.recommendation.estimated_cost)
                      : 'No estimate'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    )
  }

  if (mode === 'claims') {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Submissions"
          title="Submission desk"
          description="Monitor generated claim packs, checkouts waiting for submission, and the traceability needed for operator sign-off."
        />

        <section className="grid gap-4 xl:grid-cols-4">
          <KPIStatCard label="Generated claims" value={workspaces.filter((workspace) => workspace.claim).length} detail="Submission packs already created." tone="accent" />
          <KPIStatCard label="Awaiting submission" value={workspaces.filter((workspace) => workspace.case.status === 'ready_for_claim' && !workspace.claim).length} detail="Checkouts ready but not yet generated." tone="warning" />
          <KPIStatCard label="Claim value" value={formatCurrency(stats.claimAmount)} detail="Current generated claim total." />
          <KPIStatCard label="Recommendations" value={recommendationCount} detail="Supporting recommendation set." />
        </section>

        <SectionCard className="px-6 py-6">
          <SectionHeading
            title="Submission readiness by checkout"
            description="Generated claims, pending submissions, and the checkouts still being prepared."
          />
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {workspaces.map((workspace) => {
              const readiness = getClaimReadiness(workspace)

              return (
                <div key={workspace.case.id} className="border-b border-zinc-200 px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
                    <StatusBadge
                      label={readiness.label}
                      tone={readiness.tone === 'ready' ? 'ready_for_claim' : readiness.tone === 'attention' ? 'attention' : 'document'}
                    />
                  </div>
                  <Link href={`/operator/cases/${workspace.case.id}`} className="mt-3 block text-base font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-2 transition hover:decoration-zinc-900">{workspace.property.name}</Link>
                  <p className="mt-1 text-sm text-zinc-600">{workspace.tenancy.tenant_name}</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-600">{readiness.description}</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-zinc-950">
                      {workspace.claim ? formatCurrency(workspace.claim.total_amount) : 'No claim total yet'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Operations analytics"
        description="Portfolio-level reporting on workflow mix, issue severity, evidence composition, and generated claim value."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard className="px-6 py-6">
          <SectionHeading
            title="Workflow and risk"
            description="Checkout distribution and issue severity across the live portfolio."
          />
          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold text-zinc-950">Checkout statuses</p>
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
            <div>
              <p className="mb-3 text-sm font-semibold text-zinc-950">Issue severity</p>
              <DistributionBar
                items={Object.entries(issueSeverityBreakdown).map(([label, value]) => ({
                  label: formatEnumLabel(label),
                  value,
                  tone:
                    label === 'high'
                      ? 'danger'
                      : label === 'medium'
                        ? 'warning'
                        : 'accent',
                }))}
              />
            </div>
          </div>
        </SectionCard>

        <DetailPanel
          title="AI-assisted submission readiness"
          description="Current live signals relevant to final submission generation."
        >
          <MetaItem label="Ready for submission" value={stats.readyForClaim} />
          <MetaItem label="Recommendations recorded" value={recommendationCount} />
          <MetaItem label="Generated claims" value={workspaces.filter((workspace) => workspace.claim).length} />
          <div className="border-b border-zinc-200 py-3 text-sm leading-6 text-zinc-600">
            Submission readiness remains live and operator-facing. These analytics are derived directly from the active checkout portfolio.
          </div>
        </DetailPanel>
      </div>

      <SectionCard className="px-6 py-6">
        <SectionHeading
          title="Checkout performance table"
          description="Operational comparison of the full live checkout portfolio."
        />
        <div className="mt-5">
          <DataTable>
            <table className="min-w-full text-left">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3">Issues</th>
                  <th className="px-4 py-3">Claim value</th>
                  <th className="px-4 py-3">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {workspaces.map((workspace) => (
                  <tr key={workspace.case.id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">{workspace.property.name}</p>
                        <p className="mt-1 text-sm text-zinc-600">{workspace.tenancy.tenant_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={formatEnumLabel(workspace.case.status)} tone={workspace.case.status} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={formatEnumLabel(workspace.case.priority)} tone={workspace.case.priority} />
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">{workspace.evidence.length}</td>
                    <td className="px-4 py-4 text-sm text-zinc-700">{workspace.issues.length}</td>
                    <td className="px-4 py-4 text-sm font-medium text-zinc-950">
                      {workspace.claim ? formatCurrency(workspace.claim.total_amount) : 'Not generated'}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">{formatDateTime(workspace.case.last_activity_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </div>
      </SectionCard>
    </div>
  )
}
