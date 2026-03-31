import Link from 'next/link'
import type { Metadata } from 'next'
import { PageHeader, SectionCard, SectionHeading } from '@/app/operator-ui'
import { StatusBadge } from '@/app/eot/_components/eot-ui'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Settings | Renovo',
}

export default async function SettingsPage() {
  await requireOperatorPermission('/settings', OPERATOR_PERMISSIONS.MANAGE_SETTINGS)

  const outboundConfigured = Boolean(process.env.NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace controls"
        description="Review the current operator workspace defaults, audit controls, and outbound messaging readiness."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SectionCard className="px-6 py-6">
          <SectionHeading
            eyebrow="Workspace"
            title="Operator defaults"
            description="Core settings that shape how the end-of-tenancy workspace behaves for the live team."
          />
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['Primary workspace', 'End-of-tenancy operations'],
              ['Audit trail', 'Enabled on every checkout action'],
              ['Evidence review', 'Tracked against the live workspace'],
              ['Operator notes', 'Stored in the checkout record'],
            ].map(([label, value]) => (
              <div key={label} className="border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {label}
                </dt>
                <dd className="mt-2 text-sm font-medium leading-6 text-zinc-900">{value}</dd>
              </div>
            ))}
          </dl>
        </SectionCard>

        <SectionCard className="px-6 py-6">
          <SectionHeading
            eyebrow="Outbound delivery"
            title="Messaging integration status"
            description="External delivery can remain separate from the operator workflow, but the workspace should always show whether handoff is ready."
            aside={
              <StatusBadge
                label={outboundConfigured ? 'Connected' : 'Pending setup'}
                tone={outboundConfigured ? 'stable' : 'attention'}
              />
            }
          />
          <div className="mt-6 border border-zinc-200 bg-zinc-50/70 px-5 py-5">
            <p className="text-sm font-semibold text-zinc-950">
              {outboundConfigured ? 'Outbound webhook configured' : 'Outbound webhook not configured'}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {outboundConfigured
                ? 'Renovo can hand off queued external messages to the configured delivery endpoint.'
                : 'Messages remain in the checkout record until a delivery integration is connected.'}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/knowledge"
              className="inline-flex items-center border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Open guidance hub
            </Link>
            <Link
              href="/overview"
              className="inline-flex items-center border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              Return to overview
            </Link>
          </div>
        </SectionCard>
      </section>
    </div>
  )
}
