import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { DASHBOARD_SIGN_IN_EXTERNAL, DASHBOARD_SIGN_IN_URL } from '@/lib/marketing-links'

type MarketingShellProps = {
  children: ReactNode
  currentPath:
    | '/'
    | '/demo'
    | '/how-it-works'
    | '/investors'
    | '/security'
    | '/careers'
    | '/partnerships'
    | '/integrations'
    | '/pricing'
    | '/about'
    | '/compliance'
    | '/contact'
    | '/privacy'
    | '/terms'
    | '/complaints'
  navAriaLabel?: string
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
  { label: 'Careers', href: '/careers' },
] as const

const footerLegalLinks = [
  { label: 'Compliance', href: '/compliance' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Complaints', href: '/complaints' },
  { label: 'Security', href: '/security' },
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

function navLinkClass(active: boolean) {
  return active
    ? 'inline-flex items-center whitespace-nowrap text-sm font-medium text-zinc-950'
    : 'inline-flex items-center whitespace-nowrap text-sm font-medium text-zinc-500 hover:text-zinc-950'
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
}: MarketingShellProps) {
  return (
    <div className="marketing-page min-h-screen bg-white text-zinc-900">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="marketing-frame flex min-h-[60px] items-center justify-between gap-3 py-2.5 lg:min-h-[64px] lg:gap-6">
          <Link
            href="/"
            aria-label="Renovo AI home"
            className="inline-flex shrink-0 items-center text-base font-semibold tracking-[-0.02em] text-zinc-950"
          >
            <Image
              src="/logo-new.svg"
              alt="Renovo AI"
              width={112}
              height={22}
              priority
              sizes="(max-width: 1023px) 108px, 112px"
              className="h-auto w-[108px] lg:w-[112px]"
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
                className={navLinkClass(currentPath === item.href)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
            <SignInLink className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-950">
              Sign in
            </SignInLink>
            <Link
              href="/contact"
              className="app-primary-button rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
            >
              Get started
            </Link>
          </div>

          <details className="group relative lg:hidden">
            <summary className="inline-flex min-h-10 list-none items-center rounded-md border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-950 [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-xl border border-zinc-200 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
              <nav className="grid gap-1" aria-label="Mobile marketing navigation">
                {mobileNavLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={currentPath === item.href ? 'page' : undefined}
                    className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-3 grid gap-2 border-t border-zinc-200 pt-3">
                <SignInLink className="rounded-md px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950">
                  Sign in
                </SignInLink>
                <Link
                  href="/contact"
                  className="app-primary-button rounded-md px-4 py-2 text-center text-sm font-medium"
                >
                  Get started
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-white py-10 text-zinc-500">
        <div className="marketing-frame">
          <div className="grid gap-10 border-b border-zinc-100 pb-10 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="text-base font-semibold tracking-[-0.02em] text-zinc-950">Renovo AI</Link>
              <p className="mt-3 max-w-[320px] text-sm leading-6">
                End of tenancy automation for UK letting agencies. Checkouts, claims, and disputes
                in one workflow.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500">
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-500">
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
            <span>Renovo AI Ltd · SC833544 · VAT GB483379648 · ICO ZC112030</span>
            <span>© 2026 Renovo AI Ltd</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
