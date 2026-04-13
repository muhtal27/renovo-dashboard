'use client'

import { ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

const kicker = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400'
const card = 'rounded-[10px] border border-zinc-200 bg-white p-5'
const heading = 'text-base font-semibold text-zinc-900'
const value = 'text-sm text-zinc-900'

function computeDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—'
  const s = new Date(start)
  const e = new Date(end)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '—'

  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (e.getDate() < s.getDate()) months -= 1
  if (months < 1) return '< 1 month'
  if (months === 1) return '1 month'
  if (months < 12) return `${months} months`
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (rem === 0) return years === 1 ? '1 year' : `${years} years`
  return `${years}y ${rem}m`
}

export function StepInventory({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const property = data.workspace.property
  const tenancy = data.workspace.tenancy
  const tenants = data.workspace.overview.tenants
  const landlords = data.workspace.overview.landlords
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const depositScheme = data.checkoutCase?.depositScheme
  const monthlyRent = data.workspace.overview.monthlyRent
  const rentArrears = data.workspace.overview.rentArrears

  const address = [
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(', ')

  const region = property.country_code?.toUpperCase() ?? null

  const leadTenant = tenants.find((t) => t.isLead) ?? tenants[0] ?? null
  const leadLandlord = landlords.find((l) => l.isLead) ?? landlords[0] ?? null

  return (
    <div className="space-y-4">
      {/* Property Details */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h3 className={heading}>Property Details</h3>
          {region && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600">
              {region}
            </span>
          )}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <dt className={kicker}>Address</dt>
            <dd className={`mt-1 ${value}`}>{address || '—'}</dd>
          </div>
          <div>
            <dt className={kicker}>Reference</dt>
            <dd className={`mt-1 ${value}`}>{property.reference || '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Tenancy */}
      <div className={card}>
        <h3 className={heading}>Tenancy</h3>
        <dl className="mt-4 grid grid-cols-3 gap-x-8 gap-y-3">
          <div>
            <dt className={kicker}>Start Date</dt>
            <dd className={`mt-1 ${value}`}>{formatDate(tenancy.start_date)}</dd>
          </div>
          <div>
            <dt className={kicker}>End Date</dt>
            <dd className={`mt-1 ${value}`}>{formatDate(tenancy.end_date)}</dd>
          </div>
          <div>
            <dt className={kicker}>Duration</dt>
            <dd className={`mt-1 ${value}`}>{computeDuration(tenancy.start_date, tenancy.end_date)}</dd>
          </div>
        </dl>
      </div>

      {/* People */}
      <div className={card}>
        <h3 className={heading}>People</h3>
        <div className="mt-4 grid grid-cols-2 gap-x-6">
          <div>
            <p className={kicker}>Tenant</p>
            <div className="mt-2 rounded-lg bg-zinc-50 px-4 py-3">
              {leadTenant ? (
                <>
                  <p className="text-sm font-medium text-zinc-900">{leadTenant.fullName || '—'}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{leadTenant.email || '—'}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{leadTenant.phone || '—'}</p>
                </>
              ) : (
                <p className="text-sm text-zinc-400">No tenant recorded</p>
              )}
            </div>
          </div>
          <div>
            <p className={kicker}>Landlord</p>
            <div className="mt-2 rounded-lg bg-zinc-50 px-4 py-3">
              {leadLandlord ? (
                <>
                  <p className="text-sm font-medium text-zinc-900">{leadLandlord.fullName || '—'}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{leadLandlord.email || '—'}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{leadLandlord.phone || '—'}</p>
                </>
              ) : (
                <p className="text-sm text-zinc-400">No landlord recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial */}
      <div className={card}>
        <h3 className={heading}>Financial</h3>
        <dl className="mt-4 grid grid-cols-4 gap-x-8 gap-y-3">
          <div>
            <dt className={kicker}>Deposit Held</dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">
              {deposit != null ? formatCurrency(deposit) : '—'}
            </dd>
          </div>
          <div>
            <dt className={kicker}>Scheme</dt>
            <dd className={`mt-1 ${value}`}>{depositScheme ? formatEnumLabel(depositScheme) : '—'}</dd>
          </div>
          <div>
            <dt className={kicker}>Monthly Rent</dt>
            <dd className={`mt-1 ${value}`}>{monthlyRent != null ? formatCurrency(monthlyRent) : '—'}</dd>
          </div>
          <div>
            <dt className={kicker}>Rent Arrears</dt>
            <dd className="mt-1 text-sm text-emerald-600">
              {rentArrears != null ? formatCurrency(rentArrears) : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Continue button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          Continue to Checkout
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
