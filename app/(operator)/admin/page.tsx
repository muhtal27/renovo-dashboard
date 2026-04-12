import Link from 'next/link'
import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { CaseAllocationPanel } from './case-allocation-panel'

export const metadata: Metadata = {
  title: 'Admin | Renovo AI',
}

export default async function AdminPage() {
  await requireOperatorTenant('/admin')

  return (
    <div className="space-y-6">
      {/* Allocation */}
      <section className="rounded-xl border border-zinc-200 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Case allocation</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Assign incoming checkouts to property managers.
        </p>

        <div className="mt-5">
          <CaseAllocationPanel />
        </div>
      </section>

      {/* Teams */}
      <section className="rounded-xl border border-zinc-200 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Teams</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Manage workspace members, roles, and team structure.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link
            href="/teams/members"
            className="flex items-start gap-4 rounded-xl border border-zinc-200 px-5 py-4 transition hover:border-zinc-300 hover:bg-zinc-50/50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-950">Members</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Add, remove, and manage workspace members.
              </p>
            </div>
          </Link>
          <Link
            href="/teams/teams"
            className="flex items-start gap-4 rounded-xl border border-zinc-200 px-5 py-4 transition hover:border-zinc-300 hover:bg-zinc-50/50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-950">Team groups</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Organise members into teams by portfolio or region.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
