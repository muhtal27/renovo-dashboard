'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  FileText,
  Home,
  Info,
  Send,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { EmptyState } from '@/app/operator-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'
import type { InboxMessage, PortalConversation } from '@/lib/communication-hub-types'

/* ────────────────────────────────────────────────────────────────── */
/*  Types & helpers                                                   */
/* ────────────────────────────────────────────────────────────────── */

type PortalTab = 'overview' | 'deductions' | 'evidence' | 'messages'

const TABS: { key: PortalTab; label: string }[] = [
  { key: 'overview', label: 'Case Overview' },
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
  const landlordMsgCount = conversation.messages.filter((m) => m.sender_type === 'landlord').length
  const managerMsgCount = conversation.messages.filter((m) => m.sender_type === 'manager').length
  const lastMsg = conversation.messages[0]
  const awaitingResponse = lastMsg?.sender_type === 'landlord'

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
            {awaitingResponse ? 'Awaiting' : 'Reviewed'}
          </p>
        </div>
      </div>

      {/* Property summary */}
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-950">Property Summary</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Property</p>
              <p className="mt-0.5 text-sm text-zinc-900">{conversation.property_address || 'Unknown'}</p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Tenant</p>
              <p className="mt-0.5 text-sm text-zinc-900">{conversation.tenant_name || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Case ID</p>
              <p className="mt-0.5 text-sm text-zinc-900">{conversation.case_id}</p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Messages</p>
              <p className="mt-0.5 text-sm text-zinc-900">{landlordMsgCount} landlord, {managerMsgCount} agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-950">Next Steps</h4>
        <div className="space-y-2">
          {[
            { title: 'Review proposed deductions', desc: 'Check the itemised charges and confirm you agree with the amounts' },
            { title: 'Upload contractor quotes', desc: 'Provide invoices or quotes for any remedial work' },
            { title: 'Approve final claim', desc: 'Once agreed, the deposit will be split accordingly' },
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
        <h4 className="text-sm font-semibold text-zinc-950">Proposed Deductions for Your Approval</h4>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5 mb-4">
        <Info className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="text-xs text-zinc-500">
          Approve each deduction, query it for more detail, or reject items you believe are incorrect.
        </span>
      </div>
      <EmptyState
        title="No deductions available"
        body="When the agent submits proposed deductions, they will appear here for your approval."
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
      <h4 className="mb-4 text-sm font-semibold text-zinc-950">Evidence &amp; Documentation</h4>
      <p className="mb-4 text-sm text-zinc-500">
        Upload contractor quotes, invoices, or any documents that support your claim.
      </p>
      <div className="rounded-xl border-2 border-dashed border-zinc-200 px-6 py-8 text-center text-zinc-400">
        <Upload className="mx-auto h-6 w-6" />
        <p className="mt-2 text-sm">Drag files here or click to browse</p>
        <p className="mt-1 text-[11px]">JPG, PNG, PDF &bull; Max 10MB per file</p>
      </div>
      <div className="mt-4">
        <h4 className="mb-3 text-sm font-semibold text-zinc-950">Uploaded Documents</h4>
        <EmptyState
          title="No documents uploaded yet"
          body="Upload contractor quotes or invoices to support your claim."
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
            const isLandlord = msg.sender_type === 'landlord'
            return (
              <div key={msg.id}>
                <div className={cn('mb-1 flex items-center gap-1.5', isLandlord && 'justify-end')}>
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      isLandlord ? 'text-sky-700' : msg.sender_type === 'tenant' ? 'text-fuchsia-600' : 'text-zinc-700',
                    )}
                  >
                    {isLandlord ? 'Landlord' : formatEnumLabel(msg.sender_type)}
                  </span>
                  <span className="text-[11px] text-zinc-400">{relativeTime(msg.created_at)}</span>
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3 text-[13px] leading-relaxed',
                    isLandlord
                      ? 'ml-auto rounded-br-sm bg-sky-600 text-white'
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
          className="h-9 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder="Type your message..."
        />
        <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main export                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function LandlordPortalPanel() {
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
      const landlordConversations = allConversations.filter((c) =>
        c.messages.some((m) => m.sender_type === 'landlord')
      )
      setConversations(landlordConversations)

      if (landlordConversations.length > 0 && !selectedCaseId) {
        setSelectedCaseId(landlordConversations[0].case_id)
      }
    } catch {
      toast.error('Failed to load landlord conversations.')
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

  const landlordName = 'Landlord'
  const property = selectedConversation?.property_address || 'Unknown property'
  const landlordMsgCount = conversations.reduce(
    (sum, c) => sum + c.messages.filter((m) => m.sender_type === 'landlord').length,
    0
  )
  const awaitingCount = conversations.filter((c) => {
    const latest = c.messages[0]
    return latest?.sender_type === 'landlord'
  }).length

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Gradient banner */}
      <div className="flex items-center gap-3 rounded-xl border px-5 py-4" style={{ background: 'linear-gradient(135deg, var(--color-sky-50), var(--color-indigo-50))', borderColor: '#bae6fd' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
          <Home className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-zinc-900">Landlord Portal</p>
          <p className="text-sm text-zinc-500">
            Simulated view — how the landlord sees their property case
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
              LL
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-zinc-900">{landlordName}</p>
              <p className="text-sm text-zinc-500">{property}</p>
            </div>
            {conversations.length > 1 && (
              <select
                value={selectedCaseId || ''}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value)
                  setActiveTab('overview')
                }}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
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
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Landlord Messages</p>
            <p className="mt-0.5 text-xl font-semibold text-sky-600">{landlordMsgCount}</p>
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
            title="No landlord conversations"
            body="When landlords communicate on their cases, conversations will appear here."
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
