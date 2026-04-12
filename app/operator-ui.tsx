import type { ReactNode } from 'react'
import { cn } from '@/lib/ui'

export function PageHeader({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow?: string
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  if (!actions && !title) return null

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && !title ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
        ) : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function SectionCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-b border-zinc-200 pb-4', className)}>
      {children}
    </section>
  )
}

export function SectionHeading({
  title,
  aside,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  aside?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
    </div>
  )
}

export function KPIStatCard({
  label,
  value,
  trend,
  icon,
  tone = 'default',
  className,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  trend?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'accent' | 'danger' | 'warning'
  className?: string
}) {
  const valueColor =
    tone === 'accent'
      ? 'text-emerald-600'
      : tone === 'danger'
        ? 'text-rose-600'
        : tone === 'warning'
          ? 'text-amber-600'
          : 'text-zinc-950'

  const iconBg =
    tone === 'accent'
      ? 'bg-emerald-100/80 text-emerald-600'
      : tone === 'danger'
        ? 'bg-rose-100/80 text-rose-600'
        : tone === 'warning'
          ? 'bg-amber-100/80 text-amber-600'
          : 'bg-zinc-100/80 text-zinc-500'

  return (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      {icon ? (
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}>
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</span>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className={cn('animate-count-up text-2xl font-bold tabular-nums leading-tight tracking-tight', valueColor)}>
            {value}
          </span>
          {trend ? <span className="text-[11px] font-medium text-zinc-400">{trend}</span> : null}
        </div>
      </div>
    </div>
  )
}

export function ToolbarPill({
  active = false,
  children,
  className,
}: {
  active?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border-b-2 px-2.5 pb-2 text-sm font-medium transition',
        active
          ? 'border-emerald-600 text-zinc-900'
          : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
        className
      )}
    >
      {children}
    </span>
  )
}

export function FilterToolbar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DetailPanel({
  title,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <aside className={cn('border-l-2 border-zinc-200 pl-4', className)}>
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <div className="mt-3 space-y-0">{children}</div>
    </aside>
  )
}

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string
  body: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('py-8 text-center', className)}>
      <p className="text-sm font-semibold text-zinc-950">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{body}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

export function DataTable({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function ActivityTimeline({
  items,
  empty,
}: {
  items: Array<{
    id: string
    title: string
    detail: string
    meta?: string
    tone?: 'default' | 'accent' | 'warning' | 'danger'
  }>
  empty?: ReactNode
}) {
  if (!items.length) {
    return empty ?? null
  }

  return (
    <div className="space-y-0">
      {items.map((item) => {
        const toneClass =
          item.tone === 'accent'
            ? 'bg-emerald-500'
            : item.tone === 'warning'
              ? 'bg-amber-500'
              : item.tone === 'danger'
                ? 'bg-rose-500'
                : 'bg-zinc-400'

        return (
          <div key={item.id} className="flex gap-3 border-b border-zinc-100 py-2.5 last:border-b-0">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', toneClass)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                {item.meta ? <span className="shrink-0 text-[11px] text-zinc-400">{item.meta}</span> : null}
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">{item.detail}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number
  label?: ReactNode
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('space-y-1', className)}>
      {label ? <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">{label}</div> : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export function SkeletonPanel({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn('skeleton-shimmer rounded-2xl', className)} />
  )
}
