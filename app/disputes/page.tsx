import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OperatorLayout } from '@/app/operator-layout'
import {
  deriveDisputeRecords,
  getOpenCases,
} from '@/lib/end-of-tenancy/operations'
import { listEndOfTenancyCases } from '@/lib/end-of-tenancy/queries'
import {
  parseSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
} from '@/lib/supabase-session'
import { getSupabaseServerAuthClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'Disputes | Renovo',
}

function formatMoney(value: number | string | null | undefined) {
  if (value == null || value === '') return 'Not set'
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })
    : 'Not set'
}

export default async function DisputesPage() {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(
    cookieStore.get(SUPABASE_SESSION_COOKIE)?.value
  )

  if (!sessionCookie) {
    redirect('/login?returnTo=/disputes')
  }

  const authClient = getSupabaseServerAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(sessionCookie.access_token)

  if (authError || !user) {
    redirect('/login?returnTo=/disputes')
  }

  const items = await listEndOfTenancyCases({ limit: 250 })
  const disputes = deriveDisputeRecords(items)
  const activeCases = getOpenCases(items)

  return (
    <OperatorLayout
      pageTitle="Disputes"
      pageDescription="Handle dispute work as its own queue: evidence gaps, response stages, and submitted claims stay separate from the wider case list."
    >
      <section className="grid gap-4 md:grid-cols-5">
        {['Open', 'Awaiting evidence', 'Awaiting response', 'Submitted', 'Resolved'].map((status) => (
          <article
            key={status}
            className="rounded-[1.6rem] border border-stone-200 bg-white px-5 py-5"
          >
            <p className="app-kicker">{status}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
              {disputes.filter((item) => item.status === status).length}
            </p>
          </article>
        ))}
      </section>

      <section className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-kicker">Dispute queue</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Distinct workflow for challenge and response
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              {activeCases.length} active end-of-tenancy cases are live. {disputes.length} are far
              enough along to need explicit dispute handling.
            </p>
          </div>
          <Link
            href="/eot"
            className="inline-flex items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Property</th>
                <th className="px-3 py-2">Scheme reference</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Claim value</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {disputes.map((item) => (
                <tr key={item.id}>
                  <td className="rounded-l-[1.4rem] border border-r-0 border-stone-200 bg-white px-3 py-4">
                    <p className="text-sm font-semibold text-stone-900">{item.caseNumber}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {item.tenantName} / {item.landlordName}
                    </p>
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.propertyAddress}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.schemeReference || 'Not recorded'}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.status}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {formatMoney(item.totalClaimAmount)}
                  </td>
                  <td className="rounded-r-[1.4rem] border border-stone-200 bg-white px-3 py-4 text-right">
                    <Link
                      href={`/cases/${item.caseId}#claim`}
                      className="inline-flex rounded-full border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
                    >
                      Open case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OperatorLayout>
  )
}
