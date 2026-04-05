import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Billing | Renovo AI',
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Current plan */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Current plan</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Your active subscription and usage summary.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Active
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Plan</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">Growth</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Billing cycle</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">Monthly</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Next invoice</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">--</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Checkouts this month</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">--</dd>
          </div>
        </dl>
      </section>

      {/* Payment method */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Payment method</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Manage the card or payment method on file.
        </p>

        <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          No payment method on file. Contact support to set up billing.
        </div>
      </section>

      {/* Billing history */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Billing history</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Past invoices and payment records.
        </p>

        <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          No billing history yet.
        </div>
      </section>
    </div>
  )
}
