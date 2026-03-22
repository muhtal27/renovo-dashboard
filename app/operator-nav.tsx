'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type OperatorNavProps = {
  current?: string
  viewerName?: string | null
}

const NAV_ITEMS = [
  {
    label: 'Cases',
    href: '/eot',
    isActive: (pathname: string) => pathname.startsWith('/eot') || pathname.startsWith('/cases'),
  },
  {
    label: 'Calls',
    href: '/calls',
    isActive: (pathname: string) => pathname === '/calls',
  },
  {
    label: 'Knowledge',
    href: '/knowledge',
    isActive: (pathname: string) => pathname === '/knowledge',
  },
] as const

function getInitials(value: string | null | undefined) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? []

  if (parts.length === 0) {
    return 'R'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function OperatorNav({ current, viewerName }: OperatorNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [fallbackViewerLabel, setFallbackViewerLabel] = useState('Renovo operator')
  void current

  useEffect(() => {
    if (viewerName?.trim()) return

    let cancelled = false

    async function loadViewer() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      setFallbackViewerLabel(
        user?.user_metadata?.full_name?.trim() ||
          user?.email?.trim() ||
          'Renovo operator'
      )
    }

    void loadViewer()

    return () => {
      cancelled = true
    }
  }, [viewerName])

  async function handleSignOut() {
    setSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setSigningOut(false)
      return
    }

    router.replace('/login')
    router.refresh()
  }

  const displayName = viewerName?.trim() || fallbackViewerLabel

  return (
    <div className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
      <nav className="app-grid px-5 py-4 text-stone-900 md:px-8" aria-label="Operator navigation">
        <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/eot"
              className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold tracking-[0.16em] text-stone-900 transition hover:border-stone-300"
            >
              <span className="app-kicker !mb-0 !text-stone-600">Renovo</span>
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive(pathname)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                      : 'text-stone-600 hover:bg-white/70 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-stone-900">{displayName}</p>
              <p className="text-xs text-stone-500">Operator workspace</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-semibold text-stone-700">
              {getInitials(displayName)}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-60"
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
