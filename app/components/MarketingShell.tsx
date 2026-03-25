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
    | '/partnerships'
    | '/integrations'
    | '/pricing'
    | '/about'
    | '/contact'
    | '/privacy'
    | '/terms'
  navAriaLabel?: string
}

const headerNavItems = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
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

function navLinkClass(active: boolean) {
  return active
    ? 'text-sm font-medium text-[#0f0e0d]'
    : 'text-sm font-medium text-[#4b4741] hover:text-[#0f0e0d]'
}

export function MarketingShell({
  children,
  currentPath,
  navAriaLabel = 'Marketing',
}: MarketingShellProps) {
  return (
    <main className="marketing-page min-h-screen bg-[#faf8f5] text-[#0f0e0d]">
      <header className="sticky top-0 z-30 border-b border-[rgba(15,14,13,0.08)] bg-[rgba(250,248,245,0.94)] backdrop-blur-[14px]">
        <div className="marketing-frame flex min-h-[76px] items-center justify-between gap-4 py-4">
          <Link href="/" aria-label="Renovo home" className="inline-flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f0e0d] text-[#faf8f5]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM12.5 10v5M10 12.5h5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="font-[var(--font-dm-serif)] text-[1.4rem] tracking-[-0.03em]">
              Renovo
            </span>
          </Link>

          <nav className="hidden items-center gap-8 xl:flex" aria-label={navAriaLabel}>
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

          <div className="hidden items-center gap-3 md:flex">
            <SignInLink className="rounded px-4 py-2 text-sm font-medium text-[#4b4741] hover:text-[#0f0e0d]">
              Sign in
            </SignInLink>
            <Link
              href="/contact"
              className="app-primary-button rounded px-5 py-2.5 text-sm font-medium"
            >
              Request access
            </Link>
          </div>

          <details className="group relative md:hidden">
            <summary className="inline-flex list-none items-center rounded border border-[rgba(15,14,13,0.18)] px-3 py-2 text-sm font-medium text-[#0f0e0d] [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-xl border border-[rgba(15,14,13,0.1)] bg-[#faf8f5] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.08)]">
              <nav className="grid gap-1" aria-label="Mobile marketing navigation">
                {headerNavItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={currentPath === item.href ? 'page' : undefined}
                    className="rounded px-3 py-2 text-sm font-medium text-[#4b4741] hover:bg-[#f2efe9] hover:text-[#0f0e0d]"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/investors"
                  aria-current={currentPath === '/investors' ? 'page' : undefined}
                  className="rounded px-3 py-2 text-sm font-medium text-[#4b4741] hover:bg-[#f2efe9] hover:text-[#0f0e0d]"
                >
                  Investors
                </Link>
                <Link
                  href="/privacy"
                  aria-current={currentPath === '/privacy' ? 'page' : undefined}
                  className="rounded px-3 py-2 text-sm font-medium text-[#4b4741] hover:bg-[#f2efe9] hover:text-[#0f0e0d]"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  aria-current={currentPath === '/terms' ? 'page' : undefined}
                  className="rounded px-3 py-2 text-sm font-medium text-[#4b4741] hover:bg-[#f2efe9] hover:text-[#0f0e0d]"
                >
                  Terms
                </Link>
              </nav>

              <div className="mt-3 grid gap-2 border-t border-[rgba(15,14,13,0.1)] pt-3">
                <SignInLink className="rounded px-3 py-2 text-sm font-medium text-[#4b4741] hover:bg-[#f2efe9] hover:text-[#0f0e0d]">
                  Sign in
                </SignInLink>
                <Link
                  href="/contact"
                  className="app-primary-button rounded px-4 py-2 text-center text-sm font-medium"
                >
                  Request access
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      <div>{children}</div>

      <footer className="bg-[#11100f] px-0 pb-10 pt-16 text-[rgba(255,255,255,0.62)]">
        <div className="marketing-frame">
          <div className="grid gap-10 border-b border-[rgba(255,255,255,0.08)] pb-10 md:grid-cols-2 xl:grid-cols-[2.2fr_1fr_1fr_1fr]">
            <div>
              <p className="font-[var(--font-dm-serif)] text-[1.6rem] tracking-[-0.03em] text-white">
                Renovo
              </p>
              <p className="mt-3 max-w-[320px] text-sm leading-7">
                End of tenancy, automated. Built for UK property managers who want a clearer,
                more defensible workflow.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.78)]">Product</p>
              <nav className="mt-4 grid gap-2" aria-label="Footer product links">
                {footerProductLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.86)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.78)]">Company</p>
              <nav className="mt-4 grid gap-2" aria-label="Footer company links">
                {footerCompanyLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.86)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <SignInLink className="text-sm text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.86)]">
                  Sign in
                </SignInLink>
              </nav>
            </div>

            <div>
              <p className="text-sm font-medium text-[rgba(255,255,255,0.78)]">Legal</p>
              <nav className="mt-4 grid gap-2" aria-label="Footer legal links">
                {footerLegalLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.86)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
            <span>(c) 2026 Renovo - Edinburgh, Scotland</span>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-xs text-[rgba(255,255,255,0.55)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0f6e56]" />
              renovoai.co.uk
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
