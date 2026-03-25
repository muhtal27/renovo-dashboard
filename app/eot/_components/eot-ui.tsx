import type { ReactNode } from 'react'

const STATUS_STYLES: Record<string, string> = {
  draft: 'border-stone-200 bg-stone-100 text-stone-700',
  collecting_evidence: 'border-sky-200 bg-sky-100 text-sky-800',
  analysis: 'border-violet-200 bg-violet-100 text-violet-800',
  review: 'border-amber-200 bg-amber-100 text-amber-800',
  ready_for_claim: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  submitted: 'border-sky-200 bg-sky-100 text-sky-800',
  disputed: 'border-red-200 bg-red-100 text-red-800',
  resolved: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  low: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  medium: 'border-amber-200 bg-amber-100 text-amber-800',
  high: 'border-red-200 bg-red-100 text-red-800',
  image: 'border-sky-200 bg-sky-100 text-sky-800',
  video: 'border-violet-200 bg-violet-100 text-violet-800',
  document: 'border-stone-200 bg-stone-100 text-stone-700',
  open: 'border-amber-200 bg-amber-100 text-amber-800',
  resolved_issue: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  disputed_issue: 'border-red-200 bg-red-100 text-red-800',
  charge: 'border-red-200 bg-red-100 text-red-800',
  partial: 'border-amber-200 bg-amber-100 text-amber-800',
  no_charge: 'border-emerald-200 bg-emerald-100 text-emerald-800',
  manager: 'border-stone-200 bg-stone-100 text-stone-700',
  landlord: 'border-amber-200 bg-amber-100 text-amber-800',
  tenant: 'border-sky-200 bg-sky-100 text-sky-800',
}

function getToneClass(tone: string) {
  if (tone === 'resolved') return STATUS_STYLES.resolved_issue
  if (tone === 'disputed') return STATUS_STYLES.disputed_issue
  return STATUS_STYLES[tone] ?? 'border-stone-200 bg-stone-100 text-stone-700'
}

export function EotCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[1.7rem] border border-stone-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  )
}

export function EotBadge({
  label,
  tone,
}: {
  label: string
  tone: string
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getToneClass(tone)}`}
    >
      {label}
    </span>
  )
}

export function EmptyState({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="rounded-[1.3rem] border border-dashed border-stone-300 bg-stone-50/80 px-5 py-6 text-sm text-stone-600">
      <p className="font-semibold text-stone-900">{title}</p>
      <p className="mt-2 leading-6">{body}</p>
    </div>
  )
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) return 'Not set'

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatCurrency(value: string | number | null | undefined) {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : 0

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatAddress(parts: Array<string | null | undefined>) {
  const filteredParts = parts.map((part) => part?.trim()).filter(Boolean)
  return filteredParts.length ? filteredParts.join(', ') : 'Address not available'
}
