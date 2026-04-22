import Link from 'next/link'
import type { ReactNode } from 'react'
import { MarketingClientEffects } from '@/app/components/MarketingClientEffects'

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
  | '/status'

type MarketingShellProps = {
  children: ReactNode
  currentPath: MarketingPath
  navAriaLabel?: string
}

function BrandMark() {
  return (
    <span className="nav-logo" aria-hidden="true">
      <svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" />
        <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" />
        <rect x="34" y="86" width="80" height="18" rx="9" fill="#10b981" />
        <rect x="34.5" y="86.5" width="79" height="2" rx="1" fill="#ffffff" opacity="0.35" />
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

type FooterLink = { label: string; href: MarketingPath; indicator?: 'live' }

const footerProductLinks: ReadonlyArray<FooterLink> = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Demo', href: '/demo' },
  { label: 'API Docs', href: '/developers' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Status', href: '/status', indicator: 'live' },
]

const footerCompanyLinks: ReadonlyArray<FooterLink> = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Investors', href: '/investors' },
  { label: 'Careers', href: '/careers' },
  { label: 'Insights', href: '/insights' },
]

const footerLegalLinks: ReadonlyArray<FooterLink> = [
  { label: 'Compliance', href: '/compliance' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Complaints', href: '/complaints' },
  { label: 'Security', href: '/security' },
]

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.indicator === 'live') {
    return (
      <li>
        <Link href={link.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {link.label}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px rgba(16,185,129,0.7)',
            }}
          />
        </Link>
      </li>
    )
  }
  return (
    <li>
      <Link href={link.href}>{link.label}</Link>
    </li>
  )
}

/**
 * Shared hidden SVG defs — referenced by chart toolkit classes via url(#id).
 * Rendered once per marketing-shell page; invisible but accessible to every
 * SVG chart rendered inside .marketing-page.
 */
function MarketingSvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }} aria-hidden="true">
      <defs>
        <linearGradient id="grad-em" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
        <linearGradient id="grad-em-sky" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="grad-violet-em" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="grad-amber-em" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <linearGradient id="spark-area-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-area-grad-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="spark-area-grad-violet" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="grad-donut" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6ee7b7" />
        </linearGradient>
        <filter id="chart-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

/**
 * Animated ambient background: mesh blobs + rotating conic + aurora sweep +
 * static grain + cursor-following spotlight. The three legacy .glow divs
 * remain for back-compat — they sit behind the mesh and blend harmlessly.
 */
function MarketingAmbient() {
  return (
    <div className="ambient">
      <div className="conic" />
      <div className="aurora" />
      <div className="mesh">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
        <div className="mesh-blob mesh-blob-4" />
        <div className="mesh-blob mesh-blob-5" />
        <div className="mesh-blob mesh-blob-6" />
      </div>
      <div className="glow glow-1" />
      <div className="glow glow-2" />
      <div className="glow glow-3" />
      <div className="grid-dots" />
      <div className="grain" />
      <div className="spotlight" id="ambient-spotlight" />
    </div>
  )
}

export function MarketingShell({
  children,
  currentPath,
  navAriaLabel = 'Marketing',
}: MarketingShellProps) {
  return (
    <div className="marketing-page">
      <MarketingSvgDefs />
      <MarketingAmbient />
      <MarketingClientEffects />

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
                <FooterLinkItem key={item.href} link={item} />
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {footerCompanyLinks.map((item) => (
                <FooterLinkItem key={item.href} link={item} />
              ))}
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              {footerLegalLinks.map((item) => (
                <FooterLinkItem key={item.href} link={item} />
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
