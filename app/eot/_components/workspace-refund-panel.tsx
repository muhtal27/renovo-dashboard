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

/* ── Mock refund calculation ──────────────────────────────────── */

const MOCK_DEPOSIT = 1250
const MOCK_AGREED_DEDUCTIONS = 405 // kitchen + blind + partial garden
const MOCK_DISPUTED_DEDUCTIONS = 380 // carpet + wall marks + rest of garden
const MOCK_REFUND = MOCK_DEPOSIT - MOCK_AGREED_DEDUCTIONS

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
  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const deductionPct = (deductions / deposit) * 100
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

export function WorkspaceRefundPanel() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        {/* Refund visualization */}
        <div className="stat-card flex flex-col items-center justify-center py-8">
          <h4 className="mb-4 text-sm font-semibold text-zinc-900">Deposit Breakdown</h4>
          <RefundDonut
            deposit={MOCK_DEPOSIT}
            deductions={MOCK_AGREED_DEDUCTIONS}
            refund={MOCK_REFUND}
          />
        </div>

        {/* Line items */}
        <div className="stat-card">
          <h4 className="mb-2 text-sm font-semibold text-zinc-900">
            Refund Calculation
          </h4>
          <BreakdownRow label="Original Deposit" amount={MOCK_DEPOSIT} tone="default" />
          <BreakdownRow label="Kitchen deep clean" amount={180} tone="danger" />
          <BreakdownRow label="Missing window blind" amount={45} tone="danger" />
          <BreakdownRow label="Garden maintenance (agreed)" amount={100} tone="danger" />
          <BreakdownRow label="Bedroom wall marks (shared)" amount={80} tone="danger" />
          <div className="mt-2 flex items-center justify-between border-t-2 border-zinc-900 pt-3">
            <span className="text-[14px] font-bold text-zinc-900">Refund to Tenant</span>
            <span className="text-[18px] font-bold tabular-nums text-emerald-600">
              {formatCurrency(MOCK_REFUND)}
            </span>
          </div>

          {/* Disputed note */}
          {MOCK_DISPUTED_DEDUCTIONS > 0 && (
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
              <p className="text-[12px] text-amber-800">
                <strong>Note:</strong> {formatCurrency(MOCK_DISPUTED_DEDUCTIONS)} in disputed deductions
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
          <span className="text-xs text-zinc-500">SafeDeposits Scotland</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
              Scheme Reference
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900">SDS-2026-04281</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
              Deposit Type
            </p>
            <p className="mt-0.5 text-sm font-medium text-zinc-900">Custodial</p>
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
