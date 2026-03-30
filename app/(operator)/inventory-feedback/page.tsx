import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Inventory feedback | Renovo',
}

export default async function InventoryFeedbackPage() {
  await requireOperatorTenant('/inventory-feedback')

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:px-7">
      <div className="max-w-3xl space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Inventory feedback
        </p>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
          Inventory feedback is not wired yet
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          This placeholder route keeps the operator sidebar navigation valid while the inventory
          feedback workflow is being defined. Hook the page into the eventual feedback queue,
          review tools, and source report context when that feature is ready.
        </p>
      </div>
    </section>
  )
}
