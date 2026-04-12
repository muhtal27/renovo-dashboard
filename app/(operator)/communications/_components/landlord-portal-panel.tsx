'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, MessageCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { EmptyState } from '@/app/operator-ui'
import { cn } from '@/lib/ui'
import type { InboxMessage, PortalConversation } from '@/lib/communication-hub-types'

function groupByCase(messages: InboxMessage[]): PortalConversation[] {
  const groups = new Map<string, InboxMessage[]>()

  for (const msg of messages) {
    const existing = groups.get(msg.case_id)
    if (existing) {
      existing.push(msg)
    } else {
      groups.set(msg.case_id, [msg])
    }
  }

  return Array.from(groups.entries())
    .map(([caseId, msgs]) => {
      const sorted = msgs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const first = sorted[0]

      return {
        case_id: caseId,
        property_address: first.property_address,
        tenant_name: first.tenant_name,
        landlord_name: null,
        case_status: first.case_status,
        messages: sorted,
        last_message_at: first.created_at,
        unread_count: 0,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.last_message_at ?? 0).getTime() -
        new Date(a.last_message_at ?? 0).getTime()
    )
}

function ConversationCard({
  conversation,
  expanded,
  onToggle,
}: {
  conversation: PortalConversation
  expanded: boolean
  onToggle: () => void
}) {
  const landlordMessages = conversation.messages.filter(
    (m) => m.sender_type === 'landlord'
  )
  const managerMessages = conversation.messages.filter(
    (m) => m.sender_type === 'manager'
  )

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="modern-table-row flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label="Landlord" tone="landlord" />
            {conversation.case_status ? (
              <StatusBadge
                label={formatEnumLabel(conversation.case_status)}
                tone={conversation.case_status}
                className="text-[10px]"
              />
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere]">
            {conversation.property_address || 'Unknown property'}
          </p>
          {conversation.tenant_name ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              Tenant: {conversation.tenant_name}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
            <span>{landlordMessages.length} landlord messages</span>
            <span>{managerMessages.length} responses</span>
            {conversation.last_message_at ? (
              <span>
                Last: {formatDateTime(conversation.last_message_at)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/operator/cases/${conversation.case_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center text-zinc-400 hover:text-zinc-600"
            title="Open case"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <MessageCircle
            className={cn(
              'h-4 w-4 transition',
              expanded ? 'text-sky-500' : 'text-zinc-300'
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-zinc-100/80">
          {conversation.messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'border-b border-zinc-100/80 px-5 py-3 last:border-b-0',
                msg.sender_type === 'landlord' ? 'bg-sky-50/30' : 'bg-white'
              )}
            >
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={formatEnumLabel(msg.sender_type)}
                  tone={msg.sender_type}
                  className="text-[10px]"
                />
                <span className="text-[10px] text-zinc-400">
                  {formatDateTime(msg.created_at)}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-zinc-700 [overflow-wrap:anywhere]">
                {msg.content}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function LandlordPortalPanel() {
  const [conversations, setConversations] = useState<PortalConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCase, setExpandedCase] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operator/communications?limit=200')
      if (!res.ok) throw new Error('Failed to fetch')

      const data = (await res.json()) as {
        messages: InboxMessage[]
      }

      // Group by case, only show conversations that have landlord messages
      const allConversations = groupByCase(data.messages)
      const landlordConversations = allConversations.filter((c) =>
        c.messages.some((m) => m.sender_type === 'landlord')
      )

      setConversations(landlordConversations)
    } catch {
      toast.error('Failed to load landlord conversations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">
            Landlord Portal
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            View all landlord communications and updates across cases.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats */}
      {!loading && conversations.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Active Conversations
            </p>
            <p className="mt-0.5 text-xl font-semibold text-zinc-950">
              {conversations.length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Landlord Messages
            </p>
            <p className="mt-0.5 text-xl font-semibold text-sky-600">
              {conversations.reduce(
                (sum, c) =>
                  sum + c.messages.filter((m) => m.sender_type === 'landlord').length,
                0
              )}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Awaiting Response
            </p>
            <p className="mt-0.5 text-xl font-semibold text-amber-600">
              {conversations.filter((c) => {
                const latest = c.messages[0]
                return latest?.sender_type === 'landlord'
              }).length}
            </p>
          </div>
        </div>
      ) : null}

      {/* Conversation list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded bg-zinc-100" />
                <div className="h-5 w-20 rounded bg-zinc-100" />
              </div>
              <div className="mt-3 h-4 w-2/3 rounded bg-zinc-100" />
              <div className="mt-2 h-3 w-1/3 rounded bg-zinc-50" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <EmptyState
            title="No landlord conversations"
            body="When landlords communicate on their cases, conversations will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => (
            <ConversationCard
              key={conversation.case_id}
              conversation={conversation}
              expanded={expandedCase === conversation.case_id}
              onToggle={() =>
                setExpandedCase(
                  expandedCase === conversation.case_id
                    ? null
                    : conversation.case_id
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
