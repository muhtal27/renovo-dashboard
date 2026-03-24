import Link from 'next/link'
import { cookies } from 'next/headers'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OperatorLayout } from '@/app/operator-layout'
import { deriveInventoryRecords } from '@/lib/end-of-tenancy/operations'
import { listEndOfTenancyCases } from '@/lib/end-of-tenancy/queries'
import {
  parseSupabaseSessionCookie,
  SUPABASE_SESSION_COOKIE,
} from '@/lib/supabase-session'
import { getSupabaseServerAuthClient } from '@/lib/supabase-admin'

export const metadata: Metadata = {
  title: 'Inventories | Renovo',
}

export default async function InventoriesPage() {
  const cookieStore = await cookies()
  const sessionCookie = parseSupabaseSessionCookie(
    cookieStore.get(SUPABASE_SESSION_COOKIE)?.value
  )

  if (!sessionCookie) {
    redirect('/login?returnTo=/inventories')
  }

  const authClient = getSupabaseServerAuthClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser(sessionCookie.access_token)

  if (authError || !user) {
    redirect('/login?returnTo=/inventories')
  }

  const items = await listEndOfTenancyCases({ limit: 250 })
  const inventories = deriveInventoryRecords(items)

  return (
    <OperatorLayout
      pageTitle="Inventories"
      pageDescription="Review check-in and check-out coverage upstream of claims and disputes. This queue keeps inventory gaps visible before the case moves further."
    >
      <section className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-3 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="app-kicker">Inventory review</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Check-in, check-out, and evidence coverage
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              Use this view to catch missing reports, weak photo coverage, and cases that are ready
              for room-by-room comparison.
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
                <th className="px-3 py-2">Check-in</th>
                <th className="px-3 py-2">Check-out</th>
                <th className="px-3 py-2">Missing evidence</th>
                <th className="px-3 py-2">Linked case</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {inventories.map((item) => (
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
                    {item.checkInCount}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.checkOutCount}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.missingEvidence.length > 0 ? item.missingEvidence.join(', ') : 'Complete'}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.linkedCase}
                  </td>
                  <td className="rounded-r-[1.4rem] border border-stone-200 bg-white px-3 py-4 text-right">
                    <Link
                      href={`/cases/${item.caseId}#evidence`}
                      className="inline-flex rounded-full border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
                    >
                      Open evidence
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
