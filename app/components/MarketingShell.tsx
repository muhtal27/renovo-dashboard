import Link from 'next/link'
import type { ReactNode } from 'react'

type MarketingPath =
  | '/'
  | '/how-it-works'
  | '/pricing'
  | '/demo'
  | '/about'
  | '/integrations'
  | '/security'
  | '/developers'
  | '/investors'
  | '/careers'
  | '/insights'
  | '/book-demo'
  | '/contact'
  | '/privacy'
  | '/terms'
  | '/compliance'
  | '/complaints'
  | '/changelog'

type MarketingShellProps = {
  children: ReactNode
  currentPath: MarketingPath
  navAriaLabel?: string
}

function BrandMark() {
  return (
    <span className="nav-logo" aria-hidden="true">
      <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" opacity="0.55" />
        <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" opacity="0.8" />
        <rect x="34" y="86" width="80" height="18" rx="9" fill="#10b981" />
      </svg>
    </span>
  )
}

const headerNavItems: ReadonlyArray<{ label: string; href: MarketingPath }> = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
  { label: 'About', href: '/about' },
]

const footerProductLinks: ReadonlyArray<{ label: string; href: MarketingPath }> = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
  { label: 'API Docs', href: '/developers' },
  { label: 'Changelog', href: '/changelog' },
]

const footerCompanyLinks: ReadonlyArray<{ label: string; href: MarketingPath }> = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Investors', href: '/investors' },
  { label: 'Careers', href: '/careers' },
  { label: 'Insights', href: '/insights' },
]

const footerLegalLinks: ReadonlyArray<{ label: string; href: MarketingPath }> = [
  { label: 'Compliance', href: '/compliance' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Complaints', href: '/complaints' },
  { label: 'Security', href: '/security' },
]

export function MarketingShell({
  children,
  currentPath,
  navAriaLabel = 'Marketing',
}: MarketingShellProps) {
  return (
    <div className="marketing-page">
      <div className="ambient">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="glow glow-3" />
        <div className="grid-dots" />
      </div>

      <nav className="nav" aria-label={navAriaLabel}>
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <BrandMark />
            <span className="brand-name">Renovo AI</span>
          </Link>
          <div className="nav-links">
            {headerNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={currentPath === item.href ? 'page' : undefined}
                className={currentPath === item.href ? 'current' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="nav-right">
            <Link href="/login" className="sign-in">
              Sign in
            </Link>
            <Link href="/book-demo" className="btn-primary">
              Book a demo
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Link href="/" className="nav-brand">
              <BrandMark />
              <span className="brand-name">Renovo AI</span>
            </Link>
            <p className="footer-brand-blurb">
              Enterprise software for end of tenancy. Built for UK letting agencies. AI assists, humans decide.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              {footerProductLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {footerCompanyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              {footerLegalLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>Renovo AI Ltd · SC833544 · VAT GB483379648 · ICO ZC112030</span>
          <span>© 2026 Renovo AI Ltd</span>
        </div>
      </footer>
    </div>
  )
}
