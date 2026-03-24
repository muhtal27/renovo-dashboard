'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { OperatorLayout } from '@/app/operator-layout'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import {
  buildDashboardSearchEntries,
  buildInboxThreads,
  deriveDisputeRecords,
  deriveInventoryRecords,
  getCaseHref,
  getCaseNumber,
  getOpenCases,
  isAwaitingReview,
  isEvidencePending,
} from '@/lib/end-of-tenancy/operations'
import type {
  CaseCommunicationRecord,
  EndOfTenancyCaseListItem,
} from '@/lib/end-of-tenancy/types'

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return 'No recent activity'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="rounded-[1.6rem] border border-stone-200 bg-white px-5 py-5">
      <p className="app-kicker">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{value}</p>
      <p className="mt-2 text-sm text-stone-500">{detail}</p>
    </article>
  )
}

function QueueShell({
  label,
  title,
  body,
  href,
  hrefLabel,
  children,
}: {
  label: string
  title: string
  body: string
  href: string
  hrefLabel: string
  children: ReactNode
}) {
  return (
    <section className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker">{label}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{body}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
        >
          {hrefLabel}
        </Link>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function EotDashboardPage({
  initialItems,
  initialCommunications,
}: {
  initialItems?: EndOfTenancyCaseListItem[]
  initialCommunications?: CaseCommunicationRecord[]
}) {
  const [itemsState, setItemsState] = useState<EndOfTenancyCaseListItem[]>(initialItems ?? [])
  const [communicationsState, setCommunicationsState] = useState<CaseCommunicationRecord[]>(
    initialCommunications ?? []
  )
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const items = useMemo(() => itemsState, [itemsState])
  const communications = useMemo(() => communicationsState, [communicationsState])
  const openItems = useMemo(() => getOpenCases(items), [items])
  const disputes = useMemo(() => deriveDisputeRecords(items), [items])
  const inventories = useMemo(() => deriveInventoryRecords(items), [items])
  const inboxThreads = useMemo(
    () => buildInboxThreads(items, communications),
    [communications, items]
  )
  const searchEntries = useMemo(() => buildDashboardSearchEntries(openItems), [openItems])
  const [query, setQuery] = useState('')

  const filteredSearchEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return searchEntries.slice(0, 8)
    }

    return searchEntries
      .filter((entry) => entry.searchText.includes(normalizedQuery))
      .slice(0, 8)
  }, [query, searchEntries])

  const activeCases = openItems.length
  const awaitingReview = openItems.filter((item) => isAwaitingReview(item)).length
  const openDisputes = disputes.filter((item) => item.status !== 'Resolved').length
  const trackedInventories = inventories.length
  const unreadMessages = communications.filter((item) => item.unread).length

  const caseQueue = useMemo(
    () =>
      [...openItems]
        .sort((left, right) =>
          (right.case?.last_activity_at || right.case?.updated_at || right.endOfTenancyCase.updated_at).localeCompare(
            left.case?.last_activity_at || left.case?.updated_at || left.endOfTenancyCase.updated_at
          )
        )
        .slice(0, 6),
    [openItems]
  )

  const disputeQueue = useMemo(
    () =>
      [...disputes]
        .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''))
        .slice(0, 6),
    [disputes]
  )

  const inventoryQueue = useMemo(
    () =>
      [...inventories]
        .sort((left, right) => (right.updatedAt || '').localeCompare(left.updatedAt || ''))
        .slice(0, 6),
    [inventories]
  )

  const loadDashboard = useCallback(async () => {
    try {
      const response = await endOfTenancyApiRequest<{
        ok: boolean
        items: EndOfTenancyCaseListItem[]
        communications: CaseCommunicationRecord[]
      }>('/api/eot/dashboard?limit=250')

      setItemsState(response.items ?? [])
      setCommunicationsState(response.communications ?? [])
      setRefreshError(null)
    } catch (error) {
      setRefreshError(
        error instanceof Error ? error.message : 'Unable to refresh dashboard data right now.'
      )
    }
  }, [])

  useEffect(() => {
    const bootstrapId = window.setTimeout(() => {
      void loadDashboard()
    }, 0)

    const intervalId = window.setInterval(() => {
      void loadDashboard()
    }, 30000)

    return () => {
      window.clearTimeout(bootstrapId)
      window.clearInterval(intervalId)
    }
  }, [loadDashboard])

  return (
    <OperatorLayout
      pageTitle="Dashboard"
      pageDescription="Run end-of-tenancy operations from one workspace: search a case fast, review what is blocked, and move disputes, inventories, and communication forward without jumping between screens."
    >
      {refreshError ? (
        <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          {refreshError}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-5 md:grid-cols-2">
        <SummaryMetric
          label="Active cases"
          value={String(activeCases)}
          detail="Live end-of-tenancy workflows in progress."
        />
        <SummaryMetric
          label="Awaiting review"
          value={String(awaitingReview)}
          detail="Manager sign-off needed before claim output."
        />
        <SummaryMetric
          label="Open disputes"
          value={String(openDisputes)}
          detail="Separate dispute handling needs attention."
        />
        <SummaryMetric
          label="Inventories"
          value={String(trackedInventories)}
          detail="Check-in and check-out files linked to live cases."
        />
        <SummaryMetric
          label="Unread messages"
          value={String(unreadMessages)}
          detail="Inbound updates and unread case notes."
        />
      </section>

      <section className="app-surface rounded-[2.25rem] px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="app-kicker">Operations workspace</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Find the case, dispute, inventory, or thread you need
          </h2>
          <p className="mt-4 text-sm leading-6 text-stone-600 md:text-base">
            Search by case ID, property address, tenant, landlord, dispute reference, or inventory
            reference. This is the fastest way into live work.
          </p>
          <label className="mt-8 block">
            <span className="sr-only">Global search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cases, disputes, inventories, landlords, or tenants"
              className="app-field mx-auto block w-full max-w-3xl rounded-full border border-stone-300 bg-white px-6 py-4 text-center text-base text-stone-800 placeholder:text-stone-400 md:text-lg"
            />
          </label>
        </div>

        <div className="mt-8 grid gap-3">
          {filteredSearchEntries.map((entry) => (
            <Link
              key={entry.id}
              href={entry.href}
              className="flex flex-col gap-2 rounded-[1.4rem] border border-stone-200 bg-white px-5 py-4 text-left transition hover:border-stone-300 hover:bg-stone-50 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-stone-900">{entry.title}</p>
                <p className="mt-1 text-sm text-stone-500">{entry.subtitle}</p>
              </div>
              <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium capitalize text-stone-600">
                {entry.type}
              </span>
            </Link>
          ))}
          {query.trim().length > 0 && filteredSearchEntries.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center">
              <p className="text-sm font-medium text-stone-700">No matching operational records</p>
              <p className="mt-2 text-sm text-stone-500">
                Try a case reference, part of the address, or the tenant or landlord name.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <QueueShell
        label="Cases"
        title="Live case queue"
        body="Prioritise active end-of-tenancy cases that are waiting on evidence, manager judgement, or claim preparation."
        href="/cases"
        hrefLabel="Open cases queue"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                <th className="px-3 py-2">Case</th>
                <th className="px-3 py-2">Property</th>
                <th className="px-3 py-2">Current work</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {caseQueue.map((item) => (
                <tr key={item.endOfTenancyCase.id}>
                  <td className="rounded-l-[1.4rem] border border-r-0 border-stone-200 bg-white px-3 py-4">
                    <p className="text-sm font-semibold text-stone-900">{getCaseNumber(item)}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {item.tenant?.full_name || 'Unknown tenant'} / {item.landlord?.full_name || 'Unknown landlord'}
                    </p>
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {item.property?.address_line_1 || 'Unknown property'}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                    {isAwaitingReview(item)
                      ? 'Awaiting manager review'
                      : isEvidencePending(item)
                        ? 'Evidence still being assembled'
                        : 'Operational review in progress'}
                  </td>
                  <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-500">
                    {formatRelativeTime(
                      item.case?.last_activity_at || item.case?.updated_at || item.endOfTenancyCase.updated_at
                    )}
                  </td>
                  <td className="rounded-r-[1.4rem] border border-stone-200 bg-white px-3 py-4 text-right">
                    <Link
                      href={getCaseHref(item)}
                      className="inline-flex rounded-full border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
                    >
                      Open case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueueShell>

      <div className="grid gap-6 xl:grid-cols-2">
        <QueueShell
          label="Disputes"
          title="Distinct dispute workflow"
          body="Keep dispute handling separate from general case review so evidence gaps and response deadlines are visible."
          href="/disputes"
          hrefLabel="Open disputes"
        >
          <div className="space-y-3">
            {disputeQueue.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {item.caseNumber} · {item.propertyAddress}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      {item.schemeReference || 'No scheme reference recorded'}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                    {item.status}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </QueueShell>

        <QueueShell
          label="Inventories"
          title="Upstream evidence and report review"
          body="Track check-in and check-out coverage before cases move into stronger issue assessment or dispute handling."
          href="/inventories"
          hrefLabel="Open inventories"
        >
          <div className="space-y-3">
            {inventoryQueue.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {item.caseNumber} · {item.propertyAddress}
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Check-in {item.checkInCount} · Check-out {item.checkOutCount} · Photos {item.photoCount}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                    {item.missingEvidence.length > 0
                      ? item.missingEvidence.join(', ')
                      : item.pendingReview
                        ? 'Pending inventory review'
                        : 'Linked and ready'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </QueueShell>
      </div>

      <QueueShell
        label="Inbox"
        title="Communication tied to the case record"
        body="Unread updates, outbound messages, and staff notes stay attached to each case so nothing is lost outside the workflow."
        href="/inbox"
        hrefLabel="Open inbox"
      >
        <div className="space-y-3">
          {inboxThreads.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center">
              <p className="text-sm font-medium text-stone-700">No case communication recorded yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Communication started inside a case will appear here with unread state and audit-friendly timestamps.
              </p>
            </div>
          ) : (
            inboxThreads.slice(0, 6).map((thread) => (
              <Link
                key={thread.caseId}
                href={`/cases/${thread.caseId}#communication`}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 transition hover:border-stone-300 hover:bg-stone-50 md:flex-row md:items-start md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {thread.caseNumber} · {thread.propertyAddress}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{thread.latestPreview}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-stone-400">
                    {thread.latestMessageType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {thread.unreadCount > 0 ? (
                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                      {thread.unreadCount} unread
                    </span>
                  ) : null}
                  <span className="text-xs text-stone-500">
                    {formatRelativeTime(thread.latestMessageAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </QueueShell>
    </OperatorLayout>
  )
}
