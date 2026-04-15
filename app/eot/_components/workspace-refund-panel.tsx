'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  Landmark,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { EotRefundSummary } from '@/lib/eot-types'

/* ── Donut chart ──────────────────────────────────────────────── */

function RefundDonut({
  deposit,
  deductions,
  refund,
}: {
  deposit: number
  deductions: number
  refund: number
}) {
  if (deposit <= 0) return null

  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const deductionPct = Math.min((deductions / deposit) * 100, 100)
  const refundPct = 100 - deductionPct
  const deductionDash = (deductionPct / 100) * circumference
  const refundDash = (refundPct / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Deposit breakdown: ${formatCurrency(refund)} refund to tenant, ${formatCurrency(deductions)} deductions`}>
        {/* Refund portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeDasharray={`${refundDash} ${circumference}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
        />
        {/* Deductions portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f43f5e"
          strokeWidth={strokeWidth}
          strokeDasharray={`${deductionDash} ${circumference}`}
          strokeDashoffset={circumference / 4 - refundDash}
          strokeLinecap="round"
        />
        {/* Center text */}
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fill="#18181b" fontSize="22" fontWeight="700">
          {formatCurrency(refund)}
        </text>
        <text x={size / 2} y={size / 2 + 10} textAnchor="middle" fill="#a1a1aa" fontSize="10">
          refund to tenant
        </text>
      </svg>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Refund {formatCurrency(refund)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
          Deductions {formatCurrency(deductions)}
        </span>
      </div>
    </div>
  )
}

/* ── Breakdown row ────────────────────────────────────────────── */

function BreakdownRow({
  label,
  amount,
  tone,
}: {
  label: string
  amount: number
  tone: 'default' | 'danger' | 'accent'
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-3 last:border-b-0">
      <span className="text-[13px] text-zinc-700">{label}</span>
      <span className={cn(
        'text-[13px] font-semibold tabular-nums',
        tone === 'danger' ? 'text-rose-600' : tone === 'accent' ? 'text-emerald-600' : 'text-zinc-900',
      )}>
        {tone === 'danger' ? '−' : ''}{formatCurrency(amount)}
      </span>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

type WorkspaceRefundPanelProps = {
  refund: EotRefundSummary | null
}

export function WorkspaceRefundPanel({ refund }: WorkspaceRefundPanelProps) {
  const [submitted, setSubmitted] = useState(false)

  const depositHeld = refund?.deposit_held ?? 0
  const agreedDeductions = refund?.agreed_deductions ?? 0
  const disputedDeductions = refund?.disputed_deductions ?? 0
  const refundToTenant = refund?.refund_to_tenant ?? depositHeld
  const lineItems = refund?.line_items ?? []

  const agreedItems = lineItems.filter((li) => li.status === 'agreed')
  const disputedItems = lineItems.filter((li) => li.status !== 'agreed')

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        {/* Refund visualization */}
        <div className="stat-card flex flex-col items-center justify-center py-8">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">Deposit Breakdown</h4>
          {depositHeld > 0 ? (
            <RefundDonut
              deposit={depositHeld}
              deductions={agreedDeductions}
              refund={refundToTenant}
            />
          ) : (
            <p className="text-sm text-zinc-500">No deposit information available.</p>
          )}
        </div>

        {/* Line items */}
        <div className="stat-card">
          <h4 className="mb-2 text-sm font-semibold text-zinc-900">
            Refund Calculation
          </h4>
          <BreakdownRow label="Original Deposit" amount={depositHeld} tone="default" />
          {agreedItems.map((li) => (
            <BreakdownRow key={li.description} label={li.description} amount={li.amount} tone="danger" />
          ))}
          <div className="mt-2 flex items-center justify-between border-t-2 border-zinc-900 pt-3">
            <span className="text-[14px] font-bold text-zinc-900">Refund to Tenant</span>
            <span className="text-[18px] font-bold tabular-nums text-emerald-600">
              {formatCurrency(refundToTenant)}
            </span>
          </div>

          {/* Disputed note */}
          {disputedDeductions > 0 && (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
              <p className="text-[12px] text-amber-800">
                <strong>Note:</strong> {formatCurrency(disputedDeductions)} in disputed deductions
                ({disputedItems.length} item{disputedItems.length !== 1 ? 's' : ''})
                are pending resolution and excluded from this calculation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scheme submission */}
      <div className="stat-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-zinc-400" />
            <h4 className="text-sm font-semibold text-zinc-900">Scheme Submission</h4>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
              Deposit Held
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900">{formatCurrency(depositHeld)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
              Agreed Deductions
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900">{formatCurrency(agreedDeductions)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
              Submission Status
            </p>
            <span className={cn(
              'mt-0.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
              submitted
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-zinc-200 bg-zinc-100 text-zinc-600',
            )}>
              {submitted ? (
                <><Check className="h-3 w-3" /> Submitted</>
              ) : (
                'Ready to Submit'
              )}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={submitted}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold transition',
              submitted
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'bg-zinc-900 text-white hover:bg-zinc-800',
            )}
          >
            {submitted ? (
              <><Check className="h-3.5 w-3.5" /> Submitted to Scheme</>
            ) : (
              <><ArrowRight className="h-3.5 w-3.5" /> Submit to Scheme</>
            )}
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Download className="h-3.5 w-3.5" />
            Download Summary PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on Scheme Portal
          </button>
        </div>
      </div>
    </div>
  )
}
