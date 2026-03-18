'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser } from '@/lib/operator'
import { getPortalProfile, getPortalRoute, type PortalProfile } from '@/lib/portal'
import { supabase } from '@/lib/supabase'

type ContactRow = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
}

type TenancyRow = {
  id: string
  property_id: string | null
  landlord_contact_id: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
  rent_amount: number | null
  deposit_amount: number | null
  deposit_scheme_name: string | null
  deposit_reference: string | null
  updated_at: string | null
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
  country: string | null
  property_type: string | null
  bedroom_count: number | null
  bathroom_count: number | null
}

type CaseRow = {
  id: string
  case_number: string | null
  case_type: string | null
  priority: string | null
  status: string | null
  summary: string | null
  created_at: string | null
  updated_at: string | null
  last_activity_at: string | null
  next_action_at: string | null
  waiting_on: string | null
  waiting_reason: string | null
}

type MessageRow = {
  id: string
  case_id: string | null
  channel: string | null
  sender_type: string | null
  message_text: string | null
  created_at: string | null
  direction: string | null
  message_type: string | null
}

type MaintenanceRow = {
  id: number
  case_id: string | null
  property_id: string | null
  issue_type: string | null
  description: string | null
  priority: string | null
  status: string | null
  scheduled_for: string | null
  completed_at: string | null
  updated_at: string | null
  access_notes: string | null
}

type FeedItem = {
  id: string
  timestamp: string | null
  label: string
  title: string
  body: string
  href: string | null
  tone: string
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'No recent update'

  const now = Date.now()
  const target = new Date(value).getTime()
  const diff = target - now
  const absMinutes = Math.round(Math.abs(diff) / 60000)

  if (absMinutes < 1) return 'Just now'
  if (absMinutes < 60) return `${absMinutes}m ${diff < 0 ? 'ago' : 'from now'}`

  const absHours = Math.round(absMinutes / 60)
  if (absHours < 24) return `${absHours}h ${diff < 0 ? 'ago' : 'from now'}`

  const absDays = Math.round(absHours / 24)
  return `${absDays}d ${diff < 0 ? 'ago' : 'from now'}`
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

function propertyLabel(property: PropertyRow | null) {
  if (!property) return 'No property linked yet'
  return [property.address_line_1, property.city, property.postcode].filter(Boolean).join(', ')
}

export default function TenantPortalPage() {
  const router = useRouter()

  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('Live updates connected')
  const [portalProfile, setPortalProfile] = useState<PortalProfile | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRow[]>([])
  const [actionCaseId, setActionCaseId] = useState('')
  const [updateDraft, setUpdateDraft] = useState('')
  const [actionLoading, setActionLoading] = useState<'update' | 'still_waiting' | 'issue_resolved' | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const liveMessageTimer = useRef<number | null>(null)

  const activeTenancy = useMemo(
    () => tenancies.find((item) => item.status === 'active') || tenancies[0] || null,
    [tenancies]
  )

  const activeProperty = useMemo(
    () => properties.find((item) => item.id === activeTenancy?.property_id) || properties[0] || null,
    [activeTenancy?.property_id, properties]
  )

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (item) =>
          item.channel !== 'internal' &&
          item.direction !== 'internal' &&
          item.message_type !== 'note' &&
          item.message_type !== 'system'
      ),
    [messages]
  )

  const openCases = useMemo(
    () => cases.filter((item) => !['resolved', 'closed', 'cancelled'].includes(item.status || '')),
    [cases]
  )

  const selectedActionCaseId =
    actionCaseId && openCases.some((item) => item.id === actionCaseId)
      ? actionCaseId
      : openCases[0]?.id || ''

  const actionCase = useMemo(
    () => openCases.find((item) => item.id === selectedActionCaseId) || openCases[0] || null,
    [openCases, selectedActionCaseId]
  )

  const liveFeed = useMemo<FeedItem[]>(() => {
    const caseItems = openCases.map((item) => ({
      id: `case-${item.id}`,
      timestamp: item.last_activity_at || item.updated_at || item.created_at,
      label: 'Case update',
      title: item.case_number || 'Case',
      body:
        item.next_action_at
          ? `Next step ${formatRelativeTime(item.next_action_at)}${item.waiting_reason ? ` • ${item.waiting_reason}` : ''}`
          : item.summary || 'Your case is still being reviewed.',
      href: item.id ? `/cases/${item.id}` : null,
      tone: 'border-stone-200 bg-white',
    }))

    const messageItems = visibleMessages.map((item) => ({
      id: `message-${item.id}`,
      timestamp: item.created_at,
      label: item.direction === 'outbound' ? 'Team message' : 'Your message',
      title: item.case_id ? `Case ${cases.find((entry) => entry.id === item.case_id)?.case_number || ''}`.trim() : 'Message',
      body: item.message_text || 'No message text',
      href: item.case_id ? `/cases/${item.case_id}` : null,
      tone: item.direction === 'outbound' ? 'border-emerald-200 bg-emerald-50/80' : 'border-sky-200 bg-sky-50/80',
    }))

    const maintenanceItems = maintenance.map((item) => ({
      id: `maintenance-${item.id}`,
      timestamp: item.updated_at || item.scheduled_for || item.completed_at,
      label: 'Maintenance',
      title: item.issue_type || 'Property issue',
      body:
        item.status === 'scheduled' && item.scheduled_for
          ? `Scheduled for ${formatDate(item.scheduled_for)}`
          : item.status === 'completed'
            ? `Completed ${formatRelativeTime(item.completed_at || item.updated_at)}`
            : item.description || item.status || 'Maintenance update',
      href: item.case_id ? `/cases/${item.case_id}` : null,
      tone: 'border-amber-200 bg-amber-50/80',
    }))

    return [...messageItems, ...maintenanceItems, ...caseItems]
      .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime())
      .slice(0, 12)
  }, [cases, maintenance, openCases, visibleMessages])

  const showLiveMessage = useCallback((message: string) => {
    setLiveMessage(message)
    if (liveMessageTimer.current) {
      window.clearTimeout(liveMessageTimer.current)
    }
    liveMessageTimer.current = window.setTimeout(() => {
      setLiveMessage('Live updates connected')
    }, 2400)
  }, [])

  const loadPortalData = useCallback(async (contactId: string) => {
    setError(null)

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, full_name, phone, email')
      .eq('id', contactId)
      .maybeSingle()

    if (contactError) {
      setError(contactError.message)
      setLoading(false)
      return
    }

    const { data: tenancyData, error: tenancyError } = await supabase
      .from('tenancies')
      .select(
        'id, property_id, landlord_contact_id, status, start_date, end_date, rent_amount, deposit_amount, deposit_scheme_name, deposit_reference, updated_at'
      )
      .eq('tenant_contact_id', contactId)
      .order('updated_at', { ascending: false })

    if (tenancyError) {
      setError(tenancyError.message)
      setLoading(false)
      return
    }

    const safeTenancies = (tenancyData || []) as TenancyRow[]
    const propertyIds = Array.from(new Set(safeTenancies.map((item) => item.property_id).filter(Boolean))) as string[]

    const propertyResponse = propertyIds.length
      ? await supabase
          .from('properties')
          .select('id, address_line_1, address_line_2, city, postcode, country, property_type, bedroom_count, bathroom_count')
          .in('id', propertyIds)
      : { data: [], error: null }

    if (propertyResponse.error) {
      setError(propertyResponse.error.message)
      setLoading(false)
      return
    }

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(
        'id, case_number, case_type, priority, status, summary, created_at, updated_at, last_activity_at, next_action_at, waiting_on, waiting_reason'
      )
      .eq('contact_id', contactId)
      .order('last_activity_at', { ascending: false })
      .limit(30)

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    const safeCases = (caseData || []) as CaseRow[]
    const caseIds = safeCases.map((item) => item.id)

    const messageResponse = caseIds.length
      ? await supabase
          .from('messages')
          .select('id, case_id, channel, sender_type, message_text, created_at, direction, message_type')
          .in('case_id', caseIds)
          .order('created_at', { ascending: false })
          .limit(40)
      : { data: [], error: null }

    if (messageResponse.error) {
      setError(messageResponse.error.message)
      setLoading(false)
      return
    }

    const maintenanceResponse = caseIds.length
      ? await supabase
          .from('maintenance_requests')
          .select('id, case_id, property_id, issue_type, description, priority, status, scheduled_for, completed_at, updated_at, access_notes')
          .in('case_id', caseIds)
          .order('updated_at', { ascending: false })
          .limit(20)
      : { data: [], error: null }

    if (maintenanceResponse.error) {
      setError(maintenanceResponse.error.message)
      setLoading(false)
      return
    }

    setContact((contactData as ContactRow | null) ?? null)
    setTenancies(safeTenancies)
    setProperties((propertyResponse.data || []) as PropertyRow[])
    setCases(safeCases)
    setMessages((messageResponse.data || []) as MessageRow[])
    setMaintenance((maintenanceResponse.data || []) as MaintenanceRow[])
    setLoading(false)
  }, [])

  async function submitTenantAction(action: 'update' | 'still_waiting' | 'issue_resolved') {
    if (!portalProfile?.contact_id) return

    if (!actionCase) {
      setActionMessage('No open request is available to update right now.')
      return
    }

    if (action === 'update' && !updateDraft.trim()) {
      setActionMessage('Add a short update before sending it to the team.')
      return
    }

    setActionLoading(action)
    setActionMessage(null)

    const response =
      action === 'update'
        ? await supabase.rpc('tenant_add_case_update', {
            target_case_id: actionCase.id,
            update_text: updateDraft.trim(),
          })
        : await supabase.rpc('tenant_case_signal', {
            target_case_id: actionCase.id,
            signal_type: action,
          })

    if (response.error) {
      setActionMessage(response.error.message)
      setActionLoading(null)
      return
    }

    if (action === 'update') {
      setUpdateDraft('')
      setActionMessage('Your message has been sent to the team.')
      showLiveMessage('Your message has been sent live.')
    } else if (action === 'still_waiting') {
      setActionMessage('The team has been nudged that you are still waiting.')
      showLiveMessage('Still waiting signal sent.')
    } else {
      setActionMessage('Thanks. The team has been told the issue looks resolved.')
      showLiveMessage('Resolution update sent.')
    }

    await loadPortalData(portalProfile.contact_id)
    setActionLoading(null)
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrapPortal() {
      try {
        const user = await getSessionUser()

        if (cancelled) return

        if (!user) {
          router.replace('/login')
          setAuthLoading(false)
          return
        }

        const profile = await getPortalProfile(user.id)

        if (cancelled) return

        if (!profile) {
          router.replace('/')
          setAuthLoading(false)
          return
        }

        if (profile.portal_role !== 'tenant') {
          router.replace(getPortalRoute(profile.portal_role))
          setAuthLoading(false)
          return
        }

        if (profile.is_active === false) {
          setError('Your portal access is inactive. Please contact the agency.')
          setAuthLoading(false)
          return
        }

        setPortalProfile(profile)
        setAuthLoading(false)
        void loadPortalData(profile.contact_id)
      } catch (portalError) {
        if (!cancelled) {
          setError(
            portalError instanceof Error ? portalError.message : 'Unable to load tenant portal.'
          )
          setAuthLoading(false)
        }
      }
    }

    void bootstrapPortal()

    return () => {
      cancelled = true
    }
  }, [loadPortalData, router])

  useEffect(() => {
    return () => {
      if (liveMessageTimer.current) {
        window.clearTimeout(liveMessageTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!portalProfile?.contact_id) return

    const channel = supabase
      .channel(`tenant-portal-${portalProfile.contact_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases' },
        async () => {
          await loadPortalData(portalProfile.contact_id)
          showLiveMessage('Case updates refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        async () => {
          await loadPortalData(portalProfile.contact_id)
          showLiveMessage('Messages refreshed live.')
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_requests' },
        async () => {
          await loadPortalData(portalProfile.contact_id)
          showLiveMessage('Maintenance updates refreshed live.')
        }
      )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPortalData, portalProfile?.contact_id, showLiveMessage])

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Loading your tenant portal...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
          <div className="space-y-6">
            <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="app-kicker">Tenant Portal</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                    Keep up with your property updates without chasing
                  </h1>
                </div>
                <span className="app-live-pill rounded-full px-3 py-1 text-xs font-medium">
                  {liveMessage}
                </span>
              </div>

              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This portal keeps your active cases, team updates, and maintenance progress in one
                place so you can see what is happening in real time.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Open cases',
                    value: openCases.length,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                    helper: 'Active issues still being worked on',
                  },
                  {
                    label: 'Team updates',
                    value: visibleMessages.filter((item) => item.direction === 'outbound').length,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                    helper: 'Messages sent back to you',
                  },
                  {
                    label: 'Maintenance live',
                    value: maintenance.filter((item) => !['completed', 'cancelled'].includes(item.status || '')).length,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                    helper: 'Jobs still moving forward',
                  },
                  {
                    label: 'Current tenancy',
                    value: activeTenancy ? 'Yes' : 'No',
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                    helper: activeTenancy ? 'A tenancy record is linked to this portal' : 'No active tenancy linked yet',
                  },
                ].map((card) => (
                  <article key={card.label} className={`rounded-[1.5rem] border px-4 py-3 ${card.tone}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
                      {card.label}
                    </p>
                    <p className="mt-2 text-[2rem] font-semibold leading-none">{card.value}</p>
                    <p className="mt-2 text-sm opacity-80">{card.helper}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 border-b app-divider pb-4">
                <div>
                  <p className="app-kicker">Latest Updates</p>
                  <h2 className="mt-2 text-2xl font-semibold">Live feed from your cases and messages</h2>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
                  {liveFeed.length} shown
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {liveFeed.map((item) => (
                  <article key={item.id} className={`rounded-[1.4rem] border p-4 ${item.tone}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          {item.label}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-stone-900">{item.title}</h3>
                      </div>
                      <span className="text-xs text-stone-500">{formatRelativeTime(item.timestamp)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-700">{item.body}</p>
                    {item.href && (
                      <Link href={item.href} className="mt-3 inline-flex text-sm font-medium text-stone-700 underline-offset-4 hover:underline">
                        Open case
                      </Link>
                    )}
                  </article>
                ))}

                {!liveFeed.length && !loading && (
                  <div className="app-empty-state rounded-[1.5rem] p-6 text-sm text-stone-600">
                    No live updates are visible yet. Once cases or messages are linked to this portal,
                    they will show here.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 border-b app-divider pb-4">
                <div>
                  <p className="app-kicker">Current Requests</p>
                  <h2 className="mt-2 text-2xl font-semibold">What the team is actively working on</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {openCases.map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-900">{item.case_number || 'Case'}</h3>
                      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                        {item.status || 'open'}
                      </span>
                      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                        {item.priority || 'medium'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-700">{item.summary || 'No summary has been added yet.'}</p>
                    <div className="mt-4 space-y-2 text-sm text-stone-600">
                      <p>Next step: {item.next_action_at ? formatDate(item.next_action_at) : 'Not set yet'}</p>
                      <p>
                        Waiting on:{' '}
                        {item.waiting_on ? item.waiting_on.replace(/_/g, ' ') : 'No specific blocker'}
                      </p>
                      {item.waiting_reason && <p>Reason: {item.waiting_reason}</p>}
                    </div>
                  </article>
                ))}

                {!openCases.length && !loading && (
                  <div className="app-empty-state rounded-[1.5rem] p-6 text-sm text-stone-600 xl:col-span-2">
                    You do not have any open cases linked to this portal right now.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="app-surface-strong rounded-[2rem] p-5 xl:sticky xl:top-6">
            <p className="app-kicker">Your Home</p>
            <h2 className="mt-3 text-2xl font-semibold">{portalProfile?.display_name || contact?.full_name || 'Tenant portal'}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{propertyLabel(activeProperty)}</p>

            <div className="app-card-muted mt-5 rounded-[1.5rem] p-4">
              <p className="text-sm font-medium text-stone-900">Tenancy snapshot</p>
              <dl className="mt-3 space-y-3 text-sm text-stone-700">
                <div className="flex items-center justify-between gap-4">
                  <dt>Status</dt>
                  <dd className="font-medium text-stone-900">{activeTenancy?.status || 'Not linked yet'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Start date</dt>
                  <dd className="font-medium text-stone-900">{formatDate(activeTenancy?.start_date || null)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Rent</dt>
                  <dd className="font-medium text-stone-900">{formatMoney(activeTenancy?.rent_amount || null)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Deposit</dt>
                  <dd className="font-medium text-stone-900">{formatMoney(activeTenancy?.deposit_amount || null)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Deposit scheme</dt>
                  <dd className="text-right font-medium text-stone-900">
                    {activeTenancy?.deposit_scheme_name || '-'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="app-card-muted mt-4 rounded-[1.5rem] p-4">
              <p className="text-sm font-medium text-stone-900">Contact details</p>
              <div className="mt-3 space-y-2 text-sm text-stone-700">
                <p>{contact?.full_name || 'No name stored yet'}</p>
                <p>{contact?.email || 'No email stored yet'}</p>
                <p>{contact?.phone || 'No phone stored yet'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium text-stone-900">Message the team</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Send a custom message to the team or quickly tell them if you are still waiting or the issue now looks resolved.
              </p>

              <label className="mt-4 block text-sm">
                <span className="mb-2 block font-medium text-stone-700">Request</span>
                <select
                  value={selectedActionCaseId}
                  onChange={(event) => setActionCaseId(event.target.value)}
                  disabled={!openCases.length || actionLoading !== null}
                  className="app-field text-sm outline-none disabled:opacity-60"
                >
                  {openCases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.case_number || 'Case'}{item.summary ? ` • ${item.summary}` : ''}
                    </option>
                  ))}
                  {!openCases.length && <option value="">No open request available</option>}
                </select>
              </label>

              <label className="mt-4 block text-sm">
                <span className="mb-2 block font-medium text-stone-700">Your message</span>
                <textarea
                  value={updateDraft}
                  onChange={(event) => setUpdateDraft(event.target.value)}
                  rows={4}
                  disabled={!actionCase || actionLoading !== null}
                  placeholder="Write a message for the team"
                  className="app-field min-h-[120px] resize-none text-sm outline-none disabled:opacity-60"
                />
              </label>

              <div className="mt-4 grid gap-3">
                <button
                  onClick={() => void submitTenantAction('update')}
                  disabled={!actionCase || actionLoading !== null}
                  className="app-primary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                >
                  {actionLoading === 'update' ? 'Sending message...' : 'Send message'}
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => void submitTenantAction('still_waiting')}
                    disabled={!actionCase || actionLoading !== null}
                    className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                  >
                    {actionLoading === 'still_waiting' ? 'Sending...' : 'Still waiting'}
                  </button>

                  <button
                    onClick={() => void submitTenantAction('issue_resolved')}
                    disabled={!actionCase || actionLoading !== null}
                    className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                  >
                    {actionLoading === 'issue_resolved' ? 'Sending...' : 'Issue resolved'}
                  </button>
                </div>
              </div>

              {actionCase && (
                <p className="mt-3 text-xs leading-5 text-stone-500">
                  Updating {actionCase.case_number || 'the selected request'}
                </p>
              )}

              {actionMessage && (
                <div className="app-card-muted mt-3 rounded-2xl px-4 py-3 text-sm text-stone-700">
                  {actionMessage}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <p className="font-medium">Live feed reminder</p>
              <p className="mt-2 leading-6 text-sky-900/80">
                This portal refreshes as team updates, case changes, and maintenance progress are
                recorded.
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
