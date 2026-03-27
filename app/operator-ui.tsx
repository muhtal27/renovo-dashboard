import type { ReactNode } from 'react'
import { cn } from '@/lib/ui'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-[24px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]',
        'md:px-7',
        'xl:flex-row xl:items-start xl:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
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
    <section
      className={cn(
        'rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]',
        className
      )}
    >
      {children}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
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
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-start md:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
    </div>
  )
}

export function KPIStatCard({
  label,
  value,
  detail,
  trend,
  tone = 'default',
  className,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  trend?: ReactNode
  tone?: 'default' | 'accent' | 'danger' | 'warning'
  className?: string
}) {
  const toneClasses =
    tone === 'accent'
      ? 'border-emerald-200 bg-emerald-50/70'
      : tone === 'danger'
        ? 'border-rose-200 bg-rose-50/70'
        : tone === 'warning'
          ? 'border-amber-200 bg-amber-50/75'
          : 'border-slate-200 bg-slate-50/70'

  return (
    <div
      className={cn(
        'rounded-[20px] border px-5 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.03)]',
        toneClasses,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{label}</p>
        {trend ? <div className="text-xs font-medium text-slate-500">{trend}</div> : null}
      </div>
      <div className="mt-4 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </div>
      {detail ? <div className="mt-2 text-sm leading-6 text-slate-600">{detail}</div> : null}
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
        'inline-flex min-h-9 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition',
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
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
        'flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4',
        'lg:flex-row lg:items-center lg:justify-between',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DetailPanel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <aside
      className={cn(
        'rounded-[22px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]',
        className
      )}
    >
      <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
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
    <div
      className={cn(
        'rounded-[20px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-6',
        className
      )}
    >
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
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
    <div className={cn('overflow-hidden rounded-[24px] border border-slate-200/80 bg-white', className)}>
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
    <div className="space-y-4">
      {items.map((item, index) => {
        const toneClass =
          item.tone === 'accent'
            ? 'bg-emerald-500'
            : item.tone === 'warning'
              ? 'bg-amber-500'
              : item.tone === 'danger'
                ? 'bg-rose-500'
                : 'bg-slate-400'

        return (
          <div key={item.id} className="relative flex gap-3 pl-5">
            {index !== items.length - 1 ? (
              <span className="absolute left-[7px] top-4 h-[calc(100%+16px)] w-px bg-slate-200" />
            ) : null}
            <span className={cn('absolute left-0 top-1.5 h-4 w-4 rounded-full ring-4 ring-white', toneClass)} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              {item.meta ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{item.meta}</p> : null}
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
    <div className={cn('space-y-2', className)}>
      {label ? <div className="flex items-center justify-between gap-3 text-sm text-slate-600">{label}</div> : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900"
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
    <div
      className={cn(
        'animate-pulse rounded-[24px] border border-slate-200/80 bg-white px-6 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]',
        className
      )}
    >
      <div className="h-3 w-24 rounded-full bg-slate-200" />
      <div className="mt-4 h-8 w-52 rounded-full bg-slate-200" />
      <div className="mt-6 space-y-3">
        <div className="h-4 rounded-full bg-slate-100" />
        <div className="h-4 w-11/12 rounded-full bg-slate-100" />
        <div className="h-4 w-9/12 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}
