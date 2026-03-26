import Link from 'next/link'
import type { Metadata } from 'next'
import { OperatorLayout } from '@/app/operator-layout'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { requireOperatorPermission } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Settings | Renovo',
}

export default async function SettingsPage() {
  await requireOperatorPermission('/settings', OPERATOR_PERMISSIONS.MANAGE_SETTINGS)

  const outboundConfigured = Boolean(process.env.NEXT_PUBLIC_OPERATOR_OUTBOUND_WEBHOOK_URL)

  return (
    <OperatorLayout
      pageTitle="Settings"
      pageDescription="Review operator workspace settings and outbound communication readiness for the clean-slate rollout."
    >
      <section className="grid gap-6 xl:grid-cols-2">
        <article className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
          <p className="app-kicker">Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Operator defaults
          </h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-stone-500">Primary workspace</dt>
              <dd className="text-right text-stone-800">Clean-slate backend rollout</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-stone-500">Audit trail</dt>
              <dd className="text-right text-stone-800">Enabled on every case action</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-stone-500">Case communication</dt>
              <dd className="text-right text-stone-800">Stored against the case record</dd>
            </div>
          </dl>
        </article>

        <article className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
          <p className="app-kicker">Outbound delivery</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Messaging integration status
          </h2>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            External messaging can be connected separately while the new FastAPI and Supabase stack
            is being stood up.
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5">
            <p className="text-sm font-semibold text-stone-900">
              {outboundConfigured ? 'Outbound webhook configured' : 'Outbound webhook not configured'}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {outboundConfigured
                ? 'Renovo can hand off queued external messages to the configured delivery endpoint.'
                : 'Messages remain queued in the case record until delivery integration is connected.'}
            </p>
          </div>
          <Link
            href="/knowledge"
            className="mt-6 inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
          >
            Open guidance
          </Link>
        </article>
      </section>
    </OperatorLayout>
  )
}
