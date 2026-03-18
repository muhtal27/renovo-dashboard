'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOperatorLabel,
  getOperatorProfile,
  getSessionUser,
  type CurrentOperator,
} from '@/lib/operator'
import { supabase } from '@/lib/supabase'

type AIRunRow = {
  id: string
  case_id: string | null
  call_session_id: string | null
  run_type: string
  model_name: string | null
  classification: string | null
  confidence: number | null
  action_taken: string | null
  created_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  summary: string | null
}

type CallSessionRow = {
  id: string
  external_call_id: string | null
  caller_phone: string | null
  status: string | null
  ai_summary: string | null
}

type ContactRow = {
  id: string
  full_name: string | null
  company_name: string | null
}

type UserRow = {
  id: string
  full_name: string
  email: string
  role: string
}

type CaseEventRow = {
  id: string
  case_id: string
  event_type: string
  actor_type: string
  actor_contact_id: string | null
  actor_user_id: string | null
  note: string | null
  created_at: string | null
}

type CaseAssignmentRow = {
  id: string
  case_id: string
  assigned_to: string
  assigned_by: string | null
  assigned_at: string | null
  unassigned_at: string | null
  is_current: boolean
}

type TagRow = {
  id: string
  name: string
}

type CaseTagRow = {
  id: string
  case_id: string
  tag_id: string
}

type ResolvedMessageRow = {
  id: string
  resolved_case_id: string
  resolved_channel: string | null
  resolved_message: string | null
  resolved_sender_type: string | null
  created_at: string | null
}

type MessageRow = {
  id: string
  case_id: string | null
  message_type: string | null
  channel: string | null
  created_at: string | null
}

type MessageAttachmentRow = {
  id: string
  message_id: string
  file_name: string
  file_url: string
  mime_type: string | null
  uploaded_at: string | null
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatLabel(value: string | null) {
  if (!value) return '-'
  return value.replace(/_/g, ' ')
}

function formatConfidence(value: number | null) {
  if (value === null || value === undefined) return 'Unknown confidence'
  return `${Math.round(value * 100)}% confidence`
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || 'Unknown'
}

export default function OperationsRecordsPage() {
  const router = useRouter()
  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [aiRuns, setAiRuns] = useState<AIRunRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [callSessions, setCallSessions] = useState<CallSessionRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [caseEvents, setCaseEvents] = useState<CaseEventRow[]>([])
  const [caseAssignments, setCaseAssignments] = useState<CaseAssignmentRow[]>([])
  const [tags, setTags] = useState<TagRow[]>([])
  const [caseTags, setCaseTags] = useState<CaseTagRow[]>([])
  const [resolvedMessages, setResolvedMessages] = useState<ResolvedMessageRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [attachments, setAttachments] = useState<MessageAttachmentRow[]>([])

  const operatorUserId = operator?.authUser?.id ?? null

  const hydrateOperatorProfile = useEffectEvent(async (userId: string) => {
    try {
      const profile = await getOperatorProfile(userId)
      setOperator((current) => {
        if (!current?.authUser || current.authUser.id !== userId) return current
        return { ...current, profile }
      })
      if (profile?.is_active === false) setError('Your operator profile is inactive. Please contact an administrator.')
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Unable to load operator profile.')
    }
  })

  const loadRecords = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [
      aiRunsResponse,
      casesResponse,
      callSessionsResponse,
      contactsResponse,
      usersResponse,
      caseEventsResponse,
      caseAssignmentsResponse,
      tagsResponse,
      caseTagsResponse,
      resolvedMessagesResponse,
      messagesResponse,
      attachmentsResponse,
    ] = await Promise.all([
      supabase
        .from('ai_runs')
        .select('id, case_id, call_session_id, run_type, model_name, classification, confidence, action_taken, created_at')
        .order('created_at', { ascending: false })
        .limit(800),
      supabase.from('cases').select('id, case_number, summary').order('updated_at', { ascending: false }).limit(800),
      supabase
        .from('call_sessions')
        .select('id, external_call_id, caller_phone, status, ai_summary')
        .order('last_event_at', { ascending: false })
        .limit(800),
      supabase.from('contacts').select('id, full_name, company_name').order('updated_at', { ascending: false }),
      supabase.from('users_profiles').select('id, full_name, email, role').order('updated_at', { ascending: false }),
      supabase
        .from('case_events')
        .select('id, case_id, event_type, actor_type, actor_contact_id, actor_user_id, note, created_at')
        .order('created_at', { ascending: false })
        .limit(800),
      supabase
        .from('case_assignments')
        .select('id, case_id, assigned_to, assigned_by, assigned_at, unassigned_at, is_current')
        .order('assigned_at', { ascending: false })
        .limit(800),
      supabase.from('tags').select('id, name').order('name'),
      supabase.from('case_tags').select('id, case_id, tag_id').limit(2000),
      supabase
        .from('resolved_messages')
        .select('id, resolved_case_id, resolved_channel, resolved_message, resolved_sender_type, created_at')
        .order('created_at', { ascending: false })
        .limit(800),
      supabase
        .from('messages')
        .select('id, case_id, message_type, channel, created_at')
        .order('created_at', { ascending: false })
        .limit(1200),
      supabase
        .from('message_attachments')
        .select('id, message_id, file_name, file_url, mime_type, uploaded_at')
        .order('uploaded_at', { ascending: false })
        .limit(1200),
    ])

    const firstError = [
      aiRunsResponse.error,
      casesResponse.error,
      callSessionsResponse.error,
      contactsResponse.error,
      usersResponse.error,
      caseEventsResponse.error,
      caseAssignmentsResponse.error,
      tagsResponse.error,
      caseTagsResponse.error,
      resolvedMessagesResponse.error,
      messagesResponse.error,
      attachmentsResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setAiRuns((aiRunsResponse.data || []) as AIRunRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setCallSessions((callSessionsResponse.data || []) as CallSessionRow[])
    setContacts((contactsResponse.data || []) as ContactRow[])
    setUsers((usersResponse.data || []) as UserRow[])
    setCaseEvents((caseEventsResponse.data || []) as CaseEventRow[])
    setCaseAssignments((caseAssignmentsResponse.data || []) as CaseAssignmentRow[])
    setTags((tagsResponse.data || []) as TagRow[])
    setCaseTags((caseTagsResponse.data || []) as CaseTagRow[])
    setResolvedMessages((resolvedMessagesResponse.data || []) as ResolvedMessageRow[])
    setMessages((messagesResponse.data || []) as MessageRow[])
    setAttachments((attachmentsResponse.data || []) as MessageAttachmentRow[])
    setLoading(false)
  })

  useEffect(() => {
    let cancelled = false
    async function bootstrapAuth() {
      try {
        const user = await getSessionUser()
        if (cancelled) return
        if (!user) {
          router.replace('/login')
          setAuthLoading(false)
          return
        }
        setOperator({ authUser: user, profile: null })
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : 'Unable to load operator session.')
          setAuthLoading(false)
        }
      }
    }
    bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setOperator(null)
        setAuthLoading(false)
        router.replace('/login')
        return
      }
      try {
        const user = session.user
        if (!cancelled) setOperator({ authUser: user, profile: null })
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) setError(authError instanceof Error ? authError.message : 'Unable to refresh operator session.')
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!operatorUserId) return
    void loadRecords()
  }, [operatorUserId])

  const caseById = useMemo(() => new Map(cases.map((caseItem) => [caseItem.id, caseItem])), [cases])
  const callById = useMemo(() => new Map(callSessions.map((call) => [call.id, call])), [callSessions])
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users])
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags])
  const messageById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages])

  const caseTagNamesByCaseId = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const caseTag of caseTags) {
      const tagName = tagById.get(caseTag.tag_id)?.name
      if (!tagName) continue
      const existing = map.get(caseTag.case_id) ?? []
      existing.push(tagName)
      map.set(caseTag.case_id, existing)
    }
    return map
  }, [caseTags, tagById])

  const topTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const caseTag of caseTags) {
      const tagName = tagById.get(caseTag.tag_id)?.name
      if (!tagName) continue
      counts.set(tagName, (counts.get(tagName) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
  }, [caseTags, tagById])

  const query = search.trim().toLowerCase()

  const filteredAiRuns = useMemo(() => {
    return aiRuns.filter((run) => {
      const linkedCase = run.case_id ? caseById.get(run.case_id) ?? null : null
      const linkedCall = run.call_session_id ? callById.get(run.call_session_id) ?? null : null

      return (
        query === '' ||
        run.run_type.toLowerCase().includes(query) ||
        run.model_name?.toLowerCase().includes(query) ||
        run.classification?.toLowerCase().includes(query) ||
        run.action_taken?.toLowerCase().includes(query) ||
        linkedCase?.case_number?.toLowerCase().includes(query) ||
        linkedCase?.summary?.toLowerCase().includes(query) ||
        linkedCall?.external_call_id?.toLowerCase().includes(query) ||
        linkedCall?.caller_phone?.toLowerCase().includes(query)
      )
    })
  }, [aiRuns, callById, caseById, query])

  const filteredCaseEvents = useMemo(() => {
    return caseEvents.filter((event) => {
      const linkedCase = caseById.get(event.case_id) ?? null
      const actorContact = event.actor_contact_id ? contactById.get(event.actor_contact_id) ?? null : null
      const actorUser = event.actor_user_id ? userById.get(event.actor_user_id) ?? null : null
      const tagNames = linkedCase ? caseTagNamesByCaseId.get(linkedCase.id) ?? [] : []

      return (
        query === '' ||
        event.event_type.toLowerCase().includes(query) ||
        event.actor_type.toLowerCase().includes(query) ||
        event.note?.toLowerCase().includes(query) ||
        linkedCase?.case_number?.toLowerCase().includes(query) ||
        linkedCase?.summary?.toLowerCase().includes(query) ||
        getContactName(actorContact).toLowerCase().includes(query) ||
        actorUser?.full_name.toLowerCase().includes(query) ||
        tagNames.some((tag) => tag.toLowerCase().includes(query))
      )
    })
  }, [caseById, caseEvents, caseTagNamesByCaseId, contactById, query, userById])

  const filteredAssignments = useMemo(() => {
    return caseAssignments.filter((assignment) => {
      const linkedCase = caseById.get(assignment.case_id) ?? null
      const assignedTo = userById.get(assignment.assigned_to) ?? null
      const assignedBy = assignment.assigned_by ? userById.get(assignment.assigned_by) ?? null : null
      return (
        query === '' ||
        linkedCase?.case_number?.toLowerCase().includes(query) ||
        linkedCase?.summary?.toLowerCase().includes(query) ||
        assignedTo?.full_name.toLowerCase().includes(query) ||
        assignedBy?.full_name.toLowerCase().includes(query)
      )
    })
  }, [caseAssignments, caseById, query, userById])

  const filteredResolvedMessages = useMemo(() => {
    return resolvedMessages.filter((message) => {
      const linkedCase = caseById.get(message.resolved_case_id) ?? null
      return (
        query === '' ||
        linkedCase?.case_number?.toLowerCase().includes(query) ||
        message.resolved_channel?.toLowerCase().includes(query) ||
        message.resolved_message?.toLowerCase().includes(query) ||
        message.resolved_sender_type?.toLowerCase().includes(query)
      )
    })
  }, [caseById, query, resolvedMessages])

  const filteredAttachments = useMemo(() => {
    return attachments.filter((attachment) => {
      const linkedMessage = messageById.get(attachment.message_id) ?? null
      const linkedCase = linkedMessage?.case_id ? caseById.get(linkedMessage.case_id) ?? null : null
      return (
        query === '' ||
        attachment.file_name.toLowerCase().includes(query) ||
        attachment.mime_type?.toLowerCase().includes(query) ||
        linkedCase?.case_number?.toLowerCase().includes(query) ||
        linkedMessage?.message_type?.toLowerCase().includes(query) ||
        linkedMessage?.channel?.toLowerCase().includes(query)
      )
    })
  }, [attachments, caseById, messageById, query])

  const kpis = useMemo(
    () => ({
      aiRuns: aiRuns.length,
      caseEvents: caseEvents.length,
      currentAssignments: caseAssignments.filter((assignment) => assignment.is_current).length,
      attachments: attachments.length,
      archive: resolvedMessages.length,
      tags: tags.length,
    }),
    [aiRuns.length, attachments.length, caseAssignments, caseEvents.length, resolvedMessages.length, tags.length]
  )

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">Loading operator session...</div>
        </div>
      </main>
    )
  }

  if (!operator?.authUser) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">Redirecting to sign in...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px]">
        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Back to queue</Link>
                <Link href="/records" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Contact records</Link>
                <Link href="/records/compliance" className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium">Compliance workspace</Link>
              </div>

              <p className="app-kicker mt-6">Operations Workspace</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">See the audit trail behind the operator work</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This brings together AI runs, case history, assignments, tags, attachments, and archived/resolved message data so the team can inspect how the system is behaving, not just what is in the queue.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  ['AI runs', kpis.aiRuns, 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['Case events', kpis.caseEvents, 'border-stone-200 bg-stone-50 text-stone-900'],
                  ['Current assignments', kpis.currentAssignments, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Attachments', kpis.attachments, 'border-violet-200 bg-violet-50 text-violet-900'],
                  ['Archived messages', kpis.archive, 'border-amber-200 bg-amber-50 text-amber-900'],
                  ['Tags', kpis.tags, 'border-rose-200 bg-rose-50 text-rose-900'],
                ].map(([label, value, tone]) => (
                  <article key={String(label)} className={`rounded-[1.6rem] border p-4 shadow-sm ${tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</div>
                    <div className="mt-3 text-3xl font-semibold">{value}</div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="app-surface rounded-[1.8rem] p-5">
              <p className="app-kicker">Operator</p>
              <h2 className="mt-2 text-xl font-semibold">{getOperatorLabel(operator)}</h2>
              <p className="mt-1 text-sm text-stone-600">
                Use this when you need to understand why the system made a decision, who touched a case, or what files and archived text exist behind it.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Practical workflow</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Start with AI runs when you want to review Annabelle confidence and classifications.</li>
                  <li>Use case events and assignments to reconstruct operator history.</li>
                  <li>Check attachments and archived messages when context seems to have disappeared from live timelines.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <label className="block max-w-xl">
            <span className="mb-2 block text-sm font-medium text-stone-700">Search operations history</span>
            <input
              type="text"
              placeholder="Search by case, call, classification, actor, tag, file name, or archive text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="app-field text-sm outline-none"
            />
          </label>
        </section>

        {loading && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">Loading operations workspace...</div>
        )}

        {error && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">Error: {error}</div>
        )}

        {!loading && !error && (
          <div className="mt-6 space-y-6">
            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-col gap-2 border-b app-divider pb-4">
                <p className="app-kicker">Tag signal</p>
                <h2 className="text-2xl font-semibold">Most used case tags</h2>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {topTags.length === 0 && (
                  <div className="app-empty-state rounded-[1.4rem] p-4 text-sm">No case tags are stored yet.</div>
                )}
                {topTags.map(([tagName, count]) => (
                  <span key={tagName} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-700">
                    {tagName} • {count}
                  </span>
                ))}
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex flex-col gap-2 border-b app-divider pb-4">
                <p className="app-kicker">AI runs</p>
                <h2 className="text-2xl font-semibold">Recent model decisions and actions</h2>
              </div>
              <div className="mt-5 space-y-4">
                {filteredAiRuns.length === 0 && (
                  <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No AI runs match the current search.</div>
                )}
                {filteredAiRuns.slice(0, 12).map((run) => {
                  const linkedCase = run.case_id ? caseById.get(run.case_id) ?? null : null
                  const linkedCall = run.call_session_id ? callById.get(run.call_session_id) ?? null : null
                  return (
                    <article key={run.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                            {formatLabel(run.run_type)}
                          </span>
                          <span className="text-sm font-medium text-stone-900">{run.model_name || 'Unknown model'}</span>
                        </div>
                        <span className="text-xs text-stone-500">{formatDateTime(run.created_at)}</span>
                      </div>
                      <p className="mt-3 text-sm text-stone-700">
                        {run.classification || 'No classification'} • {formatConfidence(run.confidence)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-stone-700">{run.action_taken || 'No action text stored.'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                        {linkedCase && <span>{linkedCase.case_number || linkedCase.id}</span>}
                        {linkedCall && <span>{linkedCall.external_call_id || linkedCall.caller_phone || linkedCall.id}</span>}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="app-surface rounded-[2rem] p-5 md:p-6">
                <div className="flex flex-col gap-2 border-b app-divider pb-4">
                  <p className="app-kicker">Case history</p>
                  <h2 className="text-2xl font-semibold">Events and current tags</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {filteredCaseEvents.length === 0 && (
                    <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No case events match the current search.</div>
                  )}
                  {filteredCaseEvents.slice(0, 12).map((event) => {
                    const linkedCase = caseById.get(event.case_id) ?? null
                    const actorContact = event.actor_contact_id ? contactById.get(event.actor_contact_id) ?? null : null
                    const actorUser = event.actor_user_id ? userById.get(event.actor_user_id) ?? null : null
                    const tagNames = linkedCase ? caseTagNamesByCaseId.get(linkedCase.id) ?? [] : []
                    return (
                      <article key={event.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                              {formatLabel(event.event_type)}
                            </span>
                            <span className="text-sm font-medium text-stone-900">{linkedCase?.case_number || event.case_id}</span>
                          </div>
                          <span className="text-xs text-stone-500">{formatDateTime(event.created_at)}</span>
                        </div>
                        <p className="mt-3 text-sm text-stone-700">
                          {event.actor_type} • {actorUser?.full_name || getContactName(actorContact)}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-stone-700">{event.note || 'No note stored on this event.'}</p>
                        {tagNames.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tagNames.map((tagName) => (
                              <span key={`${event.id}-${tagName}`} className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-700">
                                {tagName}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="app-surface rounded-[2rem] p-5 md:p-6">
                <div className="flex flex-col gap-2 border-b app-divider pb-4">
                  <p className="app-kicker">Assignments</p>
                  <h2 className="text-2xl font-semibold">Who owns what and when it changed</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {filteredAssignments.length === 0 && (
                    <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No case assignments match the current search.</div>
                  )}
                  {filteredAssignments.slice(0, 12).map((assignment) => {
                    const linkedCase = caseById.get(assignment.case_id) ?? null
                    const assignedTo = userById.get(assignment.assigned_to) ?? null
                    const assignedBy = assignment.assigned_by ? userById.get(assignment.assigned_by) ?? null : null
                    return (
                      <article key={assignment.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                              assignment.is_current
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-stone-200 bg-stone-50 text-stone-700'
                            }`}>
                              {assignment.is_current ? 'current' : 'historic'}
                            </span>
                            <span className="text-sm font-medium text-stone-900">{linkedCase?.case_number || assignment.case_id}</span>
                          </div>
                          <span className="text-xs text-stone-500">{formatDateTime(assignment.assigned_at)}</span>
                        </div>
                        <p className="mt-3 text-sm text-stone-700">
                          Assigned to {assignedTo?.full_name || assignment.assigned_to}
                        </p>
                        <p className="mt-2 text-sm text-stone-600">
                          {assignedBy ? `Assigned by ${assignedBy.full_name}` : 'Assigned by system or unknown actor'}
                          {assignment.unassigned_at ? ` • Unassigned ${formatDateTime(assignment.unassigned_at)}` : ''}
                        </p>
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="app-surface rounded-[2rem] p-5 md:p-6">
                <div className="flex flex-col gap-2 border-b app-divider pb-4">
                  <p className="app-kicker">Attachments</p>
                  <h2 className="text-2xl font-semibold">Stored files linked to messages</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {filteredAttachments.length === 0 && (
                    <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No attachments match the current search.</div>
                  )}
                  {filteredAttachments.slice(0, 12).map((attachment) => {
                    const linkedMessage = messageById.get(attachment.message_id) ?? null
                    const linkedCase = linkedMessage?.case_id ? caseById.get(linkedMessage.case_id) ?? null : null
                    return (
                      <article key={attachment.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                              {attachment.mime_type || 'file'}
                            </span>
                            <span className="text-sm font-medium text-stone-900">{attachment.file_name}</span>
                          </div>
                          <span className="text-xs text-stone-500">{formatDateTime(attachment.uploaded_at)}</span>
                        </div>
                        <p className="mt-3 text-sm text-stone-700">
                          {linkedCase?.case_number || 'No linked case'} • {linkedMessage?.message_type || 'message'}
                        </p>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800"
                        >
                          Open file
                        </a>
                      </article>
                    )
                  })}
                </div>
              </section>

              <section className="app-surface rounded-[2rem] p-5 md:p-6">
                <div className="flex flex-col gap-2 border-b app-divider pb-4">
                  <p className="app-kicker">Resolved archive</p>
                  <h2 className="text-2xl font-semibold">Archived message snapshots</h2>
                </div>
                <div className="mt-5 space-y-4">
                  {filteredResolvedMessages.length === 0 && (
                    <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No archived/resolved messages match the current search.</div>
                  )}
                  {filteredResolvedMessages.slice(0, 12).map((message) => {
                    const linkedCase = caseById.get(message.resolved_case_id) ?? null
                    return (
                      <article key={message.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                              {message.resolved_channel || 'archive'}
                            </span>
                            <span className="text-sm font-medium text-stone-900">{linkedCase?.case_number || message.resolved_case_id}</span>
                          </div>
                          <span className="text-xs text-stone-500">{formatDateTime(message.created_at)}</span>
                        </div>
                        <p className="mt-3 text-sm text-stone-700">{message.resolved_sender_type || 'unknown sender'}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-700">{message.resolved_message || 'No archived message text stored.'}</p>
                      </article>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
