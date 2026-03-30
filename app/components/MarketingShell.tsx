'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { MarketingButton } from '@/app/components/marketing-ui'
import { DASHBOARD_SIGN_IN_EXTERNAL, DASHBOARD_SIGN_IN_URL } from '@/lib/marketing-links'

type MarketingShellProps = {
  children: ReactNode
  currentPath:
    | '/'
    | '/demo'
    | '/how-it-works'
    | '/investors'
    | '/bug-bounty'
    | '/partnerships'
    | '/integrations'
    | '/pricing'
    | '/about'
    | '/compliance'
    | '/contact'
    | '/privacy'
    | '/terms'
  navAriaLabel?: string
  headerTone?: 'light' | 'dark-overlay'
}

const headerNavItems = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
  { label: 'About', href: '/about' },
] as const

const footerProductLinks = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
] as const

const footerCompanyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Investors', href: '/investors' },
] as const

const footerLegalLinks = [
  { label: 'Compliance', href: '/compliance' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const

function SignInLink({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) {
  if (DASHBOARD_SIGN_IN_EXTERNAL) {
    return (
      <a href={DASHBOARD_SIGN_IN_URL} className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link href={DASHBOARD_SIGN_IN_URL} className={className}>
      {children}
    </Link>
  )
}

function navLinkClass(active: boolean, dark: boolean) {
  if (dark) {
    return active
      ? 'inline-flex items-center whitespace-nowrap text-sm font-medium text-white'
      : 'inline-flex items-center whitespace-nowrap text-sm font-medium text-white/58 transition hover:text-white'
  }

  return active
    ? 'inline-flex items-center whitespace-nowrap text-sm font-medium text-zinc-950'
    : 'inline-flex items-center whitespace-nowrap text-sm font-medium text-zinc-500 transition hover:text-zinc-950'
}

const mobileNavLinks = [
  ...headerNavItems,
  { label: 'Contact', href: '/contact' as const },
  { label: 'Investors', href: '/investors' as const },
  { label: 'Privacy', href: '/privacy' as const },
  { label: 'Terms', href: '/terms' as const },
] as const

export function MarketingShell({
  children,
  currentPath,
  navAriaLabel = 'Marketing',
  headerTone = 'light',
}: MarketingShellProps) {
  const prefersDarkOverlay = headerTone === 'dark-overlay'
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    if (!prefersDarkOverlay) return

    const syncScrollState = () => {
      setIsScrolled(window.scrollY > 32)
    }

    syncScrollState()
    window.addEventListener('scroll', syncScrollState, { passive: true })

    return () => window.removeEventListener('scroll', syncScrollState)
  }, [prefersDarkOverlay])

  const darkHeader = prefersDarkOverlay
  const overlayHeader = prefersDarkOverlay && !isScrolled

  return (
    <div className="marketing-page min-h-screen text-zinc-900">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header
        className={
          overlayHeader
            ? 'sticky top-0 z-30 border-b border-transparent bg-transparent text-white transition-colors duration-300'
            : darkHeader
              ? 'sticky top-0 z-30 border-b border-white/10 bg-[rgba(10,14,26,0.92)] text-white backdrop-blur-xl transition-colors duration-300'
              : 'sticky top-0 z-30 border-b border-black/6 bg-white/88 text-zinc-900 backdrop-blur-xl transition-colors duration-300'
        }
      >
        <div className="marketing-frame flex min-h-[64px] items-center justify-between gap-3 py-2.5 lg:min-h-[72px] lg:gap-6">
          <Link
            href="/"
            aria-label="Renovo AI home"
            className="inline-flex shrink-0 items-center text-base font-semibold tracking-[-0.02em]"
          >
            <Image
              src="/logo-new.svg"
              alt="Renovo AI"
              width={112}
              height={22}
              priority
              className={darkHeader ? 'h-auto w-[112px] brightness-0 invert' : 'h-auto w-[112px]'}
            />
          </Link>

          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-6 px-4 lg:flex xl:gap-8"
            aria-label={navAriaLabel}
          >
            {headerNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-current={currentPath === item.href ? 'page' : undefined}
                className={navLinkClass(currentPath === item.href, darkHeader)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
            <SignInLink
              className={
                darkHeader
                  ? 'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white/58 hover:text-white'
                  : 'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-950'
              }
            >
              Sign in
            </SignInLink>
            <MarketingButton
              href="/contact"
              size="sm"
              variant={darkHeader ? 'inverse' : 'primary'}
              className="whitespace-nowrap rounded-xl"
            >
              Talk to us
            </MarketingButton>
          </div>

          <details className="group relative lg:hidden">
            <summary
              className={
                darkHeader
                  ? 'inline-flex min-h-10 list-none items-center rounded-xl border border-white/12 bg-white/5 px-3.5 py-2 text-sm font-medium text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] [&::-webkit-details-marker]:hidden'
                  : 'inline-flex min-h-10 list-none items-center rounded-xl border border-zinc-200 bg-white/95 px-3.5 py-2 text-sm font-medium text-zinc-950 shadow-[0_10px_24px_rgba(17,24,39,0.05)] [&::-webkit-details-marker]:hidden'
              }
            >
              Menu
            </summary>
            <div
              className={
                darkHeader
                  ? 'absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-[1.25rem] border border-white/10 bg-[rgba(10,14,26,0.98)] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.28)]'
                  : 'absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-[1.25rem] border border-black/8 bg-white/98 p-4 shadow-[0_24px_48px_rgba(17,24,39,0.12)]'
              }
            >
              <nav className="grid gap-1" aria-label="Mobile marketing navigation">
                {mobileNavLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={currentPath === item.href ? 'page' : undefined}
                    className={
                      darkHeader
                        ? 'rounded-xl px-3 py-2 text-sm font-medium text-white/68 hover:bg-white/6 hover:text-white'
                        : 'rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950'
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className={darkHeader ? 'mt-3 grid gap-2 border-t border-white/10 pt-3' : 'mt-3 grid gap-2 border-t border-zinc-200 pt-3'}>
                <SignInLink
                  className={
                    darkHeader
                      ? 'rounded-md px-3 py-2 text-sm font-medium text-white/68 hover:bg-white/6 hover:text-white'
                      : 'rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950'
                  }
                >
                  Sign in
                </SignInLink>
                <MarketingButton
                  href="/contact"
                  size="sm"
                  variant={darkHeader ? 'inverse' : 'primary'}
                  className="w-full rounded-xl"
                >
                  Talk to us
                </MarketingButton>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-black/6 bg-[rgba(255,255,255,0.94)] py-10 text-zinc-500">
        <div className="marketing-frame">
          <div className="grid gap-10 border-b border-zinc-100 pb-10 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <p className="text-base font-semibold tracking-[-0.02em] text-zinc-950">Renovo AI</p>
              <p className="mt-3 max-w-[360px] text-sm leading-6">
                End-of-tenancy automation for UK letting agencies. Checkout evidence, liability
                decisions, and dispute packs in one operational workflow.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Product
              </p>
              <nav className="mt-4 grid gap-2" aria-label="Footer product links">
                {footerProductLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-zinc-500 hover:text-zinc-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Company
              </p>
              <nav className="mt-4 grid gap-2" aria-label="Footer company links">
                {footerCompanyLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-zinc-500 hover:text-zinc-950"
                  >
                    {item.label}
                  </Link>
                ))}
                <SignInLink className="text-sm text-zinc-500 hover:text-zinc-950">
                  Sign in
                </SignInLink>
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Legal
              </p>
              <nav className="mt-4 grid gap-2" aria-label="Footer legal links">
                {footerLegalLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-zinc-500 hover:text-zinc-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-2 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between">
            <span>Renovo AI Ltd - SC833544 - VAT GB483379648</span>
            <span>(c) 2026 Renovo AI Ltd - Edinburgh, Scotland</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
