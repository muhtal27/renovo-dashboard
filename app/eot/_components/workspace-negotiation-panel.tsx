'use client'

import { useCallback, useState } from 'react'
import {
  AlertTriangle,
  Check,
  MessageSquare,
  Scale,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { EotNegotiationItem, EotNegotiationMessage } from '@/lib/eot-types'
import { saveNegotiationMessage } from '@/lib/eot-api'

/* ── Negotiation item row ─────────────────────────────────────── */

function NegotiationRow({ item }: { item: EotNegotiationItem }) {
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
              {formatCurrency(item.proposed_amount)}
            </p>
          </div>
          {item.responded_amount !== null && (
            <div className="text-right">
              <p className="text-[11px] text-zinc-500">Response</p>
              <p className={cn(
                'text-[13px] font-semibold tabular-nums',
                item.responded_amount === item.proposed_amount ? 'text-emerald-600' : 'text-amber-600',
              )}>
                {formatCurrency(item.responded_amount)}
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
      {item.tenant_comment && (
        <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
          <p className="text-[11px] font-semibold text-amber-700">Tenant response:</p>
          <p className="mt-0.5 text-[12px] text-amber-800">{item.tenant_comment}</p>
        </div>
      )}
    </div>
  )
}

/* ── Message thread ───────────────────────────────────────────── */

function MessageThread({
  messages: initialMessages,
  caseId,
}: {
  messages: EotNegotiationMessage[]
  caseId: string
}) {
  const [messages, setMessages] = useState(initialMessages)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = useCallback(async () => {
    const text = reply.trim()
    if (!text || sending) return

    setSending(true)
    try {
      await saveNegotiationMessage(caseId, { content: text })
      // Optimistic append
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          case_id: caseId,
          sender_role: 'operator' as const,
          sender_name: 'Operator',
          content: text,
          sent_at: new Date().toISOString(),
        },
      ])
      setReply('')
    } catch (err) {
      console.error('Failed to send negotiation message', err)
    } finally {
      setSending(false)
    }
  }, [caseId, reply, sending])

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-zinc-400" />
        <h4 className="text-sm font-semibold text-zinc-900">Correspondence</h4>
      </div>
      <div className="mt-4 space-y-3">
        {messages.length === 0 && (
          <p className="py-4 text-center text-sm text-zinc-500">
            No correspondence yet.
          </p>
        )}
        {messages.map((msg) => {
          const isOp = msg.sender_role === 'operator'
          const dateStr = (() => {
            try {
              return new Date(msg.sent_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            } catch {
              return msg.sent_at
            }
          })()
          return (
            <div key={msg.id} className={cn('flex flex-col', isOp ? 'items-end' : 'items-start')}>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'text-[11px] font-semibold',
                  isOp ? 'text-emerald-700' : 'text-fuchsia-600',
                )}>
                  {msg.sender_name}
                </span>
                <span className="text-[10px] text-zinc-400">{dateStr}</span>
              </div>
              <div className={cn(
                'mt-1 max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed',
                isOp
                  ? 'rounded-br-sm bg-emerald-600 text-white'
                  : 'rounded-bl-sm border border-zinc-200 bg-zinc-50 text-zinc-900',
              )}>
                {msg.content}
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
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
          placeholder="Type a response..."
          aria-label="Reply message"
          className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!reply.trim() || sending}
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

type WorkspaceNegotiationPanelProps = {
  caseId: string
  items: EotNegotiationItem[]
  messages: EotNegotiationMessage[]
}

export function WorkspaceNegotiationPanel({
  caseId,
  items,
  messages,
}: WorkspaceNegotiationPanelProps) {
  const totalProposed = items.reduce((s, i) => s + i.proposed_amount, 0)
  const agreed = items.filter((i) => i.status === 'agreed')
  const disputed = items.filter((i) => i.status === 'disputed')
  const pending = items.filter((i) => i.status === 'pending')

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
            {items.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">
                No negotiation items yet.
              </p>
            ) : (
              items.map((item) => (
                <NegotiationRow key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        {/* Correspondence */}
        <MessageThread messages={messages} caseId={caseId} />
      </div>
    </div>
  )
}
