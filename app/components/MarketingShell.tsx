import Link from 'next/link'
import type { ReactNode } from 'react'
import { DASHBOARD_SIGN_IN_EXTERNAL, DASHBOARD_SIGN_IN_URL } from '@/lib/marketing-links'

function BrandMark({ withText = true, size = 28 }: { withText?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span
          className="absolute rounded-[10px]"
          style={{
            inset: -4,
            background: 'radial-gradient(circle, rgba(16,185,129,0.25), transparent 70%)',
            zIndex: -1,
          }}
        />
        <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="block h-full w-full">
          <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" opacity="0.55" />
          <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" opacity="0.8" />
          <rect x="34" y="86" width="80" height="18" rx="9" fill="#10b981" />
        </svg>
      </span>
      {withText && <span className="font-semibold tracking-[-0.01em] text-white">Renovo AI</span>}
    </span>
  )
}

type MarketingShellProps = {
  children: ReactNode
  currentPath:
    | '/'
    | '/demo'
    | '/how-it-works'
    | '/investors'
    | '/security'
    | '/careers'
    | '/book-demo'
    | '/partnerships'
    | '/integrations'
    | '/pricing'
    | '/about'
    | '/compliance'
    | '/contact'
    | '/privacy'
    | '/terms'
    | '/complaints'
    | '/insights'
    | '/changelog'
    | '/developers'
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
  { label: 'API Docs', href: '/developers' },
  { label: 'Changelog', href: '/changelog' },
] as const

const footerCompanyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Investors', href: '/investors' },
  { label: 'Careers', href: '/careers' },
  { label: 'Insights', href: '/insights' },
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
    ? 'inline-flex items-center whitespace-nowrap text-sm font-medium text-white'
    : 'inline-flex items-center whitespace-nowrap text-sm font-medium text-white/60 transition-colors hover:text-white'
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
    <div className="marketing-page marketing-dark dark-header relative min-h-screen overflow-x-clip bg-[#05070e] text-white">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[12%] top-[-10%] h-[720px] w-[720px] rounded-full bg-emerald-500/[0.08] blur-[160px]" />
        <div className="absolute right-[-5%] top-[30%] h-[560px] w-[560px] rounded-full bg-cyan-500/[0.04] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#05070e]/80 backdrop-blur-xl">
        <div className="marketing-frame flex min-h-[60px] items-center justify-between gap-3 py-2.5 lg:min-h-[64px] lg:gap-6">
          <Link
            href="/"
            aria-label="Renovo AI home"
            className="inline-flex shrink-0 items-center"
          >
            <BrandMark />
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

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <SignInLink className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white">
              Sign in
            </SignInLink>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              Book a demo
            </Link>
          </div>

          <details className="group relative lg:hidden">
            <summary className="inline-flex min-h-10 list-none items-center rounded-md border border-white/20 px-3.5 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 mt-2 w-[min(86vw,22rem)] rounded-xl border border-white/10 bg-[#0a0e1a] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
              <nav className="grid gap-1" aria-label="Mobile marketing navigation">
                {mobileNavLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={currentPath === item.href ? 'page' : undefined}
                    className="rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.04] hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
                <SignInLink className="rounded-md px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/[0.04] hover:text-white">
                  Sign in
                </SignInLink>
                <Link
                  href="/book-demo"
                  className="rounded-md bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-emerald-400"
                >
                  Book a demo
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="relative z-10">
        {children}
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] bg-[#05070e] py-14">
        <div className="marketing-frame">
          <div className="grid gap-10 border-b border-white/[0.04] pb-10 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Renovo AI home">
                <BrandMark size={26} />
              </Link>
              <p className="mt-3 max-w-[280px] text-[13px] leading-[1.7] text-white/55">
                Enterprise software for end of tenancy. Built for UK letting agencies. AI assists, humans decide.
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                Product
              </p>
              <nav className="mt-4 grid gap-0.5" aria-label="Footer product links">
                {footerProductLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-[13px] leading-[2.3] text-white/50 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                Company
              </p>
              <nav className="mt-4 grid gap-0.5" aria-label="Footer company links">
                {footerCompanyLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-[13px] leading-[2.3] text-white/50 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
                Legal
              </p>
              <nav className="mt-4 grid gap-0.5" aria-label="Footer legal links">
                {footerLegalLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-[13px] leading-[2.3] text-white/50 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
            <span>Renovo AI Ltd · SC833544 · VAT GB483379648 · ICO ZC112030</span>
            <span>© 2026 Renovo AI Ltd</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
