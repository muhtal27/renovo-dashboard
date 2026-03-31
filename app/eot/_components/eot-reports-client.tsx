import {
  DataTable,
  DetailPanel,
  EmptyState,
  MetaItem,
  PageHeader,
  SectionCard,
  SectionHeading,
  StatusBadge,
  formatCurrency,
  formatDateTime,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import { getEotUiErrorMessage } from '@/lib/eot-errors'
import type { EotReportSummary } from '@/lib/eot-types'

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

export function EotReportsClient({
  initialSummary,
  error,
}: {
  initialSummary?: EotReportSummary | null
  error?: string | null
}) {
  if (error) {
    return (
      <SectionCard className="px-6 py-10">
        <EmptyState title="Unable to load reporting summary" body={getEotUiErrorMessage(error)} />
      </SectionCard>
    )
  }

  if (!initialSummary || initialSummary.performance_rows.length === 0) {
    return (
      <SectionCard className="px-6 py-10">
        <EmptyState
          title="No live checkouts yet"
          body="Create the first end-of-tenancy checkout to populate the operations portfolio."
        />
      </SectionCard>
    )
  }

  const { stats, status_breakdown, issue_severity_breakdown, performance_rows } = initialSummary

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
                items={Object.entries(status_breakdown).map(([label, value]) => ({
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
                items={Object.entries(issue_severity_breakdown).map(([label, value]) => ({
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
          <MetaItem label="Ready for submission" value={stats.ready_for_claim} />
          <MetaItem label="Recommendations recorded" value={stats.recommendation_count} />
          <MetaItem label="Generated claims" value={stats.generated_claim_count} />
          <MetaItem label="Claim total" value={formatCurrency(stats.claim_amount)} />
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-4 text-sm leading-6 text-zinc-600">
            These analytics views now read from a compact live reporting summary instead of hydrating every
            checkout workspace individually.
          </div>
        </DetailPanel>
      </div>

      <section className="grid gap-4 xl:grid-cols-5">
        <MetaItem label="Active checkouts" value={stats.active_cases} />
        <MetaItem label="Live portfolio" value={stats.total_cases} />
        <MetaItem label="Evidence logged" value={stats.total_evidence} />
        <MetaItem label="Issues assessed" value={stats.total_issues} />
        <MetaItem
          label="Evidence / checkout"
          value={stats.average_evidence_per_case.toFixed(1)}
        />
      </section>

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
                {performance_rows.map((row) => (
                  <tr key={row.case_id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-950">{row.property_name}</p>
                        <p className="mt-1 text-sm text-zinc-600">{row.tenant_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={formatEnumLabel(row.status)} tone={row.status} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge label={formatEnumLabel(row.priority)} tone={row.priority} />
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">{row.evidence_count}</td>
                    <td className="px-4 py-4 text-sm text-zinc-700">{row.issue_count}</td>
                    <td className="px-4 py-4 text-sm font-medium text-zinc-950">
                      {row.claim_total_amount ? formatCurrency(row.claim_total_amount) : 'Not generated'}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {formatDateTime(row.last_activity_at)}
                    </td>
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
