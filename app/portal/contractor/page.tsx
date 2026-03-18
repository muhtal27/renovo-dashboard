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
  company_name: string | null
}

type ContractorRow = {
  id: string
  contact_id: string
  company_name: string | null
  primary_trade: string | null
  coverage_area: string | null
  emergency_callout: boolean | null
  rating: number | null
  is_active: boolean | null
}

type TradeRow = {
  id: string
  contractor_id: string
  trade_type: string
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  status: string | null
  priority: string | null
  summary: string | null
  updated_at: string | null
  last_activity_at: string | null
}

type MaintenanceRow = {
  id: number
  case_id: string | null
  property_id: string | null
  issue_type: string | null
  description: string | null
  access_notes: string | null
  priority: string | null
  status: string | null
  scheduled_for: string | null
  estimated_cost: number | null
  final_cost: number | null
  updated_at: string | null
}

type QuoteRow = {
  id: string
  maintenance_request_id: number
  contractor_id: string
  quote_amount: number
  quote_notes: string | null
  quote_status: string | null
  submitted_at: string | null
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
  if (!property) return 'Property details will appear once linked'
  return [property.address_line_1, property.city, property.postcode].filter(Boolean).join(', ')
}

export default function ContractorPortalPage() {
  const router = useRouter()

  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('Live job updates connected')
  const [portalProfile, setPortalProfile] = useState<PortalProfile | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [contractor, setContractor] = useState<ContractorRow | null>(null)
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRow[]>([])
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [signingOut, setSigningOut] = useState(false)
  const [caseActionId, setCaseActionId] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const liveMessageTimer = useRef<number | null>(null)

  const activeJobs = useMemo(
    () => maintenance.filter((item) => !['completed', 'cancelled'].includes(item.status || '')),
    [maintenance]
  )

  const scheduledJobs = useMemo(
    () => maintenance.filter((item) => item.status === 'scheduled'),
    [maintenance]
  )

  const openCases = useMemo(
    () => cases.filter((item) => !['resolved', 'closed', 'cancelled'].includes(item.status || '')),
    [cases]
  )

  const selectedCaseActionId =
    caseActionId && openCases.some((item) => item.id === caseActionId)
      ? caseActionId
      : openCases[0]?.id || ''

  const actionCase = useMemo(
    () => openCases.find((item) => item.id === selectedCaseActionId) || openCases[0] || null,
    [openCases, selectedCaseActionId]
  )

  const liveFeed = useMemo<FeedItem[]>(() => {
    const jobItems = maintenance.map((item) => ({
      id: `job-${item.id}`,
      timestamp: item.updated_at || item.scheduled_for,
      label: 'Job update',
      title: item.issue_type || 'Assigned work',
      body:
        item.status === 'scheduled' && item.scheduled_for
          ? `Scheduled for ${formatDate(item.scheduled_for)}`
          : item.status === 'completed'
            ? `Completed ${formatRelativeTime(item.updated_at)}`
            : item.description || item.status || 'Job update',
      href: item.case_id ? `/cases/${item.case_id}` : null,
      tone: 'border-amber-200 bg-amber-50/80',
    }))

    const quoteItems = quotes.map((item) => ({
      id: `quote-${item.id}`,
      timestamp: item.submitted_at,
      label: 'Quote',
      title: `${formatMoney(item.quote_amount)} quote`,
      body: item.quote_notes || item.quote_status || 'Quote activity',
      href: '/records/maintenance',
      tone: 'border-sky-200 bg-sky-50/80',
    }))

    const caseItems = cases.map((item) => ({
      id: `case-${item.id}`,
      timestamp: item.last_activity_at || item.updated_at,
      label: 'Case context',
      title: item.case_number || 'Case',
      body: item.summary || 'Linked case context for your assigned work.',
      href: item.id ? `/cases/${item.id}` : null,
      tone: 'border-stone-200 bg-white',
    }))

    return [...jobItems, ...quoteItems, ...caseItems]
      .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime())
      .slice(0, 14)
  }, [cases, maintenance, quotes])

  const showLiveMessage = useCallback((message: string) => {
    setLiveMessage(message)
    if (liveMessageTimer.current) {
      window.clearTimeout(liveMessageTimer.current)
    }
    liveMessageTimer.current = window.setTimeout(() => {
      setLiveMessage('Live job updates connected')
    }, 2400)
  }, [])

  const loadPortalData = useCallback(async (profile: PortalProfile) => {
    setError(null)

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, full_name, phone, email, company_name')
      .eq('id', profile.contact_id)
      .maybeSingle()

    if (contactError) {
      setError(contactError.message)
      setLoading(false)
      return
    }

    const contractorResponse = profile.contractor_id
      ? await supabase
          .from('contractors')
          .select('id, contact_id, company_name, primary_trade, coverage_area, emergency_callout, rating, is_active')
          .eq('id', profile.contractor_id)
          .maybeSingle()
      : await supabase
          .from('contractors')
          .select('id, contact_id, company_name, primary_trade, coverage_area, emergency_callout, rating, is_active')
          .eq('contact_id', profile.contact_id)
          .maybeSingle()

    if (contractorResponse.error) {
      setError(contractorResponse.error.message)
      setLoading(false)
      return
    }

    const safeContractor = (contractorResponse.data as ContractorRow | null) ?? null

    if (!safeContractor) {
      setContact((contactData as ContactRow | null) ?? null)
      setContractor(null)
      setTrades([])
      setProperties([])
      setCases([])
      setMaintenance([])
      setQuotes([])
      setLoading(false)
      return
    }

    const tradesResponse = await supabase
      .from('contractor_trades')
      .select('id, contractor_id, trade_type')
      .eq('contractor_id', safeContractor.id)
      .order('trade_type', { ascending: true })

    if (tradesResponse.error) {
      setError(tradesResponse.error.message)
      setLoading(false)
      return
    }

    const maintenanceResponse = await supabase
      .from('maintenance_requests')
      .select('id, case_id, property_id, issue_type, description, access_notes, priority, status, scheduled_for, estimated_cost, final_cost, updated_at')
      .eq('contractor_id', safeContractor.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (maintenanceResponse.error) {
      setError(maintenanceResponse.error.message)
      setLoading(false)
      return
    }

    const safeMaintenance = (maintenanceResponse.data || []) as MaintenanceRow[]
    const propertyIds = Array.from(new Set(safeMaintenance.map((item) => item.property_id).filter(Boolean))) as string[]
    const caseIds = Array.from(new Set(safeMaintenance.map((item) => item.case_id).filter(Boolean))) as string[]

    const propertyResponse = propertyIds.length
      ? await supabase
          .from('properties')
          .select('id, address_line_1, address_line_2, city, postcode')
          .in('id', propertyIds)
      : { data: [], error: null }

    if (propertyResponse.error) {
      setError(propertyResponse.error.message)
      setLoading(false)
      return
    }

    const caseResponse = caseIds.length
      ? await supabase
          .from('cases')
          .select('id, case_number, status, priority, summary, updated_at, last_activity_at')
          .in('id', caseIds)
      : { data: [], error: null }

    if (caseResponse.error) {
      setError(caseResponse.error.message)
      setLoading(false)
      return
    }

    const quoteResponse = await supabase
      .from('maintenance_quotes')
      .select('id, maintenance_request_id, contractor_id, quote_amount, quote_notes, quote_status, submitted_at')
      .eq('contractor_id', safeContractor.id)
      .order('submitted_at', { ascending: false })
      .limit(30)

    if (quoteResponse.error) {
      setError(quoteResponse.error.message)
      setLoading(false)
      return
    }

    setContact((contactData as ContactRow | null) ?? null)
    setContractor(safeContractor)
    setTrades((tradesResponse.data || []) as TradeRow[])
    setMaintenance(safeMaintenance)
    setProperties((propertyResponse.data || []) as PropertyRow[])
    setCases((caseResponse.data || []) as CaseRow[])
    setQuotes((quoteResponse.data || []) as QuoteRow[])
    setLoading(false)
  }, [])

  async function submitContractorMessage() {
    if (!portalProfile?.contact_id) return

    if (!actionCase) {
      setActionMessage('No open linked case is available to message right now.')
      return
    }

    if (!messageDraft.trim()) {
      setActionMessage('Add a short message before sending it to the team.')
      return
    }

    setActionLoading(true)
    setActionMessage(null)

    const response = await supabase.rpc('contractor_add_case_update', {
      target_case_id: actionCase.id,
      update_text: messageDraft.trim(),
    })

    if (response.error) {
      setActionMessage(response.error.message)
      setActionLoading(false)
      return
    }

    setMessageDraft('')
    setActionMessage('Your message has been sent to the team.')
    await loadPortalData(portalProfile)
    showLiveMessage('Your message has been sent live.')
    setActionLoading(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    setActionMessage(null)

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setActionMessage(signOutError.message)
      setSigningOut(false)
      return
    }

    router.replace('/login')
    router.refresh()
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

        if (profile.portal_role !== 'contractor') {
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
        void loadPortalData(profile)
      } catch (portalError) {
        if (!cancelled) {
          setError(
            portalError instanceof Error ? portalError.message : 'Unable to load contractor portal.'
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
    if (!portalProfile) return

    const channel = supabase
      .channel(`contractor-portal-${portalProfile.contact_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, async () => {
        await loadPortalData(portalProfile)
        showLiveMessage('Job activity refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_quotes' }, async () => {
        await loadPortalData(portalProfile)
        showLiveMessage('Quote activity refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, async () => {
        await loadPortalData(portalProfile)
        showLiveMessage('Case context refreshed live.')
      })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPortalData, portalProfile, showLiveMessage])

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Loading your contractor portal...
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
                  <p className="app-kicker">Contractor Portal</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                    Stay on top of assigned jobs, access notes, and quote work in one place
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <span className="app-live-pill rounded-full px-3 py-1 text-xs font-medium">
                    {liveMessage}
                  </span>
                  <button
                    onClick={() => void handleSignOut()}
                    disabled={signingOut}
                    className="app-secondary-button rounded-full px-3.5 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>

              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                Assigned work updates here live so you do not have to phone in for the latest status,
                schedule note, or case context.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Active jobs',
                    value: activeJobs.length,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                    helper: 'Jobs still in motion',
                  },
                  {
                    label: 'Scheduled',
                    value: scheduledJobs.length,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                    helper: 'Visits already booked in',
                  },
                  {
                    label: 'Quotes sent',
                    value: quotes.length,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                    helper: 'Quote activity on record',
                  },
                  {
                    label: 'Linked cases',
                    value: cases.length,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                    helper: 'Cases attached to your jobs',
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
                  <p className="app-kicker">Live Feed</p>
                  <h2 className="mt-2 text-2xl font-semibold">Job updates and case context</h2>
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
                        Open details
                      </Link>
                    )}
                  </article>
                ))}

                {!liveFeed.length && !loading && (
                  <div className="app-empty-state rounded-[1.5rem] p-6 text-sm text-stone-600">
                    No assigned jobs or quotes are visible yet. Once work is linked, it will appear here.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 border-b app-divider pb-4">
                <div>
                  <p className="app-kicker">Assigned Work</p>
                  <h2 className="mt-2 text-2xl font-semibold">Current jobs with access notes</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {activeJobs.map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-900">{item.issue_type || 'Assigned work'}</h3>
                      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                        {item.status || 'reported'}
                      </span>
                      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                        {item.priority || 'medium'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-700">{item.description || 'No description has been added yet.'}</p>
                    <div className="mt-4 space-y-2 text-sm text-stone-600">
                      <p>{propertyLabel(properties.find((entry) => entry.id === item.property_id) || null)}</p>
                      <p>Scheduled: {formatDate(item.scheduled_for)}</p>
                      <p>Access notes: {item.access_notes || 'No access notes stored yet'}</p>
                    </div>
                    {item.case_id && (
                      <Link href={`/cases/${item.case_id}`} className="mt-3 inline-flex text-sm font-medium text-stone-700 underline-offset-4 hover:underline">
                        Open linked case
                      </Link>
                    )}
                  </article>
                ))}

                {!activeJobs.length && !loading && (
                  <div className="app-empty-state rounded-[1.5rem] p-6 text-sm text-stone-600 xl:col-span-2">
                    There are no active assigned jobs visible in this portal right now.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="app-surface-strong rounded-[2rem] p-5 xl:sticky xl:top-6">
            <p className="app-kicker">Contractor Snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {portalProfile?.display_name || contractor?.company_name || contact?.company_name || contact?.full_name || 'Contractor portal'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {contractor?.primary_trade || 'Primary trade not stored yet'}
            </p>

            <div className="app-card-muted mt-5 rounded-[1.5rem] p-4">
              <p className="text-sm font-medium text-stone-900">Working profile</p>
              <dl className="mt-3 space-y-3 text-sm text-stone-700">
                <div className="flex items-center justify-between gap-4">
                  <dt>Coverage</dt>
                  <dd className="font-medium text-stone-900">{contractor?.coverage_area || '-'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Emergency callout</dt>
                  <dd className="font-medium text-stone-900">{contractor?.emergency_callout ? 'Yes' : 'No'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Rating</dt>
                  <dd className="font-medium text-stone-900">{contractor?.rating ?? '-'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Latest quote</dt>
                  <dd className="font-medium text-stone-900">
                    {quotes[0] ? formatMoney(quotes[0].quote_amount) : '-'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="app-card-muted mt-4 rounded-[1.5rem] p-4">
              <p className="text-sm font-medium text-stone-900">Trades</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(trades.length ? trades : contractor?.primary_trade ? [{ id: 'primary', contractor_id: contractor.id, trade_type: contractor.primary_trade }] : []).map((trade) => (
                  <span key={trade.id} className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                    {trade.trade_type}
                  </span>
                ))}
                {!trades.length && !contractor?.primary_trade && (
                  <span className="text-sm text-stone-600">No trades stored yet</span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium text-stone-900">Message the team</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Send a custom update against the linked case so the operations team keeps the full job history in one place.
              </p>

              <label className="mt-4 block text-sm">
                <span className="mb-2 block font-medium text-stone-700">Linked case</span>
                <select
                  value={selectedCaseActionId}
                  onChange={(event) => setCaseActionId(event.target.value)}
                  disabled={!openCases.length || actionLoading}
                  className="app-field text-sm outline-none disabled:opacity-60"
                >
                  {openCases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.case_number || 'Case'}{item.summary ? ` • ${item.summary}` : ''}
                    </option>
                  ))}
                  {!openCases.length && <option value="">No open linked case available</option>}
                </select>
              </label>

              <label className="mt-4 block text-sm">
                <span className="mb-2 block font-medium text-stone-700">Your message</span>
                <textarea
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  rows={4}
                  disabled={!actionCase || actionLoading}
                  placeholder="Write a message for the team"
                  className="app-field min-h-[112px] resize-none text-sm outline-none disabled:opacity-60"
                />
              </label>

              <button
                onClick={() => void submitContractorMessage()}
                disabled={!actionCase || actionLoading}
                className="app-primary-button mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {actionLoading ? 'Sending message...' : 'Send message'}
              </button>

              {actionCase && (
                <p className="mt-3 text-xs leading-5 text-stone-500">
                  Updating {actionCase.case_number || 'the selected case'}
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
                Assigned jobs, linked cases, and quote activity refresh here as the team updates them.
              </p>
            </div>

            {maintenance.slice(0, 3).map((item) => (
              <div key={item.id} className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                <p className="text-sm font-medium text-stone-900">{item.issue_type || 'Assigned work'}</p>
                <p className="mt-1 text-sm text-stone-600">
                  {propertyLabel(properties.find((entry) => entry.id === item.property_id) || null)}
                </p>
              </div>
            ))}

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
