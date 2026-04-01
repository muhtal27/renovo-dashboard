import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'

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
  await requireOperatorTenant('/overview')

  return (
    <div className="space-y-8 px-6 py-6 md:px-7">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Admin
        </p>
        <h1 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-zinc-950">
          Checkout intake &amp; allocation
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Manage how end-of-tenancy checkouts arrive from inventory software and how they are
          allocated to property managers — either automatically or by manual assignment.
        </p>
      </div>

      {/* Intake section */}
      <section>
        <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
          <h2 className="text-sm font-semibold text-zinc-950">Checkout intake</h2>
          <span className="text-xs text-zinc-500">Inventory software connections</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="border-l-2 border-zinc-200 py-3 pl-5">
            <h3 className="text-sm font-semibold text-zinc-950">Incoming checkouts</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              When a checkout report is completed in your inventory software, it is pushed into
              Renovo AI as a new end-of-tenancy case. The check-in report, check-out report, and
              tenancy metadata are automatically attached.
            </p>
          </div>

          <div className="border-l-2 border-zinc-200 py-3 pl-5">
            <h3 className="text-sm font-semibold text-zinc-950">Supported integrations</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Connections to inventory platforms that can push checkout data directly into the
              workspace.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INVENTORY_INTEGRATIONS.map((integration) => (
                <span
                  key={integration.name}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700"
                >
                  {integration.name}
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                    {integration.status}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Allocation section */}
      <section>
        <div className="flex items-end gap-8 border-b border-zinc-200 pb-3">
          <h2 className="text-sm font-semibold text-zinc-950">Case allocation</h2>
          <span className="text-xs text-zinc-500">Assignment to property managers</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="border-l-2 border-emerald-300 py-3 pl-5">
            <h3 className="text-sm font-semibold text-zinc-950">Auto-allocation</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Automatically assign incoming checkouts to the property manager linked to the tenancy
              record. Falls back to round-robin distribution across available team members if no
              direct match is found.
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              Status: <span className="text-amber-600">Coming soon</span>
            </p>
          </div>

          <div className="border-l-2 border-zinc-200 py-3 pl-5">
            <h3 className="text-sm font-semibold text-zinc-950">Manual allocation</h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              A team lead or admin manually assigns each incoming checkout to a specific property
              manager from the unallocated queue. Useful for agencies that want full control over
              workload distribution.
            </p>
            <p className="mt-2 text-xs font-medium text-zinc-500">
              Status: <span className="text-amber-600">Coming soon</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
