'use client'

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Circle,
  ExternalLink,
  Eye,
  FilePlus,
  List,
  MessageSquare,
  Pencil,
  Upload,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { useToast } from '@/app/components/Toast'
import { cn } from '@/lib/ui'
import type {
  CheckoutWorkspaceComplianceRecord,
  CheckoutWorkspaceDetectorRecord,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

// Prototype ref: public/demo.html:2390-2477 — the canonical Inventory step.

const kicker = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400'
const card = 'rounded-[10px] border border-zinc-200 bg-white p-5'
const heading = 'text-base font-semibold text-zinc-900'

function computeDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—'
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '—'

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

function getRegionLabel(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null
  const code = countryCode.toUpperCase().replace(/^GB[-_]?/, '')
  if (code === 'ENG') return 'England'
  if (code === 'SCT') return 'Scotland'
  if (code === 'WLS') return 'Wales'
  if (code === 'NIR') return 'Northern Ireland'
  if (code === 'GB' || code === '') return 'United Kingdom'
  return null
}

type ComplianceStatus = 'ok' | 'late' | 'expiring' | 'missing'

type ComplianceRow = {
  id: string
  label: string
  meta: string
  status: ComplianceStatus
}

function findCompliance(
  items: CheckoutWorkspaceComplianceRecord[],
  needle: string
): CheckoutWorkspaceComplianceRecord | undefined {
  const n = needle.toLowerCase()
  return items.find((c) => c.checkItem.toLowerCase().includes(n))
}

function buildComplianceRow(
  id: string,
  label: string,
  item: CheckoutWorkspaceComplianceRecord | undefined,
  missingMessage: string,
  okMessage?: (note: string | null) => string
): ComplianceRow {
  if (!item) {
    return { id, label, meta: missingMessage, status: 'missing' }
  }

  if (item.passed === true) {
    return {
      id,
      label,
      meta: okMessage ? okMessage(item.notes) : (item.notes ?? 'Passed'),
      status: 'ok',
    }
  }

  if (item.passed === false) {
    return { id, label, meta: item.notes ?? 'Action required', status: 'missing' }
  }

  // Neither true nor false — treated as expiring / action-soon
  return { id, label, meta: item.notes ?? 'Awaiting confirmation', status: 'expiring' }
}

function buildAlarmRow(detectors: CheckoutWorkspaceDetectorRecord[]): ComplianceRow {
  if (detectors.length === 0) {
    return {
      id: 'alarms',
      label: 'Smoke / CO alarm test',
      meta: 'No detectors recorded',
      status: 'missing',
    }
  }

  const today = new Date()
  const untested = detectors.filter((d) => !d.tested)
  const expired = detectors.filter((d) => d.expiryDate && new Date(d.expiryDate) < today)
  const testedCount = detectors.length - untested.length

  if (untested.length === 0 && expired.length === 0) {
    return {
      id: 'alarms',
      label: 'Smoke / CO alarm test',
      meta: `${testedCount}/${detectors.length} detectors tested`,
      status: 'ok',
    }
  }

  const parts: string[] = []
  if (untested.length > 0) parts.push(`${untested.length} untested`)
  if (expired.length > 0) parts.push(`${expired.length} expired`)

  return {
    id: 'alarms',
    label: 'Smoke / CO alarm test',
    meta: parts.join(' · '),
    status: expired.length > 0 ? 'missing' : 'expiring',
  }
}

function buildComplianceRows(
  data: OperatorCheckoutWorkspaceData,
  isScotland: boolean
): ComplianceRow[] {
  const rows: ComplianceRow[] = []
  const items = data.compliance
  const hasTenancyDoc = data.documents.some((d) => d.documentType === 'tenancy')

  rows.push({
    id: 'tenancy-agreement',
    label: 'Tenancy agreement',
    meta: hasTenancyDoc ? 'Uploaded' : 'Required before claim',
    status: hasTenancyDoc ? 'ok' : 'missing',
  })

  rows.push(
    buildComplianceRow(
      'deposit-certificate',
      'Deposit certificate (lodgement)',
      findCompliance(items, 'deposit'),
      'Required — re-issue from the scheme portal'
    )
  )
  rows.push(
    buildComplianceRow(
      'prescribed-information',
      'Prescribed Information served',
      findCompliance(items, 'prescribed'),
      'Cannot evidence — case may be invalidated'
    )
  )
  rows.push(
    buildComplianceRow(
      'gas-safety',
      'Gas Safety certificate',
      findCompliance(items, 'gas'),
      'Gas Safety certificate not on file'
    )
  )
  rows.push(
    buildComplianceRow(
      'eicr',
      'EICR (electrical)',
      findCompliance(items, 'eicr'),
      'EICR not on file'
    )
  )
  rows.push(
    buildComplianceRow(
      'epc',
      'EPC',
      findCompliance(items, 'epc'),
      'EPC not on file'
    )
  )
  rows.push(
    buildComplianceRow(
      'legionella',
      'Legionella risk assessment',
      findCompliance(items, 'legionella'),
      'Legionella assessment not on file'
    )
  )

  rows.push(buildAlarmRow(data.detectors))

  if (isScotland) {
    rows.push(
      buildComplianceRow(
        'scottish-landlord-reg',
        'Landlord registration (Scotland)',
        findCompliance(items, 'landlord'),
        'Required in Scotland — cannot pursue claim without this'
      )
    )
  }

  return rows
}

function piBannerState(items: CheckoutWorkspaceComplianceRecord[]):
  | { tone: 'emerald'; title: string; body: string }
  | { tone: 'amber'; title: string; body: string }
  | { tone: 'rose'; title: string; body: string }
  | null {
  const pi = findCompliance(items, 'prescribed')
  if (!pi) return null

  if (pi.passed === true) {
    return {
      tone: 'emerald',
      title: 'Prescribed Information served on time',
      body: pi.notes ?? 'PI was served within the statutory 30-day window.',
    }
  }

  if (pi.passed === false) {
    return {
      tone: 'rose',
      title: 'Prescribed Information not served',
      body: pi.notes ?? 'Case may be invalidated. Resolve before submission.',
    }
  }

  return {
    tone: 'amber',
    title: 'Prescribed Information pending',
    body: pi.notes ?? 'Awaiting confirmation that PI was served on time.',
  }
}

export function StepInventory({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const toast = useToast()
  const property = data.workspace.property
  const tenancy = data.workspace.tenancy
  const tenants = data.workspace.overview.tenants
  const landlords = data.workspace.overview.landlords
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const depositScheme = data.checkoutCase?.depositScheme
  const depositType = data.checkoutCase?.depositType
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

  const regionLabel = getRegionLabel(property.country_code)
  const isScotland = regionLabel === 'Scotland'

  const leadTenant = tenants.find((t) => t.isLead) ?? tenants[0] ?? null
  const leadLandlord = landlords.find((l) => l.isLead) ?? landlords[0] ?? null

  const pi = piBannerState(data.compliance)
  const complianceRows = buildComplianceRows(data, isScotland)
  const complianceOk = complianceRows.filter((r) => r.status === 'ok').length
  const complianceTotal = complianceRows.length
  const readinessComplete = complianceOk
  const readinessTotal = complianceTotal
  const allReady = readinessComplete === readinessTotal

  // Inventory & Evidence stats
  const checkInDoc = data.documents.find((d) => d.documentType === 'checkin')
  const checkOutDoc = data.documents.find((d) => d.documentType === 'checkout')
  const inventoryItemsCount = data.rooms.reduce((sum, r) => sum + r.defectCount, 0)
  const photoCount = data.rooms.reduce((sum, r) => sum + r.photoCount, 0)

  return (
    <div className="space-y-4">
      {/* PI compliance banner — prototype ref: demo.html:2391 */}
      {pi ? (
        <div
          className={cn(
            'rounded-[10px] border border-zinc-200 p-4',
            pi.tone === 'emerald' && 'border-l-[3px] border-l-emerald-500 bg-emerald-50',
            pi.tone === 'amber' && 'border-l-[3px] border-l-amber-500 bg-amber-50',
            pi.tone === 'rose' && 'border-l-[3px] border-l-rose-500 bg-rose-50'
          )}
        >
          <div className="flex items-start gap-2.5">
            {pi.tone === 'emerald' ? (
              <CheckCircle className="mt-0.5 h-[18px] w-[18px] text-emerald-600" />
            ) : (
              <AlertTriangle
                className={cn(
                  'mt-0.5 h-[18px] w-[18px]',
                  pi.tone === 'amber' ? 'text-amber-600' : 'text-rose-600'
                )}
              />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  pi.tone === 'emerald' && 'text-emerald-700',
                  pi.tone === 'amber' && 'text-amber-700',
                  pi.tone === 'rose' && 'text-rose-700'
                )}
              >
                {pi.title}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{pi.body}</p>
              {pi.tone === 'rose' ? (
                <button
                  type="button"
                  onClick={() => toast.showToast('PI compliance workflow opened')}
                  className="btn btn-secondary btn-sm mt-2"
                >
                  <FilePlus className="h-3 w-3" />
                  <span>Resolve now</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Setup card — prototype ref: demo.html:2393 */}
      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={heading}>Setup</h3>
          <div className="flex items-center gap-1.5">
            {regionLabel ? (
              <span className="badge badge-zinc">{regionLabel}</span>
            ) : null}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label="Edit setup"
              onClick={() => toast.showToast('Edit setup opened')}
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        </div>

        <p className={kicker}>Property</p>
        <div className="mt-2 grid gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          <div>
            <p className="text-[11px] text-zinc-500">Address</p>
            <p className="mt-1 text-sm">{address || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Reference</p>
            <p className="mt-1 text-sm">{property.reference || '—'}</p>
          </div>
        </div>

        <div className="my-3.5 h-px bg-zinc-100" />

        <p className={kicker}>Tenancy</p>
        <div className="mt-2 grid gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div>
            <p className="text-[11px] text-zinc-500">Start</p>
            <p className="mt-1 text-sm">{formatDate(tenancy.start_date)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">End</p>
            <p className="mt-1 text-sm">{formatDate(tenancy.end_date)}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Duration</p>
            <p className="mt-1 text-sm">{computeDuration(tenancy.start_date, tenancy.end_date)}</p>
          </div>
        </div>

        <div className="my-3.5 h-px bg-zinc-100" />

        <p className={kicker}>People</p>
        <div className="mt-2 grid gap-3.5 md:grid-cols-2">
          <div className="rounded-[6px] bg-zinc-50 p-3">
            <p className="text-[11px] text-zinc-500">Tenant</p>
            <p className="mt-1 text-sm font-medium text-zinc-900">{leadTenant?.fullName || '—'}</p>
            {leadTenant?.email ? (
              <p className="mt-1 text-[11px]">
                <a href={`mailto:${leadTenant.email}`} className="text-emerald-700">
                  {leadTenant.email}
                </a>
              </p>
            ) : null}
            {leadTenant?.phone ? (
              <p className="mt-1 text-[11px]">
                <a href={`tel:${leadTenant.phone}`} className="text-emerald-700">
                  {leadTenant.phone}
                </a>
              </p>
            ) : null}
            <Link
              href={`/communications?tenant=${encodeURIComponent(leadTenant?.id ?? '')}`}
              prefetch={false}
              className="btn btn-ghost btn-sm mt-2"
              style={{ padding: '2px 6px' }}
            >
              <MessageSquare className="h-2.5 w-2.5" />
              <span>Open thread</span>
            </Link>
          </div>
          <div className="rounded-[6px] bg-zinc-50 p-3">
            <p className="text-[11px] text-zinc-500">Landlord</p>
            <p className="mt-1 text-sm font-medium text-zinc-900">{leadLandlord?.fullName || '—'}</p>
            {leadLandlord?.email ? (
              <p className="mt-1 text-[11px]">
                <a href={`mailto:${leadLandlord.email}`} className="text-emerald-700">
                  {leadLandlord.email}
                </a>
              </p>
            ) : null}
            {leadLandlord?.phone ? (
              <p className="mt-1 text-[11px]">
                <a href={`tel:${leadLandlord.phone}`} className="text-emerald-700">
                  {leadLandlord.phone}
                </a>
              </p>
            ) : null}
            {isScotland ? (
              <p className="mt-1 text-[11px] text-zinc-500">
                Reg: <span className="text-rose-600">Not on file</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="my-3.5 h-px bg-zinc-100" />

        <p className={kicker}>Financial</p>
        <div className="mt-2 grid gap-3.5 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          <div>
            <p className="text-[11px] text-zinc-500">Deposit Held</p>
            <p className="mt-1 text-sm font-semibold">
              {deposit != null ? formatCurrency(deposit) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Scheme</p>
            <p className="mt-1 text-sm">{depositScheme ? formatEnumLabel(depositScheme) : '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Type</p>
            <p className="mt-1 text-sm">
              {depositType === 'custodial' ? 'Custodial' : depositType === 'insurance' ? 'Insurance-backed' : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Monthly Rent</p>
            <p className="mt-1 text-sm">
              {monthlyRent != null ? formatCurrency(monthlyRent) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Rent Arrears</p>
            <p className={cn('mt-1 text-sm', rentArrears && rentArrears > 0 ? 'text-rose-600' : 'text-emerald-600')}>
              {rentArrears != null ? formatCurrency(rentArrears) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Inventory & Evidence — prototype ref: demo.html:2436-2456 */}
      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={heading}>Inventory &amp; Evidence</h3>
          <span className="text-[11px] text-zinc-500">
            {inventoryItemsCount} items · {photoCount} photos
          </span>
        </div>

        <div className="space-y-3">
          {[
            {
              label: 'Signed check-in inventory',
              doc: checkInDoc,
              emptyAction: 'Upload signed PDF from clerk',
            },
            {
              label: 'Signed check-out inventory',
              doc: checkOutDoc,
              emptyAction: 'Awaiting tenant signature',
            },
          ].map((item) => {
            const ok = Boolean(item.doc)
            return (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-2.5 rounded-[6px] border p-2.5',
                  ok ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-white'
                )}
              >
                {ok ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-zinc-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{item.label}</p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {ok
                      ? `Uploaded ${item.doc?.createdAt ? formatDate(item.doc.createdAt) : ''} · ${item.doc?.documentName ?? ''}`
                      : item.emptyAction}
                  </p>
                </div>
                {ok ? (
                  <button
                    type="button"
                    onClick={() => toast.showToast(`Opening ${item.label}`)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Eye className="h-3 w-3" />
                    <span>View</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toast.showToast(`Upload prompt for ${item.label}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <p className={kicker} style={{ margin: 0 }}>Itemised contents</p>
          <span className="text-sm font-semibold">{inventoryItemsCount}</span>
          <span className="text-[11px] text-zinc-500">items recorded across rooms</span>
          <button
            type="button"
            onClick={() => toast.showToast('Contents list opened')}
            className="btn btn-ghost btn-sm ml-auto"
          >
            <List className="h-3 w-3" />
            <span>View list</span>
          </button>
        </div>
      </div>

      {/* Compliance Pack — prototype ref: demo.html:2457-2465 */}
      <div className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className={heading}>Compliance Pack</h3>
          <span className="text-sm font-semibold tabnum">
            {complianceOk}/{complianceTotal}{' '}
            <span className="text-[11px] font-normal text-zinc-500">complete</span>
          </span>
        </div>

        <div className="space-y-2.5">
          {complianceRows.map((row) => {
            const toneClasses =
              row.status === 'ok'
                ? 'border-zinc-200 bg-white'
                : row.status === 'expiring' || row.status === 'late'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-rose-200 bg-rose-50'
            return (
              <div
                key={row.id}
                className={cn('flex items-center gap-2.5 rounded-[6px] border p-2.5', toneClasses)}
              >
                {row.status === 'ok' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : row.status === 'missing' ? (
                  <X className="h-4 w-4 text-rose-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">{row.label}</p>
                  <p className="truncate text-[11px] text-zinc-500">{row.meta}</p>
                </div>
                {row.status !== 'ok' ? (
                  <button
                    type="button"
                    onClick={() => toast.showToast(`Workflow opened: ${row.label}`)}
                    className="btn btn-secondary btn-sm"
                  >
                    {row.status === 'missing' ? 'Add' : 'Renew'}
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {/* Readiness footer — prototype ref: demo.html:2466-2477 */}
      <div className="rounded-[10px] border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Inventory readiness</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              {readinessComplete} of {readinessTotal} required items complete
              {allReady
                ? ' — ready to proceed'
                : ' — missing items reduce adjudication win rate by ~40%'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {allReady ? (
              <span className="badge badge-emerald inline-flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Ready</span>
              </span>
            ) : (
              <span
                className={cn(
                  'badge',
                  readinessComplete >= 3 ? 'badge-amber' : 'badge-rose'
                )}
              >
                {readinessComplete}/{readinessTotal} complete
              </span>
            )}
            <Link
              href="?step=checkout"
              className={cn('btn', allReady ? 'btn-accent' : 'btn-secondary')}
            >
              <span>Continue to Checkout</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

