import type { Metadata } from 'next'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Settings | Renovo AI',
}

export default async function SettingsPage() {
  await requireOperatorPermission('/settings', OPERATOR_PERMISSIONS.MANAGE_SETTINGS)

  const outboundConfigured = Boolean(process.env.NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL)

  return (
    <div className="space-y-6">
      {/* Operator defaults */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Operator defaults</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Core settings that shape how the end-of-tenancy workspace behaves.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          {(
            [
              ['Primary workspace', 'End-of-tenancy operations'],
              ['Audit trail', 'Enabled on every checkout action'],
              ['Evidence review', 'Tracked against the live workspace'],
              ['Operator notes', 'Stored in the checkout record'],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Outbound messaging */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Outbound messaging</h3>
            <p className="mt-1 text-sm text-zinc-500">
              External delivery integration for sending emails and messages from the workspace.
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-medium ${
              outboundConfigured ? 'text-emerald-700' : 'text-amber-600'
            }`}
          >
            {outboundConfigured ? 'Connected' : 'Pending setup'}
          </span>
        </div>

        <div className="mt-5 border-b border-zinc-100 pb-4">
          <p className="text-sm font-medium text-zinc-950">
            {outboundConfigured ? 'Outbound webhook configured' : 'Outbound webhook not configured'}
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {outboundConfigured
              ? 'Renovo AI can hand off queued external messages to the configured delivery endpoint.'
              : 'Messages remain in the checkout record until a delivery integration is connected.'}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500">Email provider</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">Resend</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Send-from domain</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">checkout@renovoai.co.uk</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Webhook status</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {outboundConfigured ? (
                <span className="text-emerald-700">Active</span>
              ) : (
                <span className="text-zinc-400">Not configured</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Audit & compliance */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Audit and compliance</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Controls for traceability, data retention, and regulatory compliance.
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500">Audit logging</dt>
            <dd className="mt-0.5 font-medium text-emerald-700">Enabled</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Data retention</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">7 years</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">GDPR compliance</dt>
            <dd className="mt-0.5 font-medium text-emerald-700">Active</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
