import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Inventory feedback | Renovo AI',
}

export default async function InventoryFeedbackPage() {
  await requireOperatorTenant('/inventory-feedback')

  return (
    <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
      <div className="max-w-3xl space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Inventory feedback
        </p>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-zinc-950">
          Inventory Feedback
        </h2>
        <p className="text-sm leading-6 text-zinc-600">
          This feature is coming soon. You will be able to review inventory feedback, manage
          response queues, and access source report context from here.
        </p>
      </div>
    </section>
  )
}
