'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useOperatorGate } from '@/lib/use-operator-gate'
import { OperatorNav } from '@/app/operator-nav'
import { OperatorSessionState } from '@/app/operator-session-state'

type RentTab = 'all' | 'active' | 'overdue' | 'balance'

type ContactRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
}

type PropertyRow = {
  id: string
  address_line_1: string
  address_line_2: string | null
  city: string | null
  postcode: string | null
}

type TenancyRow = {
  id: string
  property_id: string | null
  tenant_contact_id: string | null
  landlord_contact_id: string | null
  status: string | null
  tenancy_status: string | null
  start_date: string | null
  end_date: string | null
  rent_amount: number | string | null
  deposit_amount: number | string | null
  updated_at: string | null
}

type RentEntryRow = {
  id: string
  tenancy_id: string
  property_id: string | null
  case_id: string | null
  contact_id: string | null
  entry_type: 'charge' | 'payment' | 'credit' | 'adjustment'
  category: string
  status: 'open' | 'cleared' | 'void'
  amount: number | string
  due_date: string | null
  period_start: string | null
  period_end: string | null
  posted_at: string | null
  reference: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

type CaseRow = {
  id: string
  case_number: string | null
  tenancy_id: string | null
  property_id: string | null
  case_type: string | null
  summary: string | null
  status: string | null
  priority: string | null
  updated_at: string | null
}

type TenancyLedgerStats = {
  charges: number
  credits: number
  balance: number
  overdue: number
  collectedThisMonth: number
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return 0
}

function formatMoney(value: number | string | null | undefined) {
  const amount = toNumber(value)
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'No recent activity'
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

function formatLabel(value: string | null) {
  if (!value) return 'Unknown'
  return value.replace(/_/g, ' ')
}

function getContactName(contact: ContactRow | null) {
  if (!contact) return 'Unknown'
  return contact.full_name?.trim() || contact.company_name?.trim() || contact.email || contact.phone || 'Unknown'
}

function buildAddress(property: PropertyRow | null) {
  if (!property) return 'Unknown property'
  return [property.address_line_1, property.address_line_2, property.city, property.postcode]
    .filter(Boolean)
    .join(', ')
}

function isActiveTenancy(tenancy: TenancyRow) {
  return tenancy.tenancy_status === 'active' || tenancy.status === 'active'
}

function isCurrentMonth(value: string | null) {
  if (!value) return false
  const target = new Date(value)
  const now = new Date()
  return target.getUTCFullYear() === now.getUTCFullYear() && target.getUTCMonth() === now.getUTCMonth()
}

function getEntryTone(entry: RentEntryRow) {
  if (entry.status === 'void') return 'border-stone-200 bg-stone-100 text-stone-600'
  if (entry.entry_type === 'payment' || entry.entry_type === 'credit') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (entry.status === 'cleared') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (entry.due_date && new Date(entry.due_date) < new Date()) return 'border-red-200 bg-red-50 text-red-700'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

export default function RentWorkspacePage() {
  const { operator, authLoading, authError } = useOperatorGate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [savingEntry, setSavingEntry] = useState(false)
  const [updatingEntryId, setUpdatingEntryId] = useState<string | null>(null)

  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [tenancies, setTenancies] = useState<TenancyRow[]>([])
  const [entries, setEntries] = useState<RentEntryRow[]>([])
  const [cases, setCases] = useState<CaseRow[]>([])

  const [tab, setTab] = useState<RentTab>('all')
  const [search, setSearch] = useState('')
  const [selectedTenancyId, setSelectedTenancyId] = useState<string | null>(null)
  const [entryType, setEntryType] = useState<RentEntryRow['entry_type']>('payment')
  const [category, setCategory] = useState('rent')
  const [amountInput, setAmountInput] = useState('')
  const [dueDateInput, setDueDateInput] = useState('')
  const [referenceInput, setReferenceInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState('')

  const operatorUserId = operator?.authUser?.id ?? null
  const pageError = authError ?? error

  const loadWorkspace = useEffectEvent(async () => {
    if (!operatorUserId) return
    setLoading(true)
    setError(null)

    const [contactsResponse, propertiesResponse, tenanciesResponse, entriesResponse, casesResponse] =
      await Promise.all([
        supabase.from('contacts').select('id, full_name, email, phone, company_name').order('updated_at', { ascending: false }),
        supabase
          .from('properties')
          .select('id, address_line_1, address_line_2, city, postcode')
          .order('updated_at', { ascending: false }),
        supabase
          .from('tenancies')
          .select('id, property_id, tenant_contact_id, landlord_contact_id, status, tenancy_status, start_date, end_date, rent_amount, deposit_amount, updated_at')
          .order('updated_at', { ascending: false }),
        supabase
          .from('rent_ledger_entries')
          .select('id, tenancy_id, property_id, case_id, contact_id, entry_type, category, status, amount, due_date, period_start, period_end, posted_at, reference, notes, created_at, updated_at')
          .order('posted_at', { ascending: false })
          .limit(1200),
        supabase
          .from('cases')
          .select('id, case_number, tenancy_id, property_id, case_type, summary, status, priority, updated_at')
          .order('updated_at', { ascending: false })
          .limit(800),
      ])

    const firstError = [
      contactsResponse.error,
      propertiesResponse.error,
      tenanciesResponse.error,
      entriesResponse.error,
      casesResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setContacts((contactsResponse.data || []) as ContactRow[])
    setProperties((propertiesResponse.data || []) as PropertyRow[])
    setTenancies((tenanciesResponse.data || []) as TenancyRow[])
    setEntries((entriesResponse.data || []) as RentEntryRow[])
    setCases((casesResponse.data || []) as CaseRow[])
    setLoading(false)
  })

  useEffect(() => {
    if (!operatorUserId || authError) return
    void loadWorkspace()
  }, [authError, operatorUserId])

  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts])
  const propertyById = useMemo(() => new Map(properties.map((property) => [property.id, property])), [properties])

  const entriesByTenancyId = useMemo(() => {
    const map = new Map<string, RentEntryRow[]>()
    for (const entry of entries) {
      const existing = map.get(entry.tenancy_id) ?? []
      existing.push(entry)
      map.set(entry.tenancy_id, existing)
    }
    return map
  }, [entries])

  const statsByTenancyId = useMemo(() => {
    const map = new Map<string, TenancyLedgerStats>()

    for (const tenancy of tenancies) {
      map.set(tenancy.id, {
        charges: 0,
        credits: 0,
        balance: 0,
        overdue: 0,
        collectedThisMonth: 0,
      })
    }

    for (const entry of entries) {
      const next = map.get(entry.tenancy_id) ?? {
        charges: 0,
        credits: 0,
        balance: 0,
        overdue: 0,
        collectedThisMonth: 0,
      }
      const amount = toNumber(entry.amount)
      const isVoid = entry.status === 'void'
      const isOverdueCharge =
        !isVoid &&
        entry.entry_type !== 'payment' &&
        entry.entry_type !== 'credit' &&
        entry.status === 'open' &&
        !!entry.due_date &&
        new Date(entry.due_date) < new Date()

      if (!isVoid && (entry.entry_type === 'charge' || entry.entry_type === 'adjustment')) {
        next.charges += amount
        next.balance += amount
      }

      if (!isVoid && (entry.entry_type === 'payment' || entry.entry_type === 'credit')) {
        next.credits += amount
        next.balance -= amount
        if (isCurrentMonth(entry.posted_at)) {
          next.collectedThisMonth += amount
        }
      }

      if (isOverdueCharge) {
        next.overdue += amount
      }

      map.set(entry.tenancy_id, next)
    }

    return map
  }, [entries, tenancies])

  const filteredTenancies = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tenancies.filter((tenancy) => {
      const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
      const landlord = tenancy.landlord_contact_id ? contactById.get(tenancy.landlord_contact_id) ?? null : null
      const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
      const stats = statsByTenancyId.get(tenancy.id) ?? {
        charges: 0,
        credits: 0,
        balance: 0,
        overdue: 0,
        collectedThisMonth: 0,
      }

      const matchesSearch =
        query === '' ||
        getContactName(tenant).toLowerCase().includes(query) ||
        getContactName(landlord).toLowerCase().includes(query) ||
        buildAddress(property).toLowerCase().includes(query) ||
        property?.postcode?.toLowerCase().includes(query)

      const matchesTab =
        tab === 'all' ||
        (tab === 'active' && isActiveTenancy(tenancy)) ||
        (tab === 'overdue' && stats.overdue > 0) ||
        (tab === 'balance' && stats.balance > 0)

      return matchesSearch && matchesTab
    })
  }, [contactById, propertyById, search, statsByTenancyId, tab, tenancies])

  useEffect(() => {
    if (!filteredTenancies.length) {
      setSelectedTenancyId(null)
      return
    }

    if (!selectedTenancyId || !filteredTenancies.some((tenancy) => tenancy.id === selectedTenancyId)) {
      setSelectedTenancyId(filteredTenancies[0].id)
    }
  }, [filteredTenancies, selectedTenancyId])

  const selectedTenancy = useMemo(
    () => tenancies.find((tenancy) => tenancy.id === selectedTenancyId) || null,
    [selectedTenancyId, tenancies]
  )

  const selectedTenant = useMemo(
    () => (selectedTenancy?.tenant_contact_id ? contactById.get(selectedTenancy.tenant_contact_id) ?? null : null),
    [contactById, selectedTenancy?.tenant_contact_id]
  )

  const selectedLandlord = useMemo(
    () => (selectedTenancy?.landlord_contact_id ? contactById.get(selectedTenancy.landlord_contact_id) ?? null : null),
    [contactById, selectedTenancy?.landlord_contact_id]
  )

  const selectedProperty = useMemo(
    () => (selectedTenancy?.property_id ? propertyById.get(selectedTenancy.property_id) ?? null : null),
    [propertyById, selectedTenancy?.property_id]
  )

  const selectedEntries = useMemo(() => {
    if (!selectedTenancy) return []
    return [...(entriesByTenancyId.get(selectedTenancy.id) ?? [])].sort((left, right) => {
      const leftTime = new Date(left.due_date || left.posted_at || left.created_at || 0).getTime()
      const rightTime = new Date(right.due_date || right.posted_at || right.created_at || 0).getTime()
      return rightTime - leftTime
    })
  }, [entriesByTenancyId, selectedTenancy])

  const selectedCases = useMemo(() => {
    if (!selectedTenancy) return []
    return cases.filter(
      (caseItem) => caseItem.tenancy_id === selectedTenancy.id || caseItem.property_id === selectedTenancy.property_id
    )
  }, [cases, selectedTenancy])

  useEffect(() => {
    if (!selectedCases.length) {
      setSelectedCaseId('')
      return
    }

    if (selectedCaseId && selectedCases.some((caseItem) => caseItem.id === selectedCaseId)) {
      return
    }

    const rentCase = selectedCases.find(
      (caseItem) => caseItem.case_type === 'rent' || caseItem.case_type === 'tenancy_admin'
    )
    setSelectedCaseId(rentCase?.id || selectedCases[0]?.id || '')
  }, [selectedCaseId, selectedCases])

  const selectedStats = useMemo(
    () =>
      (selectedTenancy && statsByTenancyId.get(selectedTenancy.id)) || {
        charges: 0,
        credits: 0,
        balance: 0,
        overdue: 0,
        collectedThisMonth: 0,
      },
    [selectedTenancy, statsByTenancyId]
  )

  const kpis = useMemo(() => {
    const activeTenancies = tenancies.filter((tenancy) => isActiveTenancy(tenancy))
    const monthlyContractedRent = activeTenancies.reduce((sum, tenancy) => sum + toNumber(tenancy.rent_amount), 0)
    const outstandingBalance = Array.from(statsByTenancyId.values()).reduce(
      (sum, stats) => sum + Math.max(stats.balance, 0),
      0
    )
    const overdueBalance = Array.from(statsByTenancyId.values()).reduce((sum, stats) => sum + stats.overdue, 0)
    const collectedThisMonth = Array.from(statsByTenancyId.values()).reduce(
      (sum, stats) => sum + stats.collectedThisMonth,
      0
    )

    return {
      activeTenancies: activeTenancies.length,
      monthlyContractedRent,
      outstandingBalance,
      overdueBalance,
      collectedThisMonth,
    }
  }, [statsByTenancyId, tenancies])

  async function handleCreateEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTenancy) return

    const amount = Number(amountInput)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionMessage('Enter a valid amount before adding a ledger item.')
      return
    }

    setSavingEntry(true)
    setActionMessage(null)

    const payload = {
      tenancy_id: selectedTenancy.id,
      case_id: selectedCaseId || null,
      entry_type: entryType,
      category,
      status: entryType === 'payment' || entryType === 'credit' ? 'cleared' : 'open',
      amount,
      due_date: dueDateInput || null,
      reference: referenceInput.trim() || null,
      notes: notesInput.trim() || null,
      period_start: entryType === 'charge' ? dueDateInput || null : null,
      period_end: entryType === 'charge' ? dueDateInput || null : null,
    }

    const { data, error: insertError } = await supabase
      .from('rent_ledger_entries')
      .insert(payload)
      .select('id, tenancy_id, property_id, case_id, contact_id, entry_type, category, status, amount, due_date, period_start, period_end, posted_at, reference, notes, created_at, updated_at')
      .single()

    if (insertError) {
      setActionMessage(`Error: ${insertError.message}`)
      setSavingEntry(false)
      return
    }

    setEntries((current) => [data as RentEntryRow, ...current])
    setAmountInput('')
    setDueDateInput('')
    setReferenceInput('')
    setNotesInput('')
    setActionMessage('Ledger item added.')
    setSavingEntry(false)
  }

  async function handleSetEntryStatus(entryId: string, status: RentEntryRow['status']) {
    setUpdatingEntryId(entryId)
    setActionMessage(null)

    const { data, error: updateError } = await supabase
      .from('rent_ledger_entries')
      .update({ status })
      .eq('id', entryId)
      .select('id, tenancy_id, property_id, case_id, contact_id, entry_type, category, status, amount, due_date, period_start, period_end, posted_at, reference, notes, created_at, updated_at')
      .single()

    if (updateError) {
      setActionMessage(`Error: ${updateError.message}`)
      setUpdatingEntryId(null)
      return
    }

    setEntries((current) => current.map((entry) => (entry.id === entryId ? (data as RentEntryRow) : entry)))
    setUpdatingEntryId(null)
    setActionMessage('Ledger status updated.')
  }

  if (authLoading || !operator?.authUser) {
    return <OperatorSessionState authLoading={authLoading} operator={operator} />
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav current="rent" />

        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div>
            <p className="app-kicker">Accounts</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Accounts, ledger, and arrears in one place
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">
              Book charges and payments against the tenancy, keep arrears visible, and tie money work back to the right case when needed.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {[
                  ['Active tenancies', kpis.activeTenancies, 'border-emerald-200 bg-emerald-50 text-emerald-900'],
                  ['Contracted monthly', formatMoney(kpis.monthlyContractedRent), 'border-sky-200 bg-sky-50 text-sky-900'],
                  ['Collected this month', formatMoney(kpis.collectedThisMonth), 'border-teal-200 bg-teal-50 text-teal-900'],
                  ['Outstanding', formatMoney(kpis.outstandingBalance), 'border-amber-200 bg-amber-50 text-amber-900'],
                  ['Overdue', formatMoney(kpis.overdueBalance), 'border-rose-200 bg-rose-50 text-rose-900'],
                ].map(([label, value, tone]) => (
                  <article key={String(label)} className={`rounded-[1.6rem] border p-4 shadow-sm ${tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">{label}</div>
                    <div className="mt-3 text-3xl font-semibold">{value}</div>
                  </article>
                ))}
              </div>
            </div>

          <div className="mt-4 rounded-[1.25rem] border border-stone-200 bg-white/85 px-4 py-3 text-sm leading-6 text-stone-600">
              Book the money against the tenancy, link arrears to a live case when needed, and work overdue balances first.
            </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Accounts tabs</p>
                <h2 className="mt-2 text-2xl font-semibold">Focus on active ledgers, overdue rent, or positive balances</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredTenancies.length} shown of {tenancies.length} tenancies
              </div>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3" aria-label="Accounts workspace tabs">
              {[
                ['all', 'All ledgers'],
                ['active', 'Active'],
                ['overdue', 'Overdue'],
                ['balance', 'Positive balance'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value as RentTab)}
                  aria-pressed={tab === value}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium ${tab === value ? 'app-pill-active' : 'app-pill'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-medium text-stone-700">Search accounts ledger</span>
              <input
                type="text"
                placeholder="Search by tenant, landlord, property, or postcode"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>
          </div>
        </section>

        {loading && <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">Loading accounts workspace...</div>}

        {pageError && <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">Error: {pageError}</div>}
        {actionMessage && <div className="mt-6 rounded-[1.8rem] border border-sky-200 bg-sky-50/95 p-6 text-sm text-sky-800">{actionMessage}</div>}

        {!loading && !pageError && (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,440px)_minmax(0,1fr)] xl:items-start">
            <section className="app-surface rounded-[2rem] p-4 md:p-5 xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-3rem)] xl:flex-col">
              <div className="mb-4 rounded-[1.5rem] border border-stone-200 bg-white/90 p-4 backdrop-blur">
                <p className="app-kicker">Rent ledgers</p>
                <h2 className="mt-2 text-xl font-semibold">Choose a tenancy ledger</h2>
                <p className="mt-1 text-sm text-stone-600">See contracted rent, live balance, overdue exposure, and booked entries.</p>
              </div>

              <div className="space-y-3 pr-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pb-6">
                {filteredTenancies.map((tenancy) => {
                  const selected = tenancy.id === selectedTenancyId
                  const tenant = tenancy.tenant_contact_id ? contactById.get(tenancy.tenant_contact_id) ?? null : null
                  const property = tenancy.property_id ? propertyById.get(tenancy.property_id) ?? null : null
                  const stats = statsByTenancyId.get(tenancy.id) ?? {
                    charges: 0,
                    credits: 0,
                    balance: 0,
                    overdue: 0,
                    collectedThisMonth: 0,
                  }

                  return (
                    <button
                      key={tenancy.id}
                      onClick={() => setSelectedTenancyId(tenancy.id)}
                      aria-pressed={selected}
                      className={`w-full rounded-[1.6rem] border p-4 text-left ${selected ? 'app-selected-card' : 'border-stone-200 bg-white hover:border-stone-400 hover:bg-stone-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold">{getContactName(tenant)}</span>
                            <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700">
                              {tenancy.tenancy_status || tenancy.status || 'tenancy'}
                            </span>
                            {stats.overdue > 0 && (
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                                Overdue {formatMoney(stats.overdue)}
                              </span>
                            )}
                          </div>
                          <p className={`mt-2 text-sm leading-6 ${selected ? 'text-stone-700' : 'text-stone-600'}`}>{buildAddress(property)}</p>
                        </div>
                        <div className={`text-right text-xs ${selected ? 'text-stone-600' : 'text-stone-500'}`}>
                          <div>Balance</div>
                          <div className="mt-1 font-medium text-stone-800">{formatMoney(stats.balance)}</div>
                        </div>
                      </div>

                      <div className={`mt-3 flex flex-wrap gap-2 text-xs ${selected ? 'text-stone-700' : 'text-stone-600'}`}>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">Rent {formatMoney(tenancy.rent_amount)}</span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">Booked {entriesByTenancyId.get(tenancy.id)?.length || 0} items</span>
                        <span className="rounded-full border border-current/15 px-2.5 py-1">Updated {formatRelativeTime(tenancy.updated_at)}</span>
                      </div>
                    </button>
                  )
                })}

                {filteredTenancies.length === 0 && <div className="app-empty-state rounded-[1.6rem] p-6 text-sm">No rent ledgers match the current filters yet.</div>}
              </div>
            </section>

            <section className="app-surface self-start rounded-[2rem] p-5 md:p-6 xl:sticky xl:top-6">
              {!selectedTenancy ? (
                <div className="app-empty-state flex min-h-[60vh] items-center justify-center rounded-[1.6rem] p-10 text-center">
                  Choose a tenancy from the left to inspect rent, balance, and accounting activity.
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 border-b app-divider pb-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <p className="app-kicker">Selected ledger</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-semibold">{getContactName(selectedTenant)}</h2>
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                          {selectedTenancy.tenancy_status || selectedTenancy.status || 'tenancy'}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                        {buildAddress(selectedProperty)}. Landlord: {getContactName(selectedLandlord)}.
                      </p>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Contracted rent</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedTenancy.rent_amount)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Booked charges</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedStats.charges)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Received or credited</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedStats.credits)}</p>
                        </div>
                        <div className="app-card-muted rounded-[1.4rem] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Live balance</p>
                          <p className="mt-2 text-sm text-stone-800">{formatMoney(selectedStats.balance)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Arrears posture</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">{formatMoney(selectedStats.overdue)}</p>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          Overdue open charges on this tenancy. Use a linked rent or tenancy case if follow-up is already active.
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Related case</p>
                        <select
                          value={selectedCaseId}
                          onChange={(event) => setSelectedCaseId(event.target.value)}
                          className="app-field mt-3 text-sm outline-none"
                        >
                          <option value="">No linked case</option>
                          {selectedCases.map((caseItem) => (
                            <option key={caseItem.id} value={caseItem.id}>
                              {(caseItem.case_number || caseItem.id).slice(0, 18)} • {formatLabel(caseItem.case_type)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-4">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="app-kicker">Book ledger item</p>
                            <h3 className="mt-2 text-xl font-semibold">Add a charge, payment, credit, or adjustment</h3>
                          </div>
                        </div>

                        <form className="mt-4 space-y-4" onSubmit={handleCreateEntry}>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Entry type</span>
                            <select value={entryType} onChange={(event) => setEntryType(event.target.value as RentEntryRow['entry_type'])} className="app-field text-sm outline-none">
                              <option value="payment">Payment received</option>
                              <option value="charge">Charge due</option>
                              <option value="credit">Credit</option>
                              <option value="adjustment">Adjustment</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Category</span>
                            <select value={category} onChange={(event) => setCategory(event.target.value)} className="app-field text-sm outline-none">
                              <option value="rent">Rent</option>
                              <option value="fee">Fee</option>
                              <option value="maintenance_recharge">Maintenance recharge</option>
                              <option value="deposit_claim">Deposit claim</option>
                              <option value="other">Other</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Amount</span>
                            <input type="number" min="0" step="0.01" value={amountInput} onChange={(event) => setAmountInput(event.target.value)} className="app-field text-sm outline-none" placeholder="0.00" />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Due or posted date</span>
                            <input type="date" value={dueDateInput} onChange={(event) => setDueDateInput(event.target.value)} className="app-field text-sm outline-none" />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Reference</span>
                            <input type="text" value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} className="app-field text-sm outline-none" placeholder="Receipt, bank ref, invoice, or note" />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-700">Notes</span>
                            <textarea value={notesInput} onChange={(event) => setNotesInput(event.target.value)} className="app-field min-h-[120px] text-sm outline-none" placeholder="Operator context for this ledger item" />
                          </label>

                          <button type="submit" disabled={savingEntry} className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium disabled:opacity-60">
                            {savingEntry ? 'Saving ledger item...' : 'Add ledger item'}
                          </button>
                        </form>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <p className="app-kicker">Tenancy snapshot</p>
                        <dl className="mt-4 space-y-3 text-sm text-stone-700">
                          <div className="flex items-start justify-between gap-4">
                            <dt>Tenant</dt>
                            <dd className="text-right font-medium text-stone-900">{getContactName(selectedTenant)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Landlord</dt>
                            <dd className="text-right font-medium text-stone-900">{getContactName(selectedLandlord)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Term</dt>
                            <dd className="text-right font-medium text-stone-900">{formatDate(selectedTenancy.start_date)} to {formatDate(selectedTenancy.end_date)}</dd>
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <dt>Updated</dt>
                            <dd className="text-right font-medium text-stone-900">{formatRelativeTime(selectedTenancy.updated_at)}</dd>
                          </div>
                        </dl>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Ledger entries</p>
                            <h3 className="mt-2 text-xl font-semibold">Booked money movement for this tenancy</h3>
                          </div>
                          <div className="text-sm text-stone-500">{selectedEntries.length} items</div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedEntries.length === 0 && <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No rent ledger items are linked to this tenancy yet.</div>}

                          {selectedEntries.map((entry) => (
                            <article key={entry.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getEntryTone(entry)}`}>
                                      {formatLabel(entry.entry_type)} • {formatLabel(entry.status)}
                                    </span>
                                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                                      {formatLabel(entry.category)}
                                    </span>
                                    <span className="text-sm font-semibold text-stone-900">{formatMoney(entry.amount)}</span>
                                  </div>
                                  <p className="mt-3 text-sm leading-7 text-stone-700">
                                    {entry.reference || 'No reference recorded'}
                                    {entry.notes ? ` • ${entry.notes}` : ''}
                                  </p>
                                  <p className="mt-2 text-xs text-stone-500">
                                    Due {formatDate(entry.due_date)} • Posted {formatDate(entry.posted_at)}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                  {entry.status === 'open' && (
                                    <button
                                      onClick={() => void handleSetEntryStatus(entry.id, 'cleared')}
                                      disabled={updatingEntryId === entry.id}
                                      className="app-secondary-button inline-flex items-center rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60"
                                    >
                                      Mark cleared
                                    </button>
                                  )}
                                  {entry.status === 'cleared' && entry.entry_type !== 'payment' && entry.entry_type !== 'credit' && (
                                    <button
                                      onClick={() => void handleSetEntryStatus(entry.id, 'open')}
                                      disabled={updatingEntryId === entry.id}
                                      className="app-secondary-button inline-flex items-center rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60"
                                    >
                                      Reopen
                                    </button>
                                  )}
                                  {entry.status !== 'void' && (
                                    <button
                                      onClick={() => void handleSetEntryStatus(entry.id, 'void')}
                                      disabled={updatingEntryId === entry.id}
                                      className="app-secondary-button inline-flex items-center rounded-full px-3 py-2 text-xs font-medium disabled:opacity-60"
                                    >
                                      Void
                                    </button>
                                  )}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                      <section className="app-card-muted rounded-[1.6rem] p-5">
                        <div className="flex flex-col gap-2 border-b app-divider pb-4 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="app-kicker">Related cases</p>
                            <h3 className="mt-2 text-xl font-semibold">Tenancy work already connected to this ledger</h3>
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {selectedCases.length === 0 && <div className="app-empty-state rounded-[1.4rem] p-5 text-sm">No cases are linked to this tenancy or property yet.</div>}
                          {selectedCases.slice(0, 6).map((caseItem) => (
                            <article key={caseItem.id} className="rounded-[1.4rem] border border-stone-200 bg-white/90 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link href={`/cases/${caseItem.id}`} className="text-sm font-semibold text-stone-900 underline-offset-4 hover:underline">
                                    {caseItem.case_number || caseItem.id}
                                  </Link>
                                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700">
                                    {formatLabel(caseItem.case_type)}
                                  </span>
                                </div>
                                <span className="text-xs text-stone-500">{formatRelativeTime(caseItem.updated_at)}</span>
                              </div>
                              <p className="mt-3 text-sm leading-7 text-stone-700">{caseItem.summary || 'No case summary yet.'}</p>
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
