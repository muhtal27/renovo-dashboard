'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  MessageCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { EmptyState } from '@/app/operator-ui'
import { relativeTime } from '@/lib/relative-time'
import { cn } from '@/lib/ui'
import type {
  InboxMessage,
  PortalConversation,
  ComposeMessageInput,
  CommunicationTemplate,
} from '@/lib/communication-hub-types'
import { TEMPLATE_CATEGORIES } from '@/lib/communication-hub-types'

/* ────────────────────────────────────────────────────────────────── */
/*  Helpers                                                           */
/* ────────────────────────────────────────────────────────────────── */

type ConversationFilter = 'all' | 'tenant' | 'landlord' | 'awaiting'

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
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      const last = sorted[sorted.length - 1]
      const awaitingReply = last.sender_type !== 'manager'

      return {
        case_id: caseId,
        property_address: last.property_address,
        tenant_name: last.tenant_name,
        landlord_name: null,
        case_status: last.case_status,
        messages: sorted,
        last_message_at: last.created_at,
        unread_count: awaitingReply ? 1 : 0,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.last_message_at ?? 0).getTime() -
        new Date(a.last_message_at ?? 0).getTime()
    )
}

function getParticipantTypes(conv: PortalConversation) {
  const types = new Set(conv.messages.map((m) => m.sender_type))
  return types
}

type CommsStats = {
  totalConversations: number
  awaitingReply: number
  tenantThreads: number
  landlordThreads: number
  totalMessages: number
}

function computeStats(conversations: PortalConversation[]): CommsStats {
  let awaitingReply = 0
  let tenantThreads = 0
  let landlordThreads = 0
  let totalMessages = 0

  for (const conv of conversations) {
    totalMessages += conv.messages.length
    const participants = getParticipantTypes(conv)
    if (participants.has('tenant')) tenantThreads++
    if (participants.has('landlord')) landlordThreads++
    const lastMsg = conv.messages[conv.messages.length - 1]
    if (lastMsg && lastMsg.sender_type !== 'manager') awaitingReply++
  }

  return {
    totalConversations: conversations.length,
    awaitingReply,
    tenantThreads,
    landlordThreads,
    totalMessages,
  }
}

/* ────────────────────────────────────────────────────────────────── */
/*  Case selector for compose                                         */
/* ────────────────────────────────────────────────────────────────── */

type CaseOption = {
  id: string
  property_address: string
  tenant_name: string
}

/* ────────────────────────────────────────────────────────────────── */
/*  Stats bar                                                         */
/* ────────────────────────────────────────────────────────────────── */

function StatsBar({ stats }: { stats: CommsStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Conversations" value={stats.totalConversations} icon={<MessageSquare className="h-4 w-4" />} />
      <StatCard label="Awaiting Reply" value={stats.awaitingReply} icon={<Clock className="h-4 w-4" />} tone={stats.awaitingReply > 0 ? 'warning' : 'default'} />
      <StatCard label="Tenant Threads" value={stats.tenantThreads} icon={<Users className="h-4 w-4" />} tone="tenant" />
      <StatCard label="Landlord Threads" value={stats.landlordThreads} icon={<Users className="h-4 w-4" />} tone="landlord" />
      <StatCard label="Total Messages" value={stats.totalMessages} icon={<MessageCircle className="h-4 w-4" />} className="hidden sm:flex" />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone = 'default',
  className,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone?: 'default' | 'warning' | 'tenant' | 'landlord'
  className?: string
}) {
  const iconColor =
    tone === 'warning' ? 'text-amber-600'
    : tone === 'tenant' ? 'text-fuchsia-600'
    : tone === 'landlord' ? 'text-sky-600'
    : 'text-zinc-500'

  const valueColor =
    tone === 'warning' ? 'text-amber-700'
    : tone === 'tenant' ? 'text-fuchsia-700'
    : tone === 'landlord' ? 'text-sky-700'
    : 'text-zinc-950'

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm backdrop-blur-sm', className)}>
      <span className={iconColor}>{icon}</span>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">{label}</p>
        <p className={cn('text-xl font-bold tabular-nums', valueColor)}>{value}</p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Conversation list                                                 */
/* ────────────────────────────────────────────────────────────────── */

function ConversationList({
  conversations,
  selectedCaseId,
  onSelect,
}: {
  conversations: PortalConversation[]
  selectedCaseId: string | null
  onSelect: (caseId: string) => void
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations"
        body="Messages will appear here as cases generate communications."
      />
    )
  }

  return (
    <div className="divide-y divide-zinc-100/80">
      {conversations.map((conv) => {
        const participants = getParticipantTypes(conv)
        const lastMsg = conv.messages[conv.messages.length - 1]
        const isAwaiting = lastMsg && lastMsg.sender_type !== 'manager'
        const isSelected = conv.case_id === selectedCaseId

        return (
          <button
            key={conv.case_id}
            type="button"
            onClick={() => onSelect(conv.case_id)}
            className={cn(
              'modern-table-row flex w-full items-start gap-3 px-4 py-3.5 text-left transition',
              isSelected && 'bg-emerald-50/50',
              isAwaiting && !isSelected && 'border-l-2 border-l-amber-400',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {participants.has('tenant') && (
                  <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400" title="Tenant" />
                )}
                {participants.has('landlord') && (
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400" title="Landlord" />
                )}
                {participants.has('manager') && (
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" title="Manager" />
                )}
                <span className="ml-1 text-[10px] text-zinc-400">
                  {conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}
                </span>
                {isAwaiting && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                    Awaiting
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm font-medium text-zinc-950">
                {conv.property_address || 'Unknown property'}
              </p>
              {conv.tenant_name && (
                <p className="mt-0.5 truncate text-xs text-zinc-400">{conv.tenant_name}</p>
              )}
              {lastMsg && (
                <p className="mt-1 truncate text-xs text-zinc-500">
                  <span className="font-medium">{formatEnumLabel(lastMsg.sender_type)}:</span>{' '}
                  {lastMsg.content.slice(0, 80)}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[10px] text-zinc-400">
                {relativeTime(conv.last_message_at)}
              </span>
              {conv.case_status && (
                <div className="mt-1">
                  <StatusBadge
                    label={formatEnumLabel(conv.case_status)}
                    tone={conv.case_status}
                    className="text-[9px]"
                  />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Conversation thread                                               */
/* ────────────────────────────────────────────────────────────────── */

function ConversationThread({
  conversation,
  onReply,
  replySending,
  onBack,
  templates,
}: {
  conversation: PortalConversation
  onReply: (recipientType: 'tenant' | 'landlord', content: string) => void
  replySending: boolean
  onBack: () => void
  templates: CommunicationTemplate[]
}) {
  const [replyContent, setReplyContent] = useState('')
  const [replyRecipient, setReplyRecipient] = useState<'tenant' | 'landlord'>('tenant')
  const [showTemplates, setShowTemplates] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [conversation.case_id, conversation.messages.length])

  // Determine default recipient based on conversation participants
  useEffect(() => {
    const hasTenant = conversation.messages.some((m) => m.sender_type === 'tenant')
    const hasLandlord = conversation.messages.some((m) => m.sender_type === 'landlord')
    const lastMsg = conversation.messages[conversation.messages.length - 1]
    if (lastMsg?.sender_type === 'tenant') setReplyRecipient('tenant')
    else if (lastMsg?.sender_type === 'landlord') setReplyRecipient('landlord')
    else if (hasTenant) setReplyRecipient('tenant')
    else if (hasLandlord) setReplyRecipient('landlord')
  }, [conversation.case_id, conversation.messages])

  function handleSend() {
    if (!replyContent.trim()) return
    onReply(replyRecipient, replyContent.trim())
    setReplyContent('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  function insertTemplate(template: CommunicationTemplate) {
    setReplyContent((prev) => (prev ? prev + '\n\n' : '') + template.body)
    setShowTemplates(false)
    toast.success(`Template "${template.name}" inserted`)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Case header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-950">
              {conversation.property_address || 'Unknown property'}
            </p>
            <div className="mt-0.5 flex items-center gap-2">
              {conversation.tenant_name && (
                <span className="text-xs text-zinc-500">{conversation.tenant_name}</span>
              )}
              {conversation.case_status && (
                <StatusBadge
                  label={formatEnumLabel(conversation.case_status)}
                  tone={conversation.case_status}
                  className="text-[9px]"
                />
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/operator/cases/${conversation.case_id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Open Case
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          {conversation.messages.map((msg) => {
            const isManager = msg.sender_type === 'manager'
            return (
              <div
                key={msg.id}
                className={cn('flex', isManager ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3',
                    isManager
                      ? 'rounded-br-md bg-emerald-600 text-white'
                      : msg.sender_type === 'tenant'
                        ? 'rounded-bl-md bg-fuchsia-50 text-zinc-900 ring-1 ring-fuchsia-100'
                        : 'rounded-bl-md bg-sky-50 text-zinc-900 ring-1 ring-sky-100',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider',
                        isManager ? 'text-emerald-200' : msg.sender_type === 'tenant' ? 'text-fuchsia-500' : 'text-sky-500',
                      )}
                    >
                      {formatEnumLabel(msg.sender_type)}
                    </span>
                    <span className={cn('text-[10px]', isManager ? 'text-emerald-300' : 'text-zinc-400')}>
                      {formatDateTime(msg.created_at)}
                    </span>
                  </div>
                  <p className={cn('mt-1.5 whitespace-pre-wrap text-sm leading-6 [overflow-wrap:anywhere]', isManager && 'text-white/95')}>
                    {msg.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Template picker overlay */}
      {showTemplates && (
        <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Insert Template
            </p>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="flex h-6 w-6 items-center justify-center text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {templates.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-400">
              No templates yet. Create one in the Templates tab.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {templates.filter((t) => t.is_active).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => insertTemplate(template)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <FileText className="h-3 w-3 shrink-0 text-zinc-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-900">{template.name}</p>
                    <p className="truncate text-[10px] text-zinc-400">
                      {template.body.slice(0, 50)}...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply form */}
      <div className="border-t border-zinc-200 bg-white px-5 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Reply to:</span>
          <button
            type="button"
            onClick={() => setReplyRecipient('tenant')}
            className={cn(
              'inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium transition',
              replyRecipient === 'tenant'
                ? 'bg-fuchsia-100 text-fuchsia-700'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            Tenant
          </button>
          <button
            type="button"
            onClick={() => setReplyRecipient('landlord')}
            className={cn(
              'inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium transition',
              replyRecipient === 'landlord'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            Landlord
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition',
              showTemplates
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200',
            )}
          >
            <FileText className="h-3 w-3" />
            Template
          </button>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${replyRecipient}...`}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={replySending || !replyContent.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className={cn('h-4 w-4', replySending && 'animate-pulse')} />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-zinc-400">
          Press <kbd className="rounded border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-[9px]">Ctrl+Enter</kbd> to send
        </p>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Compose new conversation                                          */
/* ────────────────────────────────────────────────────────────────── */

function ComposeOverlay({
  onClose,
  onSent,
  templates,
}: {
  onClose: () => void
  onSent: () => void
  templates: CommunicationTemplate[]
}) {
  const [cases, setCases] = useState<CaseOption[]>([])
  const [casesLoading, setCasesLoading] = useState(true)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [caseSearch, setCaseSearch] = useState('')
  const [recipientType, setRecipientType] = useState<'tenant' | 'landlord'>('tenant')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  // Fetch cases for the selector
  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch('/api/eot/cases')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = (await res.json()) as { items: Array<{ id: string; property: { address_line_1: string | null; city: string | null; postcode: string | null; name: string }; tenant_name: string }> }
        setCases(
          data.items.map((c) => ({
            id: c.id,
            property_address: [c.property.address_line_1, c.property.city, c.property.postcode].filter(Boolean).join(', ') || c.property.name,
            tenant_name: c.tenant_name,
          }))
        )
      } catch {
        toast.error('Failed to load cases.')
      } finally {
        setCasesLoading(false)
      }
    }
    fetchCases()
  }, [])

  const filteredCases = caseSearch.trim()
    ? cases.filter(
        (c) =>
          c.property_address.toLowerCase().includes(caseSearch.toLowerCase()) ||
          c.tenant_name.toLowerCase().includes(caseSearch.toLowerCase())
      )
    : cases

  const selectedCase = cases.find((c) => c.id === selectedCaseId)

  async function handleSend() {
    if (!selectedCaseId || !content.trim()) {
      toast.error('Please select a case and enter a message.')
      return
    }

    setSending(true)
    try {
      const payload: ComposeMessageInput = {
        case_id: selectedCaseId,
        recipient_type: recipientType,
        subject: subject.trim() || undefined,
        content: content.trim(),
      }
      const res = await fetch('/api/operator/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send')
      }
      toast.success('Message sent successfully.')
      onSent()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/50 backdrop-blur-sm pt-20">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/80">
              <Plus className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950">New Conversation</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Case selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
              Select Case
            </label>
            {selectedCase ? (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{selectedCase.property_address}</p>
                  <p className="text-xs text-zinc-500">{selectedCase.tenant_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCaseId('')}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    placeholder="Search by property or tenant..."
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
                  {casesLoading ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-400">Loading cases...</p>
                  ) : filteredCases.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-zinc-400">No cases found</p>
                  ) : (
                    filteredCases.slice(0, 10).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCaseId(c.id)
                          setCaseSearch('')
                        }}
                        className="flex w-full items-center gap-3 border-b border-zinc-100/80 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-zinc-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">{c.property_address}</p>
                          <p className="truncate text-xs text-zinc-400">{c.tenant_name}</p>
                        </div>
                        <ChevronDown className="h-3 w-3 -rotate-90 text-zinc-300" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recipient + subject */}
          <div className="flex gap-3">
            <div className="w-40">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Recipient
              </label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as 'tenant' | 'landlord')}
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Optional subject line"
                className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* Template picker */}
          {showTemplates && templates.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Choose Template</p>
                <button type="button" onClick={() => setShowTemplates(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {templates.filter((t) => t.is_active).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setContent((prev) => (prev ? prev + '\n\n' : '') + t.body)
                      setShowTemplates(false)
                      toast.success(`Template "${t.name}" inserted`)
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left transition hover:border-emerald-300"
                  >
                    <p className="text-xs font-medium text-zinc-900">{t.name}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-400">{t.body.slice(0, 60)}...</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message body */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Message
              </label>
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] font-medium transition',
                  showTemplates ? 'text-emerald-600' : 'text-zinc-400 hover:text-zinc-600',
                )}
              >
                <FileText className="h-3 w-3" />
                Use Template
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={6}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-zinc-100/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !selectedCaseId || !content.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Filter config                                                     */
/* ────────────────────────────────────────────────────────────────── */

const FILTERS: { value: ConversationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting', label: 'Awaiting Reply' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
]

/* ────────────────────────────────────────────────────────────────── */
/*  Main export                                                       */
/* ────────────────────────────────────────────────────────────────── */

export function ConversationsPanel() {
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)
  const [replySending, setReplySending] = useState(false)
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operator/communications?limit=200')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = (await res.json()) as { messages: InboxMessage[]; total: number }
      setMessages(data.messages)
    } catch {
      toast.error('Failed to load conversations.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/operator/communications/templates')
      if (!res.ok) return
      const data = (await res.json()) as { templates: CommunicationTemplate[] }
      setTemplates(data.templates)
    } catch {
      // Templates are optional, don't show error
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetchTemplates()
  }, [fetchMessages, fetchTemplates])

  const conversations = useMemo(() => groupByCase(messages), [messages])

  const filteredConversations = useMemo(() => {
    let filtered = conversations

    if (filter === 'awaiting') {
      filtered = filtered.filter((c) => {
        const lastMsg = c.messages[c.messages.length - 1]
        return lastMsg && lastMsg.sender_type !== 'manager'
      })
    } else if (filter === 'tenant') {
      filtered = filtered.filter((c) =>
        c.messages.some((m) => m.sender_type === 'tenant')
      )
    } else if (filter === 'landlord') {
      filtered = filtered.filter((c) =>
        c.messages.some((m) => m.sender_type === 'landlord')
      )
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.property_address?.toLowerCase().includes(q) ||
          c.tenant_name?.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [conversations, filter, search])

  const stats = useMemo(() => computeStats(conversations), [conversations])

  const selectedConversation = selectedCaseId
    ? conversations.find((c) => c.case_id === selectedCaseId) ?? null
    : null

  async function handleReply(recipientType: 'tenant' | 'landlord', content: string) {
    if (!selectedCaseId) return
    setReplySending(true)
    try {
      const payload: ComposeMessageInput = {
        case_id: selectedCaseId,
        recipient_type: recipientType,
        content,
      }
      const res = await fetch('/api/operator/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error || 'Failed to send')
      }
      toast.success('Reply sent')
      await fetchMessages()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply.')
    } finally {
      setReplySending(false)
    }
  }

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Stats */}
      {!loading && conversations.length > 0 && <StatsBar stats={stats} />}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setFilter(f.value)
                setSelectedCaseId(null)
              }}
              className={cn(
                'inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium transition',
                filter === f.value
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
              )}
            >
              {f.label}
              {f.value === 'awaiting' && stats.awaitingReply > 0 && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
                  {stats.awaitingReply}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 w-56 rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-3 w-3" />
            New Message
          </button>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="space-y-0 rounded-xl border border-zinc-200 bg-white shadow-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-shimmer border-b border-zinc-100/80 px-4 py-4 last:border-b-0">
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-zinc-100" />
                    <div className="h-2 w-2 rounded-full bg-zinc-100" />
                    <div className="h-3 w-12 rounded bg-zinc-100" />
                  </div>
                  <div className="mt-2 h-4 w-3/4 rounded bg-zinc-100" />
                  <div className="mt-1.5 h-3 w-1/2 rounded bg-zinc-50" />
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="skeleton-shimmer h-96 rounded-xl border border-zinc-200" />
          </div>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title={search ? 'No conversations match your search' : 'No conversations yet'}
            body={
              search
                ? 'Try adjusting your search term or filter.'
                : 'Messages from tenants, landlords, and your team will appear here as conversations.'
            }
            action={
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Start a conversation
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Conversation list */}
          <div
            className={cn(
              'overflow-hidden rounded-xl border border-zinc-200 bg-white lg:col-span-2',
              // On mobile, hide list when a conversation is selected
              selectedConversation && 'hidden lg:block',
            )}
          >
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              <ConversationList
                conversations={filteredConversations}
                selectedCaseId={selectedCaseId}
                onSelect={setSelectedCaseId}
              />
            </div>
          </div>

          {/* Thread pane */}
          <div
            className={cn(
              'overflow-hidden rounded-xl border border-zinc-200 bg-white lg:col-span-3',
              // On mobile, hide thread when no conversation selected
              !selectedConversation && 'hidden lg:block',
            )}
          >
            {selectedConversation ? (
              <div className="flex h-[calc(100vh-320px)] flex-col">
                <ConversationThread
                  conversation={selectedConversation}
                  onReply={handleReply}
                  replySending={replySending}
                  onBack={() => setSelectedCaseId(null)}
                  templates={templates}
                />
              </div>
            ) : (
              <div className="flex h-[calc(100vh-320px)] items-center justify-center">
                <EmptyState
                  icon={<MessageCircle className="h-8 w-8" />}
                  title="Select a conversation"
                  body="Click a conversation on the left to view the full thread and reply."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compose overlay */}
      {composing && (
        <ComposeOverlay
          onClose={() => setComposing(false)}
          onSent={fetchMessages}
          templates={templates}
        />
      )}
    </div>
  )
}
