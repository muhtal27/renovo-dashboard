'use client'

import { Check, Clock, MessageSquare, X } from 'lucide-react'
import { useMemo } from 'react'
import { WorkspaceBadge } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import {
  getCheckoutNegotiationPresentation,
} from '@/lib/operator-checkout-workspace-helpers'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepNegotiation({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const negotiationStatus = data.checkoutCase?.negotiationStatus ?? 'pending'
  const negotiationPresentation = getCheckoutNegotiationPresentation(negotiationStatus)
  const totalClaimed = data.workspace.totals.totalClaimed ?? 0
  const depositHeld = data.workspace.totals.depositAmount ?? 0
  const breakdown = data.workspace.claimBreakdown ?? []
  const messages = data.workspace.messages ?? []

  const responseStats = useMemo(() => {
    const total = breakdown.length
    const decided = breakdown.filter((i) => i.decision).length
    const pending = total - decided
    return { total, decided, pending }
  }, [breakdown])

  return (
    <div className="space-y-5">
      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card flex items-start gap-3">
          <div className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            negotiationStatus === 'agreed' ? 'bg-emerald-50 text-emerald-600'
              : negotiationStatus === 'disputed' ? 'bg-rose-50 text-rose-600'
              : 'bg-amber-50 text-amber-600'
          )}>
            {negotiationStatus === 'agreed' ? <Check className="h-[18px] w-[18px]" /> :
             negotiationStatus === 'disputed' ? <X className="h-[18px] w-[18px]" /> :
             <Clock className="h-[18px] w-[18px]" />}
          </div>
          <div>
            <span className="stat-label">Status</span>
            <div className="mt-1">
              <WorkspaceBadge
                label={negotiationPresentation.label}
                tone={negotiationPresentation.tone}
              />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Proposed</span>
          <div className="stat-value text-emerald-600">{formatCurrency(totalClaimed)}</div>
          <p className="mt-1 text-xs text-zinc-500">{breakdown.length} deduction items</p>
        </div>

        <div className="stat-card">
          <span className="stat-label">Deposit Held</span>
          <div className="stat-value">{formatCurrency(depositHeld ?? 0)}</div>
          <p className="mt-1 text-xs text-zinc-500">
            {depositHeld ? `${Math.round((totalClaimed / depositHeld) * 100)}% claimed` : '\u2014'}
          </p>
        </div>
      </div>

      {/* ── Response Tracking + Message Thread ── */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Response Tracking */}
        <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5">
          <h4 className="text-sm font-semibold text-zinc-900">Response Tracking</h4>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-md bg-zinc-50 px-3 py-2.5 text-center">
              <div className="text-lg font-bold tabular-nums text-zinc-900">{responseStats.pending}</div>
              <div className="text-[11px] font-medium text-zinc-500">Pending</div>
            </div>
            <div className="rounded-md bg-emerald-50 px-3 py-2.5 text-center">
              <div className="text-lg font-bold tabular-nums text-emerald-600">{responseStats.decided}</div>
              <div className="text-[11px] font-medium text-emerald-600">Decided</div>
            </div>
            <div className="rounded-md bg-zinc-50 px-3 py-2.5 text-center">
              <div className="text-lg font-bold tabular-nums text-zinc-700">{responseStats.total}</div>
              <div className="text-[11px] font-medium text-zinc-500">Total</div>
            </div>
          </div>

          {responseStats.total > 0 ? (
            <div className="mt-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${(responseStats.decided / responseStats.total) * 100}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-zinc-400">
                <span>{responseStats.decided} of {responseStats.total} decided</span>
                <span>{Math.round((responseStats.decided / responseStats.total) * 100)}%</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Message Thread */}
        <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5">
          <h4 className="mb-3 text-sm font-semibold text-zinc-900">Message Thread</h4>
          {messages.length > 0 ? (
            <div className="space-y-2">
              {messages.slice(-5).map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'rounded-lg px-3 py-2 text-[13px]',
                    msg.sender_type === 'manager' ? 'bg-emerald-600 text-white ml-8' : 'bg-zinc-50 text-zinc-700 mr-8'
                  )}
                >
                  <p className="text-[11px] font-medium opacity-70">{formatEnumLabel(msg.sender_type)}</p>
                  <p className="mt-0.5">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-5 w-5 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700">No messages yet</p>
              <p className="mt-0.5 text-xs text-zinc-500">Messages from tenants and landlords will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Deduction Items ── */}
      <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-zinc-900">Deduction Items</h4>
          <span className="text-[11px] font-medium text-zinc-500">{breakdown.length} items</span>
        </div>
        {breakdown.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-left">Room</th>
                  <th className="text-left">Liability</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => {
                  const decision = item.decision?.toLowerCase() ?? ''
                  const liabilityBadge = decision.includes('tenant')
                    ? { label: 'Tenant', cls: 'bg-rose-50 text-rose-700' }
                    : decision.includes('landlord')
                      ? { label: 'Landlord', cls: 'bg-sky-50 text-sky-700' }
                      : decision.includes('shared')
                        ? { label: 'Shared', cls: 'bg-amber-50 text-amber-700' }
                        : { label: item.decision ? formatEnumLabel(item.decision) : '\u2014', cls: 'bg-zinc-100 text-zinc-600' }
                  return (
                    <tr key={item.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3 text-[13px] font-medium text-zinc-950">{item.title}</td>
                      <td className="px-4 py-3 text-[13px]">
                        {'room' in item && (item as Record<string, unknown>).room ? (
                          <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
                            {String((item as Record<string, unknown>).room)}
                          </span>
                        ) : (
                          <span className="text-zinc-400">\u2014</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold', liabilityBadge.cls)}>
                          {liabilityBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[13px] font-medium text-zinc-700">
                        {formatCurrency(item.estimatedCost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-200">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-zinc-900">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600">{formatCurrency(totalClaimed)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="mt-3 py-4 text-center text-sm text-zinc-500">No deduction items.</p>
        )}
      </div>
    </div>
  )
}
