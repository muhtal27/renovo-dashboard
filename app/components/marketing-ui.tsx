import Link from 'next/link'
import type { ComponentPropsWithoutRef, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/ui'

type ButtonVariant = 'primary' | 'secondary' | 'inverse' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'
type SectionVariant = 'default' | 'tint' | 'dark'

function isExternalHref(href: string) {
  return /^(?:https?:|mailto:|tel:)/i.test(href)
}

function buttonVariantClass(variant: ButtonVariant) {
  switch (variant) {
    case 'secondary':
      return 'marketing-button-secondary'
    case 'inverse':
      return 'marketing-button-inverse'
    case 'ghost':
      return 'marketing-button-ghost'
    default:
      return 'marketing-button-primary'
  }
}

function buttonSizeClass(size: ButtonSize) {
  switch (size) {
    case 'sm':
      return 'min-h-[2.75rem] px-4 py-2.5 text-sm'
    case 'lg':
      return 'min-h-[3.5rem] px-6 py-3.5 text-[0.95rem]'
    default:
      return 'min-h-[3rem] px-5 py-3 text-sm'
  }
}

export function MarketingButton({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}) {
  const classes = cn(
    'marketing-button',
    buttonVariantClass(variant),
    buttonSizeClass(size),
    className
  )

  if (isExternalHref(href)) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  )
}

export function MarketingSection({
  children,
  className,
  innerClassName,
  variant = 'default',
  bleed = false,
  ...props
}: HTMLAttributes<HTMLElement> & {
  innerClassName?: string
  variant?: SectionVariant
  bleed?: boolean
}) {
  const sectionClassName = cn(
    'marketing-section',
    variant === 'tint' && 'marketing-section-tint',
    variant === 'dark' && 'marketing-section-dark',
    className
  )

  if (bleed) {
    return (
      <section className={sectionClassName} {...props}>
        {children}
      </section>
    )
  }

  return (
    <section className={sectionClassName} {...props}>
      <div className={cn('marketing-frame marketing-section-inner', innerClassName)}>{children}</div>
    </section>
  )
}

export function MarketingIntro({
  eyebrow,
  title,
  description,
  actions,
  align = 'left',
  titleAs = 'h2',
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  align?: 'left' | 'center'
  titleAs?: 'h1' | 'h2' | 'h3'
  className?: string
  eyebrowClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}) {
  const centered = align === 'center'
  const TitleTag = titleAs

  return (
    <div className={cn('marketing-intro', centered && 'text-center', className)}>
      {eyebrow ? (
        <div
          className={cn(
            'marketing-eyebrow',
            centered && 'mx-auto justify-center',
            eyebrowClassName
          )}
        >
          {eyebrow}
        </div>
      ) : null}
      <TitleTag className={cn('marketing-title', titleClassName)}>{title}</TitleTag>
      {description ? (
        <div className={cn('marketing-copy', centered && 'mx-auto', descriptionClassName)}>
          {description}
        </div>
      ) : null}
      {actions ? (
        <div
          className={cn(
            'marketing-actions',
            centered && 'justify-center',
            !centered && 'justify-start'
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export function MarketingCard({
  children,
  className,
  tone = 'default',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'muted' | 'dark'
}) {
  return (
    <div
      className={cn(
        'marketing-card',
        tone === 'muted' && 'marketing-card-muted',
        tone === 'dark' && 'marketing-card-dark',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function MarketingRuleList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('marketing-rule-list', className)} {...props}>
      {children}
    </div>
  )
}

export function MarketingChecklist({
  items,
  className,
  iconClassName,
  itemClassName,
}: {
  items: readonly ReactNode[]
  className?: string
  iconClassName?: string
  itemClassName?: string
}) {
  return (
    <ul className={cn('marketing-checklist', className)}>
      {items.map((item, index) => (
        <li key={index} className={cn('marketing-checklist-item', itemClassName)}>
          <span className={cn('marketing-checklist-icon', iconClassName)} aria-hidden="true">
            ✓
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function MarketingFinalCta({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description: ReactNode
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
  className?: string
}) {
  return (
    <MarketingSection variant="dark" className={cn('overflow-hidden', className)}>
      <div className="marketing-hero-glow pointer-events-none absolute inset-x-0 bottom-[-18rem] h-[34rem]" />
      <MarketingIntro
        align="center"
        eyebrow={eyebrow}
        title={title}
        description={description}
        className="relative z-10 mx-auto max-w-[46rem]"
        titleClassName="max-w-none text-white"
        descriptionClassName="max-w-[32rem] text-white/70"
        actions={
          <>
            <MarketingButton href={primaryHref} variant="inverse" size="lg">
              {primaryLabel}
            </MarketingButton>
            {secondaryHref && secondaryLabel ? (
              <MarketingButton href={secondaryHref} variant="ghost" size="lg">
                {secondaryLabel}
              </MarketingButton>
            ) : null}
          </>
        }
      />
    </MarketingSection>
  )
}
