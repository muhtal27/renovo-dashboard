import type { ReactNode } from 'react'
import {
  ActivityTimeline,
  DataTable,
  DetailPanel,
  EmptyState,
  FilterToolbar,
  KPIStatCard,
  PageHeader,
  ProgressBar,
  SectionCard,
  SectionHeading,
  SkeletonPanel,
  ToolbarPill,
} from '@/app/operator-ui'
import { cn } from '@/lib/ui'

const TONE_STYLES: Record<string, string> = {
  draft: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  collecting_evidence: 'border-sky-200 bg-sky-50 text-sky-700',
  analysis: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  review: 'border-amber-200 bg-amber-50 text-amber-700',
  ready_for_claim: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  submitted: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  disputed: 'border-rose-200 bg-rose-50 text-rose-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-rose-200 bg-rose-50 text-rose-700',
  image: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  video: 'border-violet-200 bg-violet-50 text-violet-700',
  document: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  open: 'border-amber-200 bg-amber-50 text-amber-700',
  resolved_issue: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  disputed_issue: 'border-rose-200 bg-rose-50 text-rose-700',
  charge: 'border-rose-200 bg-rose-50 text-rose-700',
  partial: 'border-amber-200 bg-amber-50 text-amber-700',
  no_charge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  manager: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  landlord: 'border-amber-200 bg-amber-50 text-amber-700',
  tenant: 'border-sky-200 bg-sky-50 text-sky-700',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
  stable: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  attention: 'border-amber-200 bg-amber-50 text-amber-700',
}

function getToneClass(tone: string) {
  if (tone === 'resolved') return TONE_STYLES.resolved_issue
  if (tone === 'disputed') return TONE_STYLES.disputed_issue
  return TONE_STYLES[tone] ?? 'border-zinc-200 bg-zinc-100 text-zinc-700'
}

export function StatusBadge({
  label,
  tone,
  className,
}: {
  label: string
  tone: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        getToneClass(tone),
        className
      )}
    >
      {label}
    </span>
  )
}

export function SeverityBadge({
  severity,
}: {
  severity: string
}) {
  return <StatusBadge label={formatEnumLabel(severity)} tone={severity} />
}

export function MetaItem({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn('border-b border-zinc-200 py-3', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <div className="mt-2 text-sm font-medium leading-6 text-zinc-900">{value}</div>
    </div>
  )
}

export function KeyValueList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>
}) {
  return (
    <dl className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4">
          <dt className="text-sm text-zinc-500">{item.label}</dt>
          <dd className="text-right text-sm font-medium text-zinc-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function WorkspaceSection({
  title,
  description,
  aside,
  children,
  className,
}: {
  title: string
  description?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <SectionCard className={cn('px-6 py-6', className)}>
      <SectionHeading title={title} description={description} aside={aside} />
      <div className="mt-5">{children}</div>
    </SectionCard>
  )
}

export function DividerTitle({
  children,
}: {
  children: ReactNode
}) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{children}</p>
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
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0)
}

export function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
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
    timeZone: 'Europe/London',
  }).format(new Date(value))
}

export function formatAddress(parts: Array<string | null | undefined>) {
  const filteredParts = parts.map((part) => part?.trim()).filter(Boolean)
  return filteredParts.length ? filteredParts.join(', ') : 'Address not available'
}

export function daysSince(value: string | null | undefined) {
  if (!value) return null

  const diff = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

export function getCaseProgress(status: string) {
  switch (status) {
    case 'draft':
      return 8
    case 'collecting_evidence':
      return 28
    case 'analysis':
      return 52
    case 'review':
      return 72
    case 'ready_for_claim':
      return 88
    case 'submitted':
      return 94
    case 'disputed':
      return 82
    case 'resolved':
      return 100
    default:
      return 0
  }
}

export function getCaseAttentionTone({
  priority,
  status,
  lastActivityAt,
}: {
  priority: string
  status: string
  lastActivityAt: string
}) {
  const staleDays = daysSince(lastActivityAt) ?? 0

  if (status === 'disputed' || staleDays >= 10 || priority === 'high') {
    return {
      label: 'High attention',
      tone: 'risk',
    }
  }

  if (status === 'review' || status === 'ready_for_claim' || staleDays >= 5) {
    return {
      label: 'Monitor',
      tone: 'attention',
    }
  }

  return {
    label: 'Stable',
    tone: 'stable',
  }
}

export {
  ActivityTimeline,
  DataTable,
  DetailPanel,
  EmptyState,
  FilterToolbar,
  KPIStatCard,
  PageHeader,
  ProgressBar,
  SectionCard,
  SectionHeading,
  SkeletonPanel,
  ToolbarPill,
}
