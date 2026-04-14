'use client'

import { useState } from 'react'
import { cn } from '@/lib/ui'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    tenancies: 50,
    features: ['Up to 50 tenancies', 'Basic reporting', 'Email support', '1 team member'],
    current: false,
  },
  {
    id: 'portfolio',
    name: 'Portfolio 365',
    price: 179,
    tenancies: 365,
    features: [
      'Up to 365 tenancies',
      'Advanced analytics',
      'Priority support',
      'Unlimited team members',
      'AI analysis engine',
      'API access',
    ],
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    tenancies: 1000,
    features: [
      'Up to 1,000 tenancies',
      'Custom reporting',
      'Dedicated account manager',
      'Unlimited everything',
      'Custom integrations',
      'SLA guarantee',
      'SSO & audit logs',
    ],
    current: false,
  },
]

const INVOICES = [
  { id: 'INV-2026-04', date: '1 Apr 2026', desc: 'Portfolio 365 — Monthly', amount: 179, status: 'Paid' },
  { id: 'INV-2026-03', date: '1 Mar 2026', desc: 'Portfolio 365 — Monthly', amount: 179, status: 'Paid' },
  { id: 'INV-2026-02', date: '1 Feb 2026', desc: 'Portfolio 365 — Monthly', amount: 179, status: 'Paid' },
  { id: 'INV-2026-01', date: '1 Jan 2026', desc: 'Portfolio 365 — Monthly', amount: 149, status: 'Paid' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillingPageClient() {
  const [editPayment, setEditPayment] = useState(false)
  const usedTenancies = 12
  const totalTenancies = 365
  const usagePct = Math.round((usedTenancies / totalTenancies) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900">Billing</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your subscription, usage, and payments
        </p>
      </div>

      {/* Choose Your Plan */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-zinc-900">Choose Your Plan</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'rounded-[10px] border bg-white p-5',
                plan.current
                  ? 'border-emerald-400 shadow-[0_0_0_1px_rgb(52,211,153)]'
                  : 'border-zinc-200'
              )}
            >
              {plan.current ? (
                <div className="mb-2 flex justify-end">
                  <span className="badge badge-emerald">Current Plan</span>
                </div>
              ) : (
                <div className="h-[30px]" />
              )}

              <h3 className="text-base font-semibold text-zinc-900">{plan.name}</h3>

              <div className="mt-2">
                <span className="text-[32px] font-bold tracking-tight text-zinc-900">
                  £{plan.price}
                </span>
                <span className="text-[13px] text-zinc-500">/month</span>
              </div>

              <p className="mt-1 text-[13px] text-zinc-500">
                Up to {plan.tenancies.toLocaleString()} tenancies
              </p>

              <div className="mt-4 border-t border-zinc-100 pt-4">
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-[13px] text-zinc-700">
                      <svg className="h-3.5 w-3.5 shrink-0 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {plan.current ? (
                <button
                  type="button"
                  disabled
                  className="mt-3 w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-500 opacity-50"
                >
                  Current Plan
                </button>
              ) : plan.price > 179 ? (
                <button
                  type="button"
                  className="mt-3 w-full rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
                >
                  Contact Sales
                </button>
              ) : (
                <button
                  type="button"
                  className="mt-3 w-full rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Downgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Usage Breakdown */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-zinc-900">Usage Breakdown</h3>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-[10px] bg-emerald-500 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-emerald-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5v14" />
            </svg>
            Add Block (£30/mo)
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-zinc-900">
              {usedTenancies} of {totalTenancies} tenancies used
            </span>
            <span className="text-[13px] font-semibold text-emerald-600">
              {usagePct}%
            </span>
          </div>
          <div className="h-[10px] overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Fully Managed', value: 7 },
            { label: 'Let-Only', value: 4 },
            { label: 'HMO', value: 1 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-[6px] bg-zinc-50 px-3.5 py-3 text-center"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                {stat.label}
              </div>
              <div className="mt-1 text-xl font-bold tabular-nums text-zinc-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-zinc-900">Payment Method</h3>
          <button
            type="button"
            onClick={() => setEditPayment(!editPayment)}
            className="flex items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {editPayment ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 5 4 4" />
                </svg>
                Update
              </>
            )}
          </button>
        </div>

        {editPayment ? (
          <div className="mt-4 max-w-[420px] space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Card Number
              </label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Expiry
                </label>
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Name on Card
              </label>
              <input
                type="text"
                placeholder="Jamie Mitchell"
                className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-[10px] bg-emerald-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-600"
              >
                Save Card
              </button>
              <button
                type="button"
                onClick={() => setEditPayment(false)}
                className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-[10px] bg-zinc-50 px-3.5 py-3">
            <svg className="h-5 w-5 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            <div className="flex-1">
              <div className="text-[13px] font-medium text-zinc-900">Visa ending in 4242</div>
              <div className="text-[11px] text-zinc-500">Expires 12/2027</div>
            </div>
            <span className="badge badge-emerald">Default</span>
          </div>
        )}
      </div>

      {/* Billing Contact */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="text-base font-semibold text-zinc-900">Billing Contact</h3>
        <div className="mt-3 max-w-[420px]">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Billing Email
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="email"
              defaultValue="accounts@propertyfirst.co.uk"
              className="h-10 flex-1 rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
            <button
              type="button"
              className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="overflow-hidden rounded-[10px] border border-zinc-200 bg-white">
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <h3 className="text-base font-semibold text-zinc-900">Invoice History</h3>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-600 transition hover:text-zinc-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 0L7 8m5-5 5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            </svg>
            Export All
          </button>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td className="text-zinc-700">{inv.date}</td>
                <td className="font-medium text-zinc-900">{inv.id}</td>
                <td className="text-zinc-600">{inv.desc}</td>
                <td className="text-right font-semibold tabular-nums text-zinc-900">
                  £{inv.amount}
                </td>
                <td>
                  <span className="badge badge-emerald">{inv.status}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"
                      title="View details"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700"
                      title="Download"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 12-5-5m5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
