'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react'
import { getEotTenancy } from '@/lib/eot-api'
import type { EotTenancyListItem } from '@/lib/eot-types'
import {
  EmptyState,
  MetaItem,
  SkeletonPanel,
  StatusBadge,
  formatAddress,
  formatCurrency,
  formatDate,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'

function getTenancyStatus(tenancy: EotTenancyListItem) {
  if (tenancy.case_status) {
    return { label: formatEnumLabel(tenancy.case_status), tone: tenancy.case_status }
  }

  if (!tenancy.end_date) {
    return { label: 'Active', tone: 'stable' }
  }

  const endDate = new Date(tenancy.end_date)
  const now = new Date()
  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilEnd < 0) {
    return { label: 'Ended', tone: 'draft' }
  }

  if (daysUntilEnd <= 30) {
    return { label: `Ending in ${daysUntilEnd}d`, tone: 'attention' }
  }

  return { label: 'Active', tone: 'stable' }
}

export function TenancyDetailClient({ tenancyId }: { tenancyId: string }) {
  const [tenancy, setTenancy] = useState<EotTenancyListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await getEotTenancy(tenancyId)
        if (!cancelled) {
          setTenancy(data)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load tenancy.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [tenancyId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <SkeletonPanel />
      </div>
    )
  }

  if (error || !tenancy) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <EmptyState title="Unable to load tenancy" body={error ?? 'Tenancy not found.'} />
      </div>
    )
  }

  const status = getTenancyStatus(tenancy)
  const fullAddress = formatAddress([
    tenancy.property.address_line_1,
    tenancy.property.address_line_2,
    tenancy.property.city,
    tenancy.property.postcode,
  ])

  return (
    <div className="space-y-6">
      {/* Back link + header */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-950">{fullAddress}</h2>
            {tenancy.property.reference ? (
              <p className="mt-0.5 text-xs text-zinc-400">
                Ref: {tenancy.property.reference}
              </p>
            ) : null}
          </div>
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Tenant & landlord */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-950">Residents</h3>
            </div>
            <div className="px-5">
              <MetaItem label="Tenant" value={tenancy.tenant_name} />
              <MetaItem
                label="Tenant email"
                value={tenancy.tenant_email ?? <span className="text-zinc-400">Not provided</span>}
              />
              <MetaItem
                label="Landlord"
                value={tenancy.landlord_name ?? <span className="text-zinc-400">Not provided</span>}
                className="border-b-0"
              />
            </div>
          </section>

          {/* Property */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-950">Property</h3>
            </div>
            <div className="px-5">
              <MetaItem label="Address" value={fullAddress} />
              <MetaItem
                label="Property name"
                value={tenancy.property.name}
              />
              <MetaItem
                label="Reference"
                value={tenancy.property.reference ?? <span className="text-zinc-400">None</span>}
                className="border-b-0"
              />
            </div>
          </section>

          {/* Tenancy period */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-950">Tenancy period</h3>
            </div>
            <div className="px-5">
              <MetaItem
                label="Start date"
                value={tenancy.start_date ? formatDate(tenancy.start_date) : <span className="text-zinc-400">Not set</span>}
              />
              <MetaItem
                label="End date"
                value={tenancy.end_date ? formatDate(tenancy.end_date) : <span className="text-zinc-400">Ongoing</span>}
              />
              <MetaItem
                label="Created"
                value={formatDate(tenancy.created_at)}
              />
              <MetaItem
                label="Last updated"
                value={formatDate(tenancy.updated_at)}
                className="border-b-0"
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deposit */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-950">Deposit</h3>
            </div>
            <div className="px-5">
              <MetaItem
                label="Amount"
                value={
                  tenancy.deposit_amount ? (
                    <span className="text-base font-semibold tabular-nums">
                      {formatCurrency(Number(tenancy.deposit_amount))}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Not recorded</span>
                  )
                }
              />
              <MetaItem
                label="Scheme"
                value={tenancy.deposit_scheme ?? <span className="text-zinc-400">Not recorded</span>}
                className="border-b-0"
              />
            </div>
          </section>

          {/* Checkout / Case */}
          <section className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-3">
              <h3 className="text-sm font-semibold text-zinc-950">Checkout</h3>
            </div>
            <div className="px-5 py-4">
              {tenancy.case_id ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-600">Active checkout case</p>
                    <StatusBadge
                      label={formatEnumLabel(tenancy.case_status)}
                      tone={tenancy.case_status ?? 'draft'}
                    />
                  </div>
                  <Link
                    href={`/operator/cases/${tenancy.case_id}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open checkout workspace
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">
                    No checkout case exists for this tenancy yet.
                  </p>
                  <Link
                    href="/tenancies"
                    className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-zinc-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Start checkout
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
