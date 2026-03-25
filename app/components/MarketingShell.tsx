import Link from 'next/link'
import type { ReactNode } from 'react'

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

const desktopNavItems = [
  { label: 'How it works', type: 'route', href: '/how-it-works' },
  { label: 'Features', type: 'anchor', hash: '#features' },
  { label: "Who it's for", type: 'anchor', hash: '#who-its-for' },
  { label: 'About', type: 'route', href: '/about' },
  { label: 'Early access', type: 'anchor', hash: '#waitlist' },
] as const

const mobileNavItems = [
  { label: 'About', type: 'route', href: '/about' },
] as const

const legalNavItems = [
  { label: 'Contact', href: '/contact' },
  { label: 'Investors', href: '/investors' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const

function getHref(
  item: { type: 'route'; href: string } | { type: 'anchor'; hash: string },
  currentPath: MarketingShellProps['currentPath']
) {
  if (item.type === 'route') return item.href
  return currentPath === '/' ? item.hash : `/${item.hash}`
}

function isActive(
  item: { type: 'route'; href: string } | { type: 'anchor'; hash: string },
  currentPath: MarketingShellProps['currentPath']
) {
  return item.type === 'route' && item.href === currentPath
}

function getNavClass(active: boolean) {
  return active
    ? 'text-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-4'
    : 'text-sm font-medium text-stone-600 hover:text-stone-900'
}

export function MarketingShell({
  children,
  currentPath,
  navAriaLabel = 'Marketing',
}: MarketingShellProps) {
  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="w-full space-y-6">
        <header className="sticky top-0 z-30">
          <div className="app-surface flex items-center justify-between gap-4 rounded-[1.45rem] border border-stone-200/85 px-4 py-3 backdrop-blur md:px-5">
            <Link
              href="/"
              aria-label="Renovo home"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white/90"
            >
              <span className="sr-only">Renovo</span>
              <span className="grid grid-cols-[10px_1fr] gap-1.5">
                <span className="h-4 rounded-[5px] border border-stone-400 bg-stone-50" />
                <span className="flex flex-col justify-center gap-1">
                  <span className="h-[1.5px] w-3 rounded-full bg-stone-700" />
                  <span className="h-[1.5px] w-4 rounded-full bg-stone-400" />
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-4 md:flex" aria-label={navAriaLabel}>
              {desktopNavItems.map((item) => {
                const href = getHref(item, currentPath)
                const active = isActive(item, currentPath)

                return (
                  <Link
                    key={item.label}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={getNavClass(active)}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              {mobileNavItems.map((item) => {
                const href = getHref(item, currentPath)
                const active = isActive(item, currentPath)

                return (
                  <Link
                    key={item.label}
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={active ? 'inline-flex text-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 md:hidden' : 'inline-flex text-sm font-medium text-stone-700 hover:text-stone-900 md:hidden'}
                  >
                    {item.label}
                  </Link>
                )
              })}

              <Link
                href="/demo"
                className="app-primary-button rounded-full px-4 py-2 text-sm font-medium"
              >
                View live demo
              </Link>

              <Link
                href="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 lg:inline-flex"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>

        {children}

        <footer className="app-surface rounded-[1.9rem] border border-stone-200/85 px-5 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="app-kicker">Renovo</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                End-of-tenancy automation for UK property managers and letting agencies.
              </p>
              <p className="mt-2 text-xs text-stone-500">© 2026 Renovo.</p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Footer">
                {desktopNavItems.map((item) => {
                  const href = getHref(item, currentPath)
                  const active = isActive(item, currentPath)

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={getNavClass(active)}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                <Link
                  href="/login"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900"
                >
                  Sign in
                </Link>
              </nav>

              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Legal">
                {legalNavItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium text-stone-600 hover:text-stone-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
