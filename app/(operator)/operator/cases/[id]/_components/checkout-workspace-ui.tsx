import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { DataTable } from '@/app/operator-ui'
import { cn } from '@/lib/ui'

export type WorkspaceBadgeTone =
  | 'active'
  | 'accepted'
  | 'agreed'
  | 'cleaning'
  | 'draft'
  | 'disputed'
  | 'expired'
  | 'fair'
  | 'fail'
  | 'good'
  | 'info'
  | 'landlord'
  | 'maintenance'
  | 'neutral'
  | 'overdue'
  | 'pass'
  | 'pending'
  | 'poor'
  | 'processed'
  | 'processing'
  | 'review'
  | 'sent'
  | 'shared'
  | 'submitted'
  | 'tenant'
  | 'unacceptable'
  | 'uploaded'
  | 'warning'

export type WorkspaceAccentTone =
  | 'danger'
  | 'default'
  | 'info'
  | 'landlord'
  | 'shared'
  | 'success'
  | 'tenant'
  | 'warning'

export type WorkspaceNoticeTone = 'danger' | 'info' | 'neutral' | 'success' | 'warning'

export type WorkspaceOptionTone =
  | 'danger'
  | 'default'
  | 'landlord'
  | 'neutral'
  | 'shared'
  | 'success'
  | 'tenant'
  | 'warning'

export type WorkspaceButtonTone = 'danger' | 'primary' | 'secondary' | 'success'

const BADGE_STYLES: Record<WorkspaceBadgeTone, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  agreed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cleaning: 'border-amber-200 bg-amber-50 text-amber-700',
  draft: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  disputed: 'border-rose-200 bg-rose-50 text-rose-700',
  expired: 'border-amber-200 bg-amber-50 text-amber-700',
  fair: 'border-amber-200 bg-amber-50 text-amber-700',
  fail: 'border-rose-200 bg-rose-50 text-rose-700',
  good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  landlord: 'border-sky-200 bg-sky-50 text-sky-700',
  maintenance: 'border-violet-200 bg-violet-50 text-violet-700',
  neutral: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
  pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  poor: 'border-rose-200 bg-rose-50 text-rose-700',
  processed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  processing: 'border-amber-200 bg-amber-50 text-amber-700',
  review: 'border-amber-200 bg-amber-50 text-amber-700',
  sent: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  shared: 'border-orange-200 bg-orange-50 text-orange-700',
  submitted: 'border-sky-200 bg-sky-50 text-sky-700',
  tenant: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  unacceptable: 'border-rose-700 bg-rose-700 text-white',
  uploaded: 'border-zinc-200 bg-zinc-100 text-zinc-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
}

const METRIC_STYLES: Record<WorkspaceAccentTone, string> = {
  danger: 'border-rose-200 bg-rose-50/80 text-rose-700',
  default: 'border-zinc-200 bg-zinc-50/80 text-zinc-950',
  info: 'border-sky-200 bg-sky-50/80 text-sky-700',
  landlord: 'border-sky-200 bg-sky-50/80 text-sky-700',
  shared: 'border-orange-200 bg-orange-50/80 text-orange-700',
  success: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
  tenant: 'border-fuchsia-200 bg-fuchsia-50/80 text-fuchsia-700',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
}

const PROGRESS_FILL_STYLES: Record<WorkspaceAccentTone, string> = {
  danger: 'bg-rose-500',
  default: 'bg-zinc-900',
  info: 'bg-sky-500',
  landlord: 'bg-sky-500',
  shared: 'bg-orange-500',
  success: 'bg-emerald-500',
  tenant: 'bg-fuchsia-500',
  warning: 'bg-amber-500',
}

const NOTICE_STYLES: Record<WorkspaceNoticeTone, string> = {
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
  neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
}

const OPTION_STYLES: Record<WorkspaceOptionTone, { active: string; idle: string }> = {
  danger: {
    active: 'border-rose-300 bg-rose-50 text-rose-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-rose-200 hover:text-rose-700',
  },
  default: {
    active: 'border-zinc-900 bg-zinc-900 text-white',
    idle: 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900',
  },
  landlord: {
    active: 'border-sky-300 bg-sky-50 text-sky-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-sky-200 hover:text-sky-700',
  },
  neutral: {
    active: 'border-zinc-300 bg-zinc-100 text-zinc-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900',
  },
  shared: {
    active: 'border-orange-300 bg-orange-50 text-orange-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-orange-200 hover:text-orange-700',
  },
  success: {
    active: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-emerald-200 hover:text-emerald-700',
  },
  tenant: {
    active: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-fuchsia-200 hover:text-fuchsia-700',
  },
  warning: {
    active: 'border-amber-300 bg-amber-50 text-amber-700',
    idle: 'border-zinc-200 bg-white text-zinc-500 hover:border-amber-200 hover:text-amber-700',
  },
}

const ACTION_BUTTON_STYLES: Record<WorkspaceButtonTone, string> = {
  danger: 'border-rose-200 bg-white text-rose-700 hover:bg-rose-50',
  primary: 'border-zinc-900 bg-zinc-900 text-white hover:border-slate-800 hover:bg-zinc-800',
  secondary: 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

export type WorkspaceTabItem<TTab extends string> = {
  badgeLabel?: ReactNode
  badgeTone?: WorkspaceBadgeTone
  id: TTab
  label: string
}

function getConditionTone(value: string | null | undefined): WorkspaceBadgeTone {
  const normalized = value?.trim().toLowerCase()

  if (normalized === 'excellent' || normalized === 'good') return 'good'
  if (normalized === 'fair') return 'fair'
  if (normalized === 'poor') return 'poor'
  if (normalized === 'unacceptable') return 'unacceptable'
  return 'neutral'
}

export function WorkspaceBadge({
  className,
  label,
  size = 'default',
  tone = 'neutral',
}: {
  className?: string
  label: ReactNode
  size?: 'compact' | 'default'
  tone?: WorkspaceBadgeTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'compact' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        BADGE_STYLES[tone],
        className
      )}
    >
      {label}
    </span>
  )
}

export function ConditionBadge({
  className,
  value,
}: {
  className?: string
  value: string | null | undefined
}) {
  return <WorkspaceBadge className={className} label={value?.trim() || 'Not set'} tone={getConditionTone(value)} />
}

export function WorkspaceMetricCard({
  className,
  detail,
  label,
  tone = 'default',
  value,
}: {
  className?: string
  detail?: ReactNode
  label: string
  tone?: WorkspaceAccentTone
  value: ReactNode
}) {
  const valueClassName = tone === 'default' ? 'text-zinc-950' : METRIC_STYLES[tone].split(' ').at(-1) ?? 'text-zinc-950'

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
        tone === 'default' ? METRIC_STYLES.default : METRIC_STYLES[tone],
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</p>
      <div className={cn('mt-3 text-[1.55rem] font-semibold tracking-[-0.04em]', valueClassName)}>{value}</div>
      {detail ? <div className="mt-2 text-sm leading-6 text-zinc-600">{detail}</div> : null}
    </div>
  )
}

export function WorkspaceProgressBar({
  className,
  label,
  max,
  showPercentage = true,
  tone = 'default',
  value,
  valueLabel,
}: {
  className?: string
  label?: ReactNode
  max: number
  showPercentage?: boolean
  tone?: WorkspaceAccentTone
  value: number
  valueLabel?: ReactNode
}) {
  const safeMax = max > 0 ? max : 1
  const clampedValue = Math.max(0, Math.min(value, safeMax))
  const percentage = Math.round((clampedValue / safeMax) * 100)

  return (
    <div className={cn('space-y-2', className)}>
      {label || valueLabel ? (
        <div className="flex items-center justify-between gap-3 text-sm text-zinc-600">
          <div>{label}</div>
          {valueLabel ? <div className="text-xs font-medium text-zinc-500">{valueLabel}</div> : null}
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn('h-full rounded-full transition-[width]', PROGRESS_FILL_STYLES[tone])}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showPercentage ? <span className="min-w-10 text-right text-xs text-zinc-500">{percentage}%</span> : null}
      </div>
    </div>
  )
}

export function WorkspaceSectionTitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h3 className={cn('text-sm font-semibold tracking-[-0.02em] text-zinc-950', className)}>
      {children}
    </h3>
  )
}

export function WorkspaceNotice({
  actions,
  body,
  className,
  icon,
  title,
  tone = 'neutral',
}: {
  actions?: ReactNode
  body?: ReactNode
  className?: string
  icon?: ReactNode
  title: ReactNode
  tone?: WorkspaceNoticeTone
}) {
  return (
    <div className={cn('rounded-xl border px-4 py-4', NOTICE_STYLES[tone], className)}>
      <div className="flex items-start gap-3">
        {icon ? <div className="mt-0.5 shrink-0">{icon}</div> : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold [overflow-wrap:anywhere]">{title}</p>
          {body ? <div className="mt-1 text-sm leading-6 text-current/80 [overflow-wrap:anywhere]">{body}</div> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  )
}

export function WorkspaceTabBar<TTab extends string>({
  activeTab,
  ariaLabel = 'Workspace sections',
  className,
  items,
  onChange,
}: {
  activeTab: TTab
  ariaLabel?: string
  className?: string
  items: WorkspaceTabItem<TTab>[]
  onChange: (tabId: TTab) => void
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn('flex gap-2 overflow-x-auto border-b border-zinc-200 pb-0', className)}
      role="tablist"
    >
      {items.map((item) => {
        const selected = item.id === activeTab

        return (
          <button
            key={item.id}
            aria-selected={selected}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 border-b-2 px-1 pb-3 pt-2 text-sm font-medium whitespace-nowrap transition',
              selected
                ? 'border-zinc-900 text-zinc-950'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            )}
            onClick={() => onChange(item.id)}
            role="tab"
            type="button"
          >
            <span>{item.label}</span>
            {item.badgeLabel ? (
              <WorkspaceBadge
                label={item.badgeLabel}
                size="compact"
                tone={item.badgeTone ?? (selected ? 'review' : 'neutral')}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function WorkspaceTable({
  children,
  className,
  tableClassName,
}: {
  children: ReactNode
  className?: string
  tableClassName?: string
}) {
  return (
    <DataTable className={cn('rounded-xl border-zinc-200', className)}>
      <table className={cn('w-full border-collapse text-sm', tableClassName)}>{children}</table>
    </DataTable>
  )
}

export function WorkspaceTableHeaderCell({
  align = 'left',
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: 'center' | 'left' | 'right'
}) {
  return (
    <th
      className={cn(
        'bg-zinc-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500',
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function WorkspaceTableCell({
  align = 'left',
  children,
  className,
  emphasis = 'default',
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: 'center' | 'left' | 'right'
  emphasis?: 'default' | 'danger' | 'mono' | 'muted' | 'strong'
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 text-sm',
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left',
        emphasis === 'strong'
          ? 'font-semibold text-zinc-950'
          : emphasis === 'muted'
            ? 'text-zinc-500'
            : emphasis === 'danger'
              ? 'text-rose-700'
              : emphasis === 'mono'
                ? 'font-mono text-[13px] text-zinc-700'
                : 'text-zinc-700',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

export function WorkspaceOptionButton({
  className,
  selected = false,
  tone = 'neutral',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  tone?: WorkspaceOptionTone
}) {
  const toneStyles = OPTION_STYLES[tone]

  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition',
        selected ? toneStyles.active : toneStyles.idle,
        props.disabled ? 'cursor-not-allowed opacity-60 hover:border-zinc-200 hover:text-inherit' : null,
        className
      )}
      type="button"
      {...props}
    />
  )
}

export function WorkspaceSelectableCard({
  children,
  className,
  description,
  selected = false,
  title,
  tone = 'neutral',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode
  description?: ReactNode
  selected?: boolean
  title: ReactNode
  tone?: WorkspaceOptionTone
}) {
  const toneStyles = OPTION_STYLES[tone]

  return (
    <button
      className={cn(
        'w-full rounded-xl border px-5 py-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition',
        selected ? toneStyles.active : cn('bg-white', toneStyles.idle),
        props.disabled ? 'cursor-not-allowed opacity-60 hover:border-zinc-200 hover:text-inherit' : null,
        className
      )}
      type="button"
      {...props}
    >
      <p className="text-sm font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">{title}</p>
      {description ? <div className="mt-2 text-sm leading-6 text-current/80 [overflow-wrap:anywhere]">{description}</div> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </button>
  )
}

export function WorkspaceActionButton({
  children,
  className,
  tone = 'secondary',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: WorkspaceButtonTone
}) {
  return (
    <button
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
        'disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500',
        ACTION_BUTTON_STYLES[tone],
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export function WorkspaceFieldLabel({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <label
      className={cn('block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500', className)}
      htmlFor={htmlFor}
    >
      {children}
    </label>
  )
}

export function WorkspaceTextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500',
        className
      )}
      {...props}
    />
  )
}

export function WorkspaceTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-900 placeholder:text-zinc-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500',
        className
      )}
      {...props}
    />
  )
}

export function WorkspaceSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm text-zinc-900 focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500',
        className
      )}
      {...props}
    />
  )
}

export function WorkspaceTableRow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-t border-zinc-200 first:border-t-0', className)} {...props}>
      {children}
    </tr>
  )
}
