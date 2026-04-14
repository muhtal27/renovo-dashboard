'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Check,
  Clock,
  FileText,
  Home,
  Info,
  Search,
  Send,
  Upload,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { EmptyState } from '@/app/operator-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'
import type { InboxMessage, PortalConversation } from '@/lib/communication-hub-types'

/* ────────────────────────────────────────────────────────────────── */
/*  Types & helpers                                                   */
/* ────────────────────────────────────────────────────────────────── */

type PortalTab = 'overview' | 'deductions' | 'evidence' | 'messages'

const TABS: { key: PortalTab; label: string }[] = [
  { key: 'overview', label: 'My Case' },
  { key: 'deductions', label: 'Proposed Deductions' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'messages', label: 'Messages' },
]

function groupByCase(messages: InboxMessage[]): PortalConversation[] {
  const groups = new Map<string, InboxMessage[]>()
  for (const msg of messages) {
    const existing = groups.get(msg.case_id)
    if (existing) existing.push(msg)
    else groups.set(msg.case_id, [msg])
  }

  return Array.from(groups.entries())
    .map(([caseId, msgs]) => {
      const sorted = msgs.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/* ────────────────────────────────────────────────────────────────── */
/*  Overview tab                                                      */
/* ────────────────────────────────────────────────────────────────── */

function OverviewTab({ conversation }: { conversation: PortalConversation }) {
  const tenantMsgCount = conversation.messages.filter((m) => m.sender_type === 'tenant').length
  const managerMsgCount = conversation.messages.filter((m) => m.sender_type === 'manager').length
  const lastMsg = conversation.messages[0]
  const awaitingResponse = lastMsg?.sender_type === 'tenant'

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Case Status</p>
          <div className="mt-1.5">
            {conversation.case_status ? (
              <StatusBadge label={formatEnumLabel(conversation.case_status)} tone={conversation.case_status} />
            ) : (
              <span className="text-sm font-medium text-zinc-900">Active</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Total Messages</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-950">{conversation.messages.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Status</p>
          <p className={cn('mt-0.5 text-xl font-semibold', awaitingResponse ? 'text-amber-600' : 'text-emerald-600')}>
            {awaitingResponse ? 'Awaiting' : 'Responded'}
          </p>
        </div>
      </div>

      {/* Case timeline */}
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-950">Case Timeline</h4>
        <div className="space-y-4">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Home className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm text-zinc-900">Case opened</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {conversation.messages.length > 0
                  ? formatDateTime(conversation.messages[conversation.messages.length - 1].created_at)
                  : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
              <Search className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm text-zinc-900">Checkout inspection completed</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">Property inspected and documented</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm text-zinc-900">Proposed deductions sent</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">Review the deductions and respond within 14 days</p>
            </div>
          </div>
          {tenantMsgCount > 0 ? (
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm text-emerald-700">{tenantMsgCount} messages sent</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">{managerMsgCount} responses received</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm text-zinc-500">Awaiting your response</p>
                <p className="mt-0.5 text-[11px] text-zinc-400">You have 14 days to respond</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rights */}
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-950">Your Rights</h4>
        <div className="space-y-2">
          {[
            { title: 'Review proposed deductions', desc: 'You can view itemised deductions and supporting evidence' },
            { title: 'Upload your own evidence', desc: 'Submit move-in photos or documents that support your case' },
            { title: 'Dispute individual charges', desc: 'Challenge any item you disagree with — provide your reasoning' },
            { title: 'Request formal adjudication', desc: 'If no agreement is reached, the deposit scheme will decide' },
          ].map((item) => (
            <div key={item.title} className="rounded-lg bg-zinc-50 px-3 py-2.5">
              <p className="text-sm font-medium text-zinc-900">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Deductions tab (placeholder)                                      */
/* ────────────────────────────────────────────────────────────────── */

function DeductionsTab() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-zinc-950">Proposed Deductions</h4>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5 mb-4">
        <Info className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="text-xs text-zinc-500">
          Respond to each item individually: accept the charge, dispute it with a reason, or counter-offer a different amount.
        </span>
      </div>
      <EmptyState
        title="No deductions available"
        body="When the agent submits proposed deductions, they will appear here for review."
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Evidence tab (placeholder)                                        */
/* ────────────────────────────────────────────────────────────────── */

function EvidenceTab() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <h4 className="mb-4 text-sm font-semibold text-zinc-950">Upload Your Evidence</h4>
      <p className="mb-4 text-sm text-zinc-500">
        Submit photos from your move-in day, receipts, or any documents that support your case.
      </p>
      <div className="rounded-xl border-2 border-dashed border-zinc-200 px-6 py-8 text-center text-zinc-400">
        <Upload className="mx-auto h-6 w-6" />
        <p className="mt-2 text-sm">Drag files here or click to browse</p>
        <p className="mt-1 text-[11px]">JPG, PNG, PDF &bull; Max 10MB per file</p>
      </div>
      <div className="mt-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-950">Your Uploaded Files</h4>
        <EmptyState
          title="No files uploaded yet"
          body="Upload move-in photos to support your case."
        />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Messages tab (chat thread)                                        */
/* ────────────────────────────────────────────────────────────────── */

function MessagesTab({ conversation }: { conversation: PortalConversation }) {
  const sorted = [...conversation.messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="rounded-xl border border-zinc-200 bg-white" style={{ overflow: 'hidden' }}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-zinc-950">Messages</h4>
        <span className="text-[11px] text-zinc-400">Your conversation with the agent</span>
      </div>

      <div className="space-y-4 px-4 py-4" style={{ maxHeight: 400, overflowY: 'auto' }}>
        {sorted.length === 0 ? (
          <EmptyState title="No messages yet" body="Start a conversation about this case." />
        ) : (
          sorted.map((msg) => {
            const isTenant = msg.sender_type === 'tenant'
            return (
              <div key={msg.id}>
                <div className={cn('mb-1 flex items-center gap-1.5', isTenant && 'justify-end')}>
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      isTenant ? 'text-emerald-700' : msg.sender_type === 'landlord' ? 'text-sky-700' : 'text-zinc-700',
                    )}
                  >
                    {msg.tenant_name && isTenant ? msg.tenant_name : formatEnumLabel(msg.sender_type)}
                  </span>
                  <span className="text-[11px] text-zinc-400">{relativeTime(msg.created_at)}</span>
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-relaxed',
                    isTenant
                      ? 'ml-auto rounded-br-sm bg-emerald-600 text-white'
                      : 'rounded-bl-sm border border-zinc-200 bg-zinc-50 text-zinc-900',
                  )}
                >
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="flex gap-2 border-t border-zinc-100 px-4 py-3">
        <input
          type="text"
          className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          placeholder="Type your message..."
        />
        <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main export                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function TenantPortalPanel() {
  const [conversations, setConversations] = useState<PortalConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operator/communications?limit=200')
      if (!res.ok) throw new Error('Failed to fetch')

      const data = (await res.json()) as { messages: InboxMessage[] }
      const allConversations = groupByCase(data.messages)
      const tenantConversations = allConversations.filter((c) =>
        c.messages.some((m) => m.sender_type === 'tenant')
      )
      setConversations(tenantConversations)

      // Auto-select first case
      if (tenantConversations.length > 0 && !selectedCaseId) {
        setSelectedCaseId(tenantConversations[0].case_id)
      }
    } catch {
      toast.error('Failed to load tenant conversations.')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedConversation = selectedCaseId
    ? conversations.find((c) => c.case_id === selectedCaseId) ?? null
    : conversations[0] ?? null

  const tenantName = selectedConversation?.tenant_name || 'Tenant'
  const property = selectedConversation?.property_address || 'Unknown property'
  const tenantMsgCount = conversations.reduce(
    (sum, c) => sum + c.messages.filter((m) => m.sender_type === 'tenant').length,
    0
  )
  const awaitingCount = conversations.filter((c) => {
    const latest = c.messages[0]
    return latest?.sender_type === 'tenant'
  }).length

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Gradient banner */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 px-5 py-4" style={{ background: 'linear-gradient(135deg, var(--color-emerald-50), var(--color-sky-50))' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <User className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-zinc-900">Tenant Portal</p>
          <p className="text-sm text-zinc-500">
            Simulated view — how {tenantName} sees their deposit case
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-white/60 px-2 py-1 text-[10px] font-medium text-zinc-500">
          <Info className="h-2.5 w-2.5" />
          Demo Preview
        </span>
      </div>

      {/* Profile card + sub-tabs */}
      {selectedConversation && (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-base font-semibold text-sky-700">
              {getInitials(tenantName)}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-zinc-900">{tenantName}</p>
              <p className="text-sm text-zinc-500">{property}</p>
            </div>
            {conversations.length > 1 && (
              <select
                value={selectedCaseId || ''}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value)
                  setActiveTab('overview')
                }}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              >
                {conversations.map((c) => (
                  <option key={c.case_id} value={c.case_id}>
                    {c.property_address || c.case_id}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-0 overflow-x-auto border-b border-zinc-200">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-4 py-2 text-[13px] font-medium transition',
                  activeTab === tab.key
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!loading && conversations.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Active Conversations</p>
            <p className="mt-0.5 text-xl font-semibold text-zinc-950">{conversations.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Tenant Messages</p>
            <p className="mt-0.5 text-xl font-semibold text-fuchsia-600">{tenantMsgCount}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Awaiting Response</p>
            <p className="mt-0.5 text-xl font-semibold text-amber-600">{awaitingCount}</p>
          </div>
        </div>
      )}

      {/* Tab content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-xl border border-zinc-200 bg-white px-5 py-4">
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
            title="No tenant conversations"
            body="When tenants send messages on their cases, conversations will appear here."
          />
        </div>
      ) : selectedConversation ? (
        <>
          {activeTab === 'overview' && <OverviewTab conversation={selectedConversation} />}
          {activeTab === 'deductions' && <DeductionsTab />}
          {activeTab === 'evidence' && <EvidenceTab />}
          {activeTab === 'messages' && <MessagesTab conversation={selectedConversation} />}
        </>
      ) : null}
    </div>
  )
}
