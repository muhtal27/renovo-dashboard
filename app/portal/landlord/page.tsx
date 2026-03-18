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

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
  country: string | null
  property_type: string | null
  management_type: string | null
  is_active: boolean | null
}

type TenancyRow = {
  id: string
  property_id: string | null
  tenant_contact_id: string | null
  landlord_contact_id: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
  rent_amount: number | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  property_id: string | null
  case_type: string | null
  priority: string | null
  status: string | null
  summary: string | null
  updated_at: string | null
  last_activity_at: string | null
  next_action_at: string | null
  waiting_on: string | null
}

type MessageRow = {
  id: string
  case_id: string | null
  message_text: string | null
  created_at: string | null
  direction: string | null
  message_type: string | null
  channel: string | null
}

type MaintenanceRow = {
  id: number
  case_id: string | null
  property_id: string | null
  issue_type: string | null
  description: string | null
  priority: string | null
  status: string | null
  landlord_approval_required: boolean | null
  estimated_cost: number | null
  final_cost: number | null
  scheduled_for: string | null
  updated_at: string | null
}

type QuoteRow = {
  id: string
  maintenance_request_id: number
  contractor_id: string | null
  quote_amount: number | null
  quote_notes: string | null
  quote_status: string | null
  file_url: string | null
  submitted_at: string | null
}

type ComplianceRow = {
  id: string
  property_id: string
  record_type: string
  status: string
  issue_date: string | null
  expiry_date: string | null
  reference_number: string | null
  updated_at: string | null
}

type ViewingRow = {
  id: number
  case_id: string | null
  property_id: string | null
  status: string | null
  requested_date: string | null
  booked_slot: string | null
  updated_at: string | null
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
  if (!property) return 'Property details will appear here once linked'
  return [property.address_line_1, property.city, property.postcode].filter(Boolean).join(', ')
}

export default function LandlordPortalPage() {
  const router = useRouter()

  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('Live portfolio updates connected')
  const [portalProfile, setPortalProfile] = useState<PortalProfile | null>(null)
  const [contact, setContact] = useState<ContactRow | null>(null)
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRow[]>([])
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [compliance, setCompliance] = useState<ComplianceRow[]>([])
  const [viewings, setViewings] = useState<ViewingRow[]>([])
  const [signingOut, setSigningOut] = useState(false)
  const [approvalRequestId, setApprovalRequestId] = useState<number | null>(null)
  const [approvalQuoteId, setApprovalQuoteId] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [caseActionId, setCaseActionId] = useState('')
  const [signalNote, setSignalNote] = useState('')
  const [actionLoading, setActionLoading] = useState<'approve_quote' | 'send_message' | 'need_more_detail' | 'request_callback' | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const liveMessageTimer = useRef<number | null>(null)

  const urgentCases = useMemo(
    () => cases.filter((item) => ['urgent', 'high'].includes(item.priority || '')),
    [cases]
  )

  const openMaintenance = useMemo(
    () => maintenance.filter((item) => !['completed', 'cancelled'].includes(item.status || '')),
    [maintenance]
  )

  const compliancePressure = useMemo(
    () => compliance.filter((item) => ['expired', 'expiring', 'missing', 'pending'].includes(item.status || '')),
    [compliance]
  )

  const openCases = useMemo(
    () => cases.filter((item) => !['resolved', 'closed', 'cancelled'].includes(item.status || '')),
    [cases]
  )

  const quotesByRequestId = useMemo(() => {
    const map = new Map<number, QuoteRow[]>()

    for (const quote of quotes) {
      const existing = map.get(quote.maintenance_request_id) ?? []
      existing.push(quote)
      map.set(quote.maintenance_request_id, existing)
    }

    for (const [requestId, values] of map.entries()) {
      values.sort((left, right) => new Date(right.submitted_at || 0).getTime() - new Date(left.submitted_at || 0).getTime())
      map.set(requestId, values)
    }

    return map
  }, [quotes])

  const approvalRequests = useMemo(
    () =>
      openMaintenance.filter(
        (item) =>
          (item.landlord_approval_required || item.status === 'awaiting_approval' || item.status === 'quote_requested') &&
          (quotesByRequestId.get(item.id)?.length ?? 0) > 0
      ),
    [openMaintenance, quotesByRequestId]
  )

  const selectedApprovalRequestId =
    approvalRequestId !== null && approvalRequests.some((item) => item.id === approvalRequestId)
      ? approvalRequestId
      : approvalRequests[0]?.id ?? null

  const selectedApprovalRequest = useMemo(
    () => approvalRequests.find((item) => item.id === selectedApprovalRequestId) || approvalRequests[0] || null,
    [approvalRequests, selectedApprovalRequestId]
  )

  const approvalQuotes = useMemo(
    () => (selectedApprovalRequest ? quotesByRequestId.get(selectedApprovalRequest.id) ?? [] : []),
    [quotesByRequestId, selectedApprovalRequest]
  )

  const selectedApprovalQuoteId =
    approvalQuoteId && approvalQuotes.some((item) => item.id === approvalQuoteId)
      ? approvalQuoteId
      : approvalQuotes[0]?.id || ''

  const selectedApprovalQuote = useMemo(
    () => approvalQuotes.find((item) => item.id === selectedApprovalQuoteId) || approvalQuotes[0] || null,
    [approvalQuotes, selectedApprovalQuoteId]
  )

  const selectedCaseActionId =
    caseActionId && openCases.some((item) => item.id === caseActionId)
      ? caseActionId
      : openCases[0]?.id || ''

  const actionCase = useMemo(
    () => openCases.find((item) => item.id === selectedCaseActionId) || openCases[0] || null,
    [openCases, selectedCaseActionId]
  )

  const requestById = useMemo(() => new Map(maintenance.map((item) => [item.id, item])), [maintenance])

  const liveFeed = useMemo<FeedItem[]>(() => {
    const caseItems = cases.map((item) => ({
      id: `case-${item.id}`,
      timestamp: item.last_activity_at || item.updated_at,
      label: 'Case update',
      title: item.case_number || 'Case',
      body:
        item.next_action_at
          ? `Next step ${formatRelativeTime(item.next_action_at)}${item.waiting_on ? ` • waiting on ${item.waiting_on.replace(/_/g, ' ')}` : ''}`
          : item.summary || 'Your property case is still moving.',
      href: item.id ? `/cases/${item.id}` : null,
      tone: 'border-stone-200 bg-white',
    }))

    const messageItems = messages
      .filter(
        (item) =>
          item.direction !== 'internal' &&
          item.message_type !== 'note' &&
          item.message_type !== 'system'
      )
      .map((item) => ({
        id: `message-${item.id}`,
        timestamp: item.created_at,
        label: item.direction === 'outbound' ? 'Team message' : 'Case activity',
        title: item.case_id ? cases.find((entry) => entry.id === item.case_id)?.case_number || 'Message' : 'Message',
        body: item.message_text || 'No message text',
        href: item.case_id ? `/cases/${item.case_id}` : null,
        tone: item.direction === 'outbound' ? 'border-emerald-200 bg-emerald-50/80' : 'border-sky-200 bg-sky-50/80',
      }))

    const maintenanceItems = openMaintenance.map((item) => ({
      id: `maintenance-${item.id}`,
      timestamp: item.updated_at || item.scheduled_for,
      label: 'Maintenance',
      title: item.issue_type || 'Property issue',
      body:
        item.status === 'scheduled' && item.scheduled_for
          ? `Scheduled for ${formatDate(item.scheduled_for)}`
          : item.estimated_cost
            ? `${item.status || 'in progress'} • est. ${formatMoney(item.estimated_cost)}`
            : item.description || item.status || 'Maintenance activity',
      href: item.case_id ? `/cases/${item.case_id}` : null,
      tone: 'border-amber-200 bg-amber-50/80',
    }))

    const quoteItems = quotes.map((item) => {
      const request = requestById.get(item.maintenance_request_id) || null

      return {
        id: `quote-${item.id}`,
        timestamp: item.submitted_at,
        label: 'Quote',
        title: `${formatMoney(item.quote_amount)} quote`,
        body:
          item.quote_status === 'accepted'
            ? `Approved quote${item.quote_notes ? ` • ${item.quote_notes}` : ''}`
            : item.quote_notes || item.quote_status || 'Quote awaiting a decision',
        href: request?.case_id ? `/cases/${request.case_id}` : null,
        tone:
          item.quote_status === 'accepted'
            ? 'border-emerald-200 bg-emerald-50/80'
            : 'border-sky-200 bg-sky-50/80',
      }
    })

    const complianceItems = compliancePressure.map((item) => ({
      id: `compliance-${item.id}`,
      timestamp: item.updated_at || item.expiry_date,
      label: 'Compliance',
      title: item.record_type.replace(/_/g, ' '),
      body:
        item.status === 'expired'
          ? `Expired ${formatDate(item.expiry_date)}`
          : item.status === 'expiring'
            ? `Expiring ${formatDate(item.expiry_date)}`
            : item.status === 'missing'
              ? 'No valid record is stored yet'
              : 'Still awaiting completion',
      href: '/records/compliance',
      tone: 'border-rose-200 bg-rose-50/80',
    }))

    const viewingItems = viewings.map((item) => ({
      id: `viewing-${item.id}`,
      timestamp: item.updated_at || item.booked_slot || item.requested_date,
      label: 'Viewing',
      title: 'Viewing activity',
      body:
        item.booked_slot
          ? `Booked for ${formatDate(item.booked_slot)}`
          : item.requested_date
            ? `Requested for ${formatDate(item.requested_date)}`
            : item.status || 'Viewing update',
      href: item.case_id ? `/cases/${item.case_id}` : '/records/viewings',
      tone: 'border-sky-200 bg-sky-50/80',
    }))

    return [...caseItems, ...messageItems, ...maintenanceItems, ...quoteItems, ...complianceItems, ...viewingItems]
      .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime())
      .slice(0, 14)
  }, [cases, compliancePressure, messages, openMaintenance, quotes, requestById, viewings])

  const showLiveMessage = useCallback((message: string) => {
    setLiveMessage(message)
    if (liveMessageTimer.current) {
      window.clearTimeout(liveMessageTimer.current)
    }
    liveMessageTimer.current = window.setTimeout(() => {
      setLiveMessage('Live portfolio updates connected')
    }, 2400)
  }, [])

  const loadPortalData = useCallback(async (contactId: string) => {
    setError(null)

    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('id, full_name, phone, email, company_name')
      .eq('id', contactId)
      .maybeSingle()

    if (contactError) {
      setError(contactError.message)
      setLoading(false)
      return
    }

    const propertyResponse = await supabase
      .from('properties')
      .select('id, address_line_1, address_line_2, city, postcode, country, property_type, management_type, is_active')
      .eq('landlord_contact_id', contactId)
      .order('updated_at', { ascending: false })

    if (propertyResponse.error) {
      setError(propertyResponse.error.message)
      setLoading(false)
      return
    }

    const safeProperties = (propertyResponse.data || []) as PropertyRow[]
    const propertyIds = safeProperties.map((item) => item.id)

    const tenancyResponse = propertyIds.length
      ? await supabase
          .from('tenancies')
          .select('id, property_id, tenant_contact_id, landlord_contact_id, status, start_date, end_date, rent_amount, updated_at')
          .in('property_id', propertyIds)
          .order('updated_at', { ascending: false })
      : { data: [], error: null }

    if (tenancyResponse.error) {
      setError(tenancyResponse.error.message)
      setLoading(false)
      return
    }

    const caseResponse = propertyIds.length
      ? await supabase
          .from('cases')
          .select('id, case_number, property_id, case_type, priority, status, summary, updated_at, last_activity_at, next_action_at, waiting_on')
          .in('property_id', propertyIds)
          .order('last_activity_at', { ascending: false })
          .limit(40)
      : { data: [], error: null }

    if (caseResponse.error) {
      setError(caseResponse.error.message)
      setLoading(false)
      return
    }

    const safeCases = (caseResponse.data || []) as CaseRow[]
    const caseIds = safeCases.map((item) => item.id)

    const messageResponse = caseIds.length
      ? await supabase
          .from('messages')
          .select('id, case_id, message_text, created_at, direction, message_type, channel')
          .in('case_id', caseIds)
          .order('created_at', { ascending: false })
          .limit(50)
      : { data: [], error: null }

    if (messageResponse.error) {
      setError(messageResponse.error.message)
      setLoading(false)
      return
    }

    const maintenanceResponse = propertyIds.length
      ? await supabase
          .from('maintenance_requests')
          .select(
            'id, case_id, property_id, issue_type, description, priority, status, landlord_approval_required, estimated_cost, final_cost, scheduled_for, updated_at'
          )
          .in('property_id', propertyIds)
          .order('updated_at', { ascending: false })
          .limit(40)
      : { data: [], error: null }

    if (maintenanceResponse.error) {
      setError(maintenanceResponse.error.message)
      setLoading(false)
      return
    }

    const safeMaintenance = (maintenanceResponse.data || []) as MaintenanceRow[]
    const requestIds = safeMaintenance.map((item) => item.id)

    const quoteResponse = requestIds.length
      ? await supabase
          .from('maintenance_quotes')
          .select('id, maintenance_request_id, contractor_id, quote_amount, quote_notes, quote_status, file_url, submitted_at')
          .in('maintenance_request_id', requestIds)
          .order('submitted_at', { ascending: false })
          .limit(40)
      : { data: [], error: null }

    if (quoteResponse.error) {
      setError(quoteResponse.error.message)
      setLoading(false)
      return
    }

    const complianceResponse = propertyIds.length
      ? await supabase
          .from('compliance_records')
          .select('id, property_id, record_type, status, issue_date, expiry_date, reference_number, updated_at')
          .in('property_id', propertyIds)
          .order('updated_at', { ascending: false })
          .limit(40)
      : { data: [], error: null }

    if (complianceResponse.error) {
      setError(complianceResponse.error.message)
      setLoading(false)
      return
    }

    const viewingResponse = propertyIds.length
      ? await supabase
          .from('viewing_requests')
          .select('id, case_id, property_id, status, requested_date, booked_slot, updated_at')
          .in('property_id', propertyIds)
          .order('updated_at', { ascending: false })
          .limit(20)
      : { data: [], error: null }

    if (viewingResponse.error) {
      setError(viewingResponse.error.message)
      setLoading(false)
      return
    }

    setContact((contactData as ContactRow | null) ?? null)
    setProperties(safeProperties)
    setTenancies((tenancyResponse.data || []) as TenancyRow[])
    setCases(safeCases)
    setMessages((messageResponse.data || []) as MessageRow[])
    setMaintenance(safeMaintenance)
    setQuotes((quoteResponse.data || []) as QuoteRow[])
    setCompliance((complianceResponse.data || []) as ComplianceRow[])
    setViewings((viewingResponse.data || []) as ViewingRow[])
    setLoading(false)
  }, [])

  async function submitLandlordMessage() {
    if (!portalProfile?.contact_id) return

    if (!actionCase) {
      setActionMessage('No open case is available to message right now.')
      return
    }

    if (!signalNote.trim()) {
      setActionMessage('Add a short message before sending it to the team.')
      return
    }

    setActionLoading('send_message')
    setActionMessage(null)

    const response = await supabase.rpc('landlord_add_case_update', {
      target_case_id: actionCase.id,
      update_text: signalNote.trim(),
    })

    if (response.error) {
      setActionMessage(response.error.message)
      setActionLoading(null)
      return
    }

    setSignalNote('')
    setActionMessage('Your message has been sent to the team.')
    showLiveMessage('Your message has been sent live.')
    await loadPortalData(portalProfile.contact_id)
    setActionLoading(null)
  }

  async function submitLandlordQuoteApproval() {
    if (!portalProfile?.contact_id) return

    if (!selectedApprovalQuote) {
      setActionMessage('No quote is ready for approval right now.')
      return
    }

    setActionLoading('approve_quote')
    setActionMessage(null)

    const response = await supabase.rpc('landlord_approve_quote', {
      target_quote_id: selectedApprovalQuote.id,
      approval_note: approvalNote.trim() || null,
    })

    if (response.error) {
      setActionMessage(response.error.message)
      setActionLoading(null)
      return
    }

    setApprovalNote('')
    setActionMessage('Quote approved. The team can now move the job into scheduling.')
    showLiveMessage('Quote approval sent live.')
    await loadPortalData(portalProfile.contact_id)
    setActionLoading(null)
  }

  async function submitLandlordSignal(action: 'need_more_detail' | 'request_callback') {
    if (!portalProfile?.contact_id) return

    if (!actionCase) {
      setActionMessage('No open case is available to update right now.')
      return
    }

    if (action === 'need_more_detail' && !signalNote.trim()) {
      setActionMessage('Add a short note so the team knows what detail you need.')
      return
    }

    setActionLoading(action)
    setActionMessage(null)

    const response = await supabase.rpc('landlord_case_signal', {
      target_case_id: actionCase.id,
      signal_type: action,
      detail_text: signalNote.trim() || null,
    })

    if (response.error) {
      setActionMessage(response.error.message)
      setActionLoading(null)
      return
    }

    setSignalNote('')

    if (action === 'need_more_detail') {
      setActionMessage('The team has been told you need more detail before approving the next step.')
      showLiveMessage('More detail request sent live.')
    } else {
      setActionMessage('The team has been asked to call you back.')
      showLiveMessage('Callback request sent live.')
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

        if (profile.portal_role !== 'landlord') {
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
            portalError instanceof Error ? portalError.message : 'Unable to load landlord portal.'
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
    return () => {
      if (liveMessageTimer.current) {
        window.clearTimeout(liveMessageTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!portalProfile?.contact_id) return

    const channel = supabase
      .channel(`landlord-portal-${portalProfile.contact_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, async () => {
        await loadPortalData(portalProfile.contact_id)
        showLiveMessage('Case updates refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async () => {
        await loadPortalData(portalProfile.contact_id)
        showLiveMessage('Messages refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_requests' }, async () => {
        await loadPortalData(portalProfile.contact_id)
        showLiveMessage('Maintenance activity refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_quotes' }, async () => {
        await loadPortalData(portalProfile.contact_id)
        showLiveMessage('Quote activity refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compliance_records' }, async () => {
        await loadPortalData(portalProfile.contact_id)
        showLiveMessage('Compliance activity refreshed live.')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viewing_requests' }, async () => {
        await loadPortalData(portalProfile.contact_id)
        showLiveMessage('Viewing activity refreshed live.')
      })

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
            Loading your landlord portal...
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
                  <p className="app-kicker">Landlord Portal</p>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                    See the live position across your properties without chasing the office
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
                Your properties, issues, compliance pressure, and viewing activity stay visible here
                in one place so you can act without needing a separate update call.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Managed homes',
                    value: properties.length,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                    helper: 'Properties currently linked to you',
                  },
                  {
                    label: 'Open issues',
                    value: openMaintenance.length,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                    helper: 'Maintenance items still in motion',
                  },
                  {
                    label: 'Compliance pressure',
                    value: compliancePressure.length,
                    tone: 'border-rose-200 bg-rose-50 text-rose-900',
                    helper: 'Records that need attention soon',
                  },
                  {
                    label: 'Approvals waiting',
                    value: approvalRequests.length,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                    helper: 'Quotes that need your go-ahead',
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
                  <p className="app-kicker">Portfolio Feed</p>
                  <h2 className="mt-2 text-2xl font-semibold">Live activity across your properties</h2>
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
                    No portfolio updates are visible yet. Once issues, quotes, compliance records,
                    or viewings are linked, they will appear here.
                  </div>
                )}
              </div>
            </section>

            <section className="app-surface rounded-[2rem] p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 border-b app-divider pb-4">
                <div>
                  <p className="app-kicker">Priority Work</p>
                  <h2 className="mt-2 text-2xl font-semibold">What is most likely to need your attention</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {urgentCases.map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-stone-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-900">{item.case_number || 'Case'}</h3>
                      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                        {item.priority || 'medium'}
                      </span>
                      <span className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                        {item.status || 'open'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-700">{item.summary || 'No summary has been added yet.'}</p>
                    <p className="mt-4 text-sm text-stone-600">{propertyLabel(properties.find((entry) => entry.id === item.property_id) || null)}</p>
                    <Link href={`/cases/${item.id}`} className="mt-3 inline-flex text-sm font-medium text-stone-700 underline-offset-4 hover:underline">
                      Open case
                    </Link>
                  </article>
                ))}

                {!urgentCases.length && !loading && (
                  <div className="app-empty-state rounded-[1.5rem] p-6 text-sm text-stone-600 xl:col-span-2">
                    Nothing is flagged as urgent right now. The live feed above will still show
                    ongoing work as it changes.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="app-surface-strong rounded-[2rem] p-5 xl:sticky xl:top-6">
            <p className="app-kicker">Portfolio Snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold">
              {portalProfile?.display_name || contact?.company_name || contact?.full_name || 'Landlord portal'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {properties.length ? `${properties.length} linked properties` : 'No linked properties yet'}
            </p>

            <div className="app-card-muted mt-5 rounded-[1.5rem] p-4">
              <p className="text-sm font-medium text-stone-900">Portfolio summary</p>
              <dl className="mt-3 space-y-3 text-sm text-stone-700">
                <div className="flex items-center justify-between gap-4">
                  <dt>Active tenancies</dt>
                  <dd className="font-medium text-stone-900">
                    {tenancies.filter((item) => item.status === 'active').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Average rent</dt>
                  <dd className="font-medium text-stone-900">
                    {tenancies.length
                      ? formatMoney(
                          Math.round(
                            tenancies.reduce((sum, item) => sum + (item.rent_amount || 0), 0) /
                              Math.max(tenancies.filter((item) => item.rent_amount).length, 1)
                          )
                        )
                      : '-'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Open maintenance</dt>
                  <dd className="font-medium text-stone-900">{openMaintenance.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Compliance issues</dt>
                  <dd className="font-medium text-stone-900">{compliancePressure.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Approvals waiting</dt>
                  <dd className="font-medium text-stone-900">{approvalRequests.length}</dd>
                </div>
              </dl>
            </div>

            <div className="app-card-muted mt-4 rounded-[1.5rem] p-4">
              <p className="text-sm font-medium text-stone-900">Contact details</p>
              <div className="mt-3 space-y-2 text-sm text-stone-700">
                <p>{contact?.company_name || contact?.full_name || 'No name stored yet'}</p>
                <p>{contact?.email || 'No email stored yet'}</p>
                <p>{contact?.phone || 'No phone stored yet'}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium text-stone-900">Take action</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Approve the right quote or tell the team when you need more detail or a callback.
              </p>

              <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-sm font-medium text-stone-900">Approve quote</p>

                <label className="mt-3 block text-sm">
                  <span className="mb-2 block font-medium text-stone-700">Maintenance request</span>
                  <select
                    value={selectedApprovalRequestId !== null ? String(selectedApprovalRequestId) : ''}
                    onChange={(event) => setApprovalRequestId(Number.parseInt(event.target.value, 10))}
                    disabled={!approvalRequests.length || actionLoading !== null}
                    className="app-field text-sm outline-none disabled:opacity-60"
                  >
                    {approvalRequests.map((item) => {
                      const linkedCase = cases.find((entry) => entry.id === item.case_id)

                      return (
                        <option key={item.id} value={item.id}>
                          {linkedCase?.case_number || `Request ${item.id}`}{item.issue_type ? ` • ${item.issue_type}` : ''}
                        </option>
                      )
                    })}
                    {!approvalRequests.length && <option value="">No quotes awaiting approval</option>}
                  </select>
                </label>

                <label className="mt-3 block text-sm">
                  <span className="mb-2 block font-medium text-stone-700">Quote</span>
                  <select
                    value={selectedApprovalQuoteId}
                    onChange={(event) => setApprovalQuoteId(event.target.value)}
                    disabled={!approvalQuotes.length || actionLoading !== null}
                    className="app-field text-sm outline-none disabled:opacity-60"
                  >
                    {approvalQuotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {formatMoney(quote.quote_amount)}{quote.submitted_at ? ` • ${formatDate(quote.submitted_at)}` : ''}
                      </option>
                    ))}
                    {!approvalQuotes.length && <option value="">No quote available</option>}
                  </select>
                </label>

                <label className="mt-3 block text-sm">
                  <span className="mb-2 block font-medium text-stone-700">Approval note (optional)</span>
                  <textarea
                    value={approvalNote}
                    onChange={(event) => setApprovalNote(event.target.value)}
                    rows={3}
                    disabled={!selectedApprovalQuote || actionLoading !== null}
                    placeholder="Add any instruction the team should keep with this approval"
                    className="app-field min-h-[96px] resize-none text-sm outline-none disabled:opacity-60"
                  />
                </label>

                {selectedApprovalRequest && (
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    {selectedApprovalRequest.issue_type || 'Maintenance request'} at{' '}
                    {propertyLabel(properties.find((entry) => entry.id === selectedApprovalRequest.property_id) || null)}
                  </p>
                )}

                {selectedApprovalQuote?.quote_notes && (
                  <div className="app-card-muted mt-3 rounded-2xl px-4 py-3 text-sm text-stone-700">
                    {selectedApprovalQuote.quote_notes}
                  </div>
                )}

                {selectedApprovalQuote?.file_url && (
                  <Link
                    href={selectedApprovalQuote.file_url}
                    target="_blank"
                    className="mt-3 inline-flex text-sm font-medium text-stone-700 underline-offset-4 hover:underline"
                  >
                    Open quote file
                  </Link>
                )}

                <button
                  onClick={() => void submitLandlordQuoteApproval()}
                  disabled={!selectedApprovalQuote || actionLoading !== null}
                  className="app-primary-button mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                >
                  {actionLoading === 'approve_quote' ? 'Approving quote...' : 'Approve quote'}
                </button>
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-sm font-medium text-stone-900">Message the team</p>

                <label className="mt-3 block text-sm">
                  <span className="mb-2 block font-medium text-stone-700">Case</span>
                  <select
                    value={selectedCaseActionId}
                    onChange={(event) => setCaseActionId(event.target.value)}
                    disabled={!openCases.length || actionLoading !== null}
                    className="app-field text-sm outline-none disabled:opacity-60"
                  >
                    {openCases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.case_number || 'Case'}{item.summary ? ` • ${item.summary}` : ''}
                      </option>
                    ))}
                    {!openCases.length && <option value="">No open case available</option>}
                  </select>
                </label>

                <label className="mt-3 block text-sm">
                  <span className="mb-2 block font-medium text-stone-700">Your message</span>
                  <textarea
                    value={signalNote}
                    onChange={(event) => setSignalNote(event.target.value)}
                    rows={3}
                    disabled={!actionCase || actionLoading !== null}
                    placeholder="Write a message for the team"
                    className="app-field min-h-[96px] resize-none text-sm outline-none disabled:opacity-60"
                  />
                </label>

                <button
                  onClick={() => void submitLandlordMessage()}
                  disabled={!actionCase || actionLoading !== null}
                  className="app-primary-button mt-4 w-full rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                >
                  {actionLoading === 'send_message' ? 'Sending message...' : 'Send message'}
                </button>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => void submitLandlordSignal('need_more_detail')}
                    disabled={!actionCase || actionLoading !== null}
                    className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                  >
                    {actionLoading === 'need_more_detail' ? 'Sending...' : 'Need more detail'}
                  </button>

                  <button
                    onClick={() => void submitLandlordSignal('request_callback')}
                    disabled={!actionCase || actionLoading !== null}
                    className="app-secondary-button rounded-2xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                  >
                    {actionLoading === 'request_callback' ? 'Sending...' : 'Request callback'}
                  </button>
                </div>

                {actionCase && (
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    Updating {actionCase.case_number || 'the selected case'}
                  </p>
                )}
              </div>

              {actionMessage && (
                <div className="app-card-muted mt-3 rounded-2xl px-4 py-3 text-sm text-stone-700">
                  {actionMessage}
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              <p className="font-medium">Live feed reminder</p>
              <p className="mt-2 leading-6 text-sky-900/80">
                Cases, maintenance, compliance, and viewing activity refresh here as the team updates them.
              </p>
            </div>

            {properties.slice(0, 3).map((property) => (
              <div key={property.id} className="mt-4 rounded-[1.5rem] border border-stone-200 bg-white p-4">
                <p className="text-sm font-medium text-stone-900">{property.address_line_1}</p>
                <p className="mt-1 text-sm text-stone-600">{propertyLabel(property)}</p>
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
