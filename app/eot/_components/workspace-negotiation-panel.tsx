'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  MessageSquare,
  Scale,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'

/* ── Types ────────────────────────────────────────────────────── */

type NegotiationStatus = 'pending' | 'disputed' | 'agreed'

type NegotiationItem = {
  id: string
  description: string
  proposedAmount: number
  respondedAmount: number | null
  status: NegotiationStatus
  tenantComment: string | null
}

/* ── Mock data ────────────────────────────────────────────────── */

const MOCK_NEGOTIATION_ITEMS: NegotiationItem[] = [
  {
    id: 'n1',
    description: 'Carpet staining in living room',
    proposedAmount: 320,
    respondedAmount: 200,
    status: 'disputed',
    tenantComment: 'The stain was already present when I moved in. I have photos from the first week.',
  },
  {
    id: 'n2',
    description: 'Kitchen deep clean',
    proposedAmount: 180,
    respondedAmount: 180,
    status: 'agreed',
    tenantComment: null,
  },
  {
    id: 'n3',
    description: 'Bedroom wall marks (shared)',
    proposedAmount: 60,
    respondedAmount: null,
    status: 'pending',
    tenantComment: null,
  },
  {
    id: 'n4',
    description: 'Missing window blind',
    proposedAmount: 45,
    respondedAmount: 45,
    status: 'agreed',
    tenantComment: null,
  },
  {
    id: 'n5',
    description: 'Garden maintenance',
    proposedAmount: 150,
    respondedAmount: 100,
    status: 'disputed',
    tenantComment: 'I maintained the garden regularly. The overgrowth is from after I left.',
  },
]

const MOCK_MESSAGES = [
  { id: 'm1', from: 'Operator', role: 'operator' as const, time: '10 Apr 2026', text: 'Dear Ms Campbell, please find the proposed deductions attached. You have 14 days to respond.' },
  { id: 'm2', from: 'Claire Campbell', role: 'tenant' as const, time: '12 Apr 2026', text: 'I have reviewed the deductions. I agree with the kitchen clean and blind replacement but I dispute the carpet staining and garden charges.' },
  { id: 'm3', from: 'Operator', role: 'operator' as const, time: '13 Apr 2026', text: 'Thank you for your response. We will review your comments and the additional evidence you have provided.' },
]

/* ── Negotiation item row ─────────────────────────────────────── */

function NegotiationRow({ item }: { item: NegotiationItem }) {
  const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
    disputed: { label: 'Disputed', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    agreed: { label: 'Agreed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }

  const config = statusConfig[item.status]

  return (
    <div className="border-b border-zinc-100 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-zinc-900">{item.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-zinc-500">Proposed</p>
            <p className="text-[13px] font-semibold tabular-nums text-zinc-900">
              {formatCurrency(item.proposedAmount)}
            </p>
          </div>
          {item.respondedAmount !== null && (
            <div className="text-right">
              <p className="text-[11px] text-zinc-500">Response</p>
              <p className={cn(
                'text-[13px] font-semibold tabular-nums',
                item.respondedAmount === item.proposedAmount ? 'text-emerald-600' : 'text-amber-600',
              )}>
                {formatCurrency(item.respondedAmount)}
              </p>
            </div>
          )}
          <span className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold',
            config.bg,
          )}>
            {config.label}
          </span>
        </div>
      </div>
      {item.tenantComment && (
        <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
          <p className="text-[11px] font-semibold text-amber-700">Tenant response:</p>
          <p className="mt-0.5 text-[12px] text-amber-800">{item.tenantComment}</p>
        </div>
      )}
    </div>
  )
}

/* ── Message thread ───────────────────────────────────────────── */

function MessageThread() {
  const [reply, setReply] = useState('')

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-zinc-400" />
        <h4 className="text-sm font-semibold text-zinc-900">Correspondence</h4>
      </div>
      <div className="mt-4 space-y-3">
        {MOCK_MESSAGES.map((msg) => {
          const isOp = msg.role === 'operator'
          return (
            <div key={msg.id} className={cn('flex flex-col', isOp ? 'items-end' : 'items-start')}>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-[11px] font-semibold',
                  isOp ? 'text-emerald-700' : 'text-fuchsia-600',
                )}>
                  {msg.from}
                </span>
                <span className="text-[10px] text-zinc-400">{msg.time}</span>
              </div>
              <div className={cn(
                'mt-1 max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed',
                isOp
                  ? 'rounded-br-sm bg-emerald-600 text-white'
                  : 'rounded-bl-sm border border-zinc-200 bg-zinc-50 text-zinc-900',
              )}>
                {msg.text}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-end gap-2 border-t border-zinc-100 pt-3">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a response..."
          aria-label="Reply message"
          className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
        />
        <button
          type="button"
          disabled={!reply.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40"
          aria-label="Send reply"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

export function WorkspaceNegotiationPanel() {
  const totalProposed = MOCK_NEGOTIATION_ITEMS.reduce((s, i) => s + i.proposedAmount, 0)
  const agreed = MOCK_NEGOTIATION_ITEMS.filter((i) => i.status === 'agreed')
  const disputed = MOCK_NEGOTIATION_ITEMS.filter((i) => i.status === 'disputed')
  const pending = MOCK_NEGOTIATION_ITEMS.filter((i) => i.status === 'pending')

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="stat-card text-center">
          <p className="text-lg font-bold text-zinc-900">{formatCurrency(totalProposed)}</p>
          <p className="text-[11px] text-zinc-500">Total Proposed</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-lg font-bold text-emerald-600">{agreed.length}</p>
          <p className="text-[11px] text-zinc-500">Agreed</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-lg font-bold text-rose-600">{disputed.length}</p>
          <p className="text-[11px] text-zinc-500">Disputed</p>
        </div>
        <div className="stat-card text-center">
          <p className="text-lg font-bold text-zinc-500">{pending.length}</p>
          <p className="text-[11px] text-zinc-500">Pending</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        {/* Items list */}
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-zinc-400" />
            <h4 className="text-sm font-semibold text-zinc-900">Deduction Items</h4>
          </div>
          <div className="mt-3">
            {MOCK_NEGOTIATION_ITEMS.map((item) => (
              <NegotiationRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Correspondence */}
        <MessageThread />
      </div>
    </div>
  )
}
