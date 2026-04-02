import Link from 'next/link'
import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { CaseAllocationPanel } from './case-allocation-panel'

export const metadata: Metadata = {
  title: 'Admin | Renovo AI',
}

const INVENTORY_INTEGRATIONS = [
  { name: 'Reapit', status: 'planned' as const },
  { name: 'Arthur Online', status: 'planned' as const },
  { name: 'Inventory Base', status: 'planned' as const },
  { name: 'No Letting Go', status: 'planned' as const },
  { name: 'Imfuna', status: 'planned' as const },
] as const

export default async function AdminPage() {
  await requireOperatorTenant('/admin')

  return (
    <div className="space-y-6">
      {/* Intake */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Checkout intake</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Manage how end-of-tenancy checkouts arrive from inventory software.
        </p>

        <div className="mt-5 space-y-4">
          <div className="border-b border-zinc-100 pb-4">
            <p className="text-sm font-medium text-zinc-950">Incoming checkouts</p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              When a checkout report is completed in your inventory software, it is pushed into
              Renovo AI as a new end-of-tenancy case. The check-in report, checkout report, and
              tenancy metadata are automatically attached.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-950">Supported integrations</p>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Connections to inventory platforms that can push checkout data directly into the
              workspace.
            </p>
            <div className="mt-3 overflow-hidden border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                      Platform
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {INVENTORY_INTEGRATIONS.map((integration) => (
                    <tr
                      key={integration.name}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-2.5 font-medium text-zinc-950">
                        {integration.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-amber-600">Planned</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Allocation */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Case allocation</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Assign incoming checkouts to property managers. Select a team member from the dropdown to
          allocate, or remove an existing assignment.
        </p>

        <div className="mt-5">
          <CaseAllocationPanel />
        </div>
      </section>

      {/* Teams */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Teams</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Manage workspace members, roles, and team structure.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link
            href="/teams/members"
            className="flex items-start gap-4 border border-zinc-200 px-5 py-4 transition hover:border-zinc-300 hover:bg-zinc-50/50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-950">Members</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Add, remove, and manage workspace members. Assign roles and control access.
              </p>
            </div>
          </Link>
          <Link
            href="/teams/teams"
            className="flex items-start gap-4 border border-zinc-200 px-5 py-4 transition hover:border-zinc-300 hover:bg-zinc-50/50"
          >
            <div>
              <p className="text-sm font-medium text-zinc-950">Team groups</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Organise members into teams by portfolio, region, or function.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
