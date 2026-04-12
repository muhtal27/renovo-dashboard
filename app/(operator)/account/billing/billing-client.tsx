'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CreditCard,
  Download,
  ExternalLink,
  Layers,
  Minus,
  Plus,
  Receipt,
  Shield,
  TrendingUp,
} from 'lucide-react'
import { KPIStatCard, ProgressBar } from '@/app/operator-ui'
import { cn } from '@/lib/ui'

/* ── mock data (replace with real Stripe/API data) ── */

const BLOCK_PRICE = 179
const TENANCIES_PER_BLOCK = 365

const mockSubscription = {
  plan: 'Portfolio 365',
  status: 'active' as const,
  blocks: 2,
  billingCycle: 'Monthly',
  currentPeriodEnd: '2026-05-09',
  nextInvoiceAmount: 358,
}

const mockUsage = {
  fullyManagedTenancies: 412,
  letOnlyTenancies: 87,
  totalTenancies: 499,
  activeCases: 23,
}

const mockPaymentMethod = {
  brand: 'Visa',
  last4: '4242',
  expMonth: 12,
  expYear: 2027,
}

const mockInvoices = [
  { id: 'inv_001', date: '2026-04-01', amount: 358, status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_002', date: '2026-03-01', amount: 358, status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_003', date: '2026-02-01', amount: 179, status: 'paid' as const, pdfUrl: '#' },
  { id: 'inv_004', date: '2026-01-01', amount: 0, status: 'paid' as const, pdfUrl: '#' },
]

/* ── helpers ── */

function formatGBP(amount: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/* ── component ── */

export function BillingPageClient() {
  const [blocks, setBlocks] = useState(mockSubscription.blocks)
  const [showConfirm, setShowConfirm] = useState(false)

  const capacity = blocks * TENANCIES_PER_BLOCK
  const usagePercent = capacity > 0 ? Math.round((mockUsage.fullyManagedTenancies / capacity) * 100) : 0
  const monthlyCost = blocks * BLOCK_PRICE
  const isOverCapacity = mockUsage.fullyManagedTenancies > capacity

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Plan overview ── */}
      <section className="border border-zinc-200 bg-white shadow-sm px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Current plan</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Your active subscription and billing summary.
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              mockSubscription.status === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-zinc-100 text-zinc-500',
            )}
          >
            {mockSubscription.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Plan</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{mockSubscription.plan}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Portfolio blocks</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {mockSubscription.blocks} {mockSubscription.blocks === 1 ? 'block' : 'blocks'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Billing cycle</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{mockSubscription.billingCycle}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Next invoice</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {formatGBP(mockSubscription.nextInvoiceAmount)} on {formatDate(mockSubscription.currentPeriodEnd)}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Usage ── */}
      <section className="border border-zinc-200 bg-white shadow-sm px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Usage</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Fully managed tenancies count toward your block allocation. Let-only tenancies are always free.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 md:grid-cols-4">
          <div className="bg-white px-5 py-4">
            <KPIStatCard label="Fully managed" value={mockUsage.fullyManagedTenancies} tone="default" />
          </div>
          <div className="bg-white px-5 py-4">
            <KPIStatCard label="Let-only (free)" value={mockUsage.letOnlyTenancies} tone="accent" />
          </div>
          <div className="bg-white px-5 py-4">
            <KPIStatCard label="Block capacity" value={capacity} tone="default" />
          </div>
          <div className="bg-white px-5 py-4">
            <KPIStatCard
              label="Utilisation"
              value={`${usagePercent}%`}
              tone={isOverCapacity ? 'danger' : usagePercent >= 80 ? 'warning' : 'default'}
            />
          </div>
        </div>

        <div className="mt-5">
          <ProgressBar
            value={Math.min(usagePercent, 100)}
            label={
              <>
                <span>
                  {mockUsage.fullyManagedTenancies} of {capacity} fully managed tenancies used
                </span>
                <span className={cn(isOverCapacity ? 'font-medium text-rose-600' : '')}>
                  {isOverCapacity
                    ? `${mockUsage.fullyManagedTenancies - capacity} over capacity`
                    : `${capacity - mockUsage.fullyManagedTenancies} remaining`}
                </span>
              </>
            }
          />
        </div>

        {isOverCapacity && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            You have exceeded your current block capacity. Add another block to avoid service interruptions.
          </div>
        )}
      </section>

      {/* ── Manage blocks ── */}
      <section className="border border-zinc-200 bg-white shadow-sm px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Manage portfolio blocks</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Each block covers up to {TENANCIES_PER_BLOCK} fully managed tenancies at {formatGBP(BLOCK_PRICE)}/month + VAT.
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Layers className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setBlocks((b) => Math.max(1, b - 1))}
              disabled={blocks <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="text-center">
              <p className="text-3xl font-bold tabular-nums text-zinc-950">{blocks}</p>
              <p className="text-xs text-zinc-500">{blocks === 1 ? 'block' : 'blocks'}</p>
            </div>

            <button
              type="button"
              onClick={() => setBlocks((b) => Math.min(5, b + 1))}
              disabled={blocks >= 5}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-sm text-zinc-500">Estimated monthly cost</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-zinc-950">
              {formatGBP(monthlyCost)}
              <span className="text-sm font-normal text-zinc-500"> + VAT</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Up to {blocks * TENANCIES_PER_BLOCK} fully managed tenancies
            </p>
          </div>
        </div>

        {blocks !== mockSubscription.blocks && (
          <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-zinc-600">
                Changing from {mockSubscription.blocks} to {blocks} {blocks === 1 ? 'block' : 'blocks'}
                {' — '}
                <span className="font-medium text-zinc-950">
                  {blocks > mockSubscription.blocks ? '+' : ''}
                  {formatGBP((blocks - mockSubscription.blocks) * BLOCK_PRICE)}/mo
                </span>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBlocks(mockSubscription.blocks)}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Update subscription
              </button>
            </div>
          </div>
        )}

        {blocks >= 5 && (
          <p className="mt-4 text-sm text-zinc-500">
            Need more than 5 blocks?{' '}
            <Link href="/contact" className="font-medium text-emerald-600 hover:text-emerald-700">
              Talk to sales
            </Link>{' '}
            for Enterprise pricing.
          </p>
        )}
      </section>

      {/* ── Payment method ── */}
      <section className="border border-zinc-200 bg-white shadow-sm px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Payment method</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Manage the card or payment method on file.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Update
          </button>
        </div>

        {mockPaymentMethod ? (
          <div className="mt-5 flex items-center gap-4 rounded-lg border border-zinc-100/80 bg-zinc-50/80 px-4 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200">
              <CreditCard className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-950">
                {mockPaymentMethod.brand} ending in {mockPaymentMethod.last4}
              </p>
              <p className="text-xs text-zinc-500">
                Expires {mockPaymentMethod.expMonth.toString().padStart(2, '0')}/{mockPaymentMethod.expYear}
              </p>
            </div>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-zinc-100/80 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            No payment method on file.{' '}
            <Link href="/checkout" className="font-medium text-emerald-600 hover:text-emerald-700">
              Add a payment method
            </Link>
          </div>
        )}
      </section>

      {/* ── Billing history ── */}
      <section className="border border-zinc-200 bg-white shadow-sm px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Billing history</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Past invoices and payment records.
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
            <Receipt className="h-4 w-4" />
          </div>
        </div>

        {mockInvoices.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-zinc-100/80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100/80 bg-zinc-50/60">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {mockInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-zinc-50 last:border-b-0 transition modern-table-row">
                    <td className="px-4 py-3 font-medium text-zinc-950">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-700">{formatGBP(inv.amount)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : inv.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700',
                        )}
                      >
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={inv.pdfUrl}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 transition hover:text-emerald-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-zinc-100/80 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
            No billing history yet.
          </div>
        )}
      </section>

      {/* ── Manage on Stripe ── */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/80 px-6 py-4">
        <p className="text-sm text-zinc-500">
          Need to manage payment details, download receipts, or cancel your subscription?
        </p>
        <a
          href="https://billing.stripe.com/p/login/test"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Stripe portal
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* ── Confirmation modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl ">
            <h3 className="text-base font-semibold text-zinc-950">Confirm subscription change</h3>
            <p className="mt-2 text-sm text-zinc-500">
              You are changing from{' '}
              <span className="font-medium text-zinc-950">{mockSubscription.blocks} {mockSubscription.blocks === 1 ? 'block' : 'blocks'}</span>
              {' '}to{' '}
              <span className="font-medium text-zinc-950">{blocks} {blocks === 1 ? 'block' : 'blocks'}</span>.
              Your new monthly cost will be{' '}
              <span className="font-medium text-zinc-950">{formatGBP(monthlyCost)} + VAT</span>.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Changes will be prorated and applied immediately.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // TODO: call Stripe API to update subscription
                  setShowConfirm(false)
                }}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
