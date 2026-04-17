'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

/**
 * Reapit AppMarket / AgencyCloud launch page.
 *
 * This is the launch URI registered in the Reapit AppMarket listing.
 * When an agent clicks "Launch" in the AppMarket or opens Renovo from
 * within AgencyCloud, this page loads.
 *
 * Context from AgencyCloud is available via window.__REAPIT_MARKETPLACE_GLOBALS__
 * which contains the desktop type context (e.g., property ID, tenancy ID).
 */

type ReapitMarketplaceGlobals = {
  appId?: string
  customerId?: string
  desktopMode?: boolean
  // Desktop type context — populated when launched from a specific AgencyCloud screen
  prpCode?: string    // Property code
  tenCode?: string    // Tenancy code
  cntCode?: string    // Contact code
  lldCode?: string    // Landlord code
}

declare global {
  interface Window {
    __REAPIT_MARKETPLACE_GLOBALS__?: ReapitMarketplaceGlobals
  }
}

function ReapitAppContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [globals, setGlobals] = useState<ReapitMarketplaceGlobals | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'not_connected' | 'error'>('checking')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  async function startReapitConnect() {
    setConnecting(true)
    setConnectError(null)
    try {
      const res = await fetch('/api/reapit/authorize-url')
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Unable to start sign-in')
      }
      const { url } = (await res.json()) as { url: string }
      window.location.href = url
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Unable to start sign-in')
      setConnecting(false)
    }
  }

  // Read AgencyCloud context on mount
  useEffect(() => {
    const g = window.__REAPIT_MARKETPLACE_GLOBALS__
    if (g) {
      setGlobals(g)
    }
    setLoading(false)
  }, [])

  // Check if this customer has an active Renovo connection
  useEffect(() => {
    if (error) {
      setConnectionStatus('error')
      return
    }

    async function checkConnection() {
      try {
        const res = await fetch('/api/reapit/test', { method: 'POST' })
        if (res.ok) {
          const data = (await res.json()) as { ok: boolean }
          setConnectionStatus(data.ok ? 'connected' : 'not_connected')
        } else {
          setConnectionStatus('not_connected')
        }
      } catch {
        setConnectionStatus('not_connected')
      }
    }

    checkConnection()
  }, [error])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-500" />
          <p className="mt-3 text-sm text-zinc-500">Loading Renovo AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <span className="text-sm font-bold text-white">R</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-zinc-900">Renovo AI</h1>
              <p className="text-xs text-zinc-500">End of Tenancy Automation</p>
            </div>
          </div>
          {globals?.desktopMode && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              AgencyCloud
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-900">Authentication Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* AgencyCloud context */}
        {globals?.prpCode && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Property:</span> {globals.prpCode}
              {globals.tenCode && (
                <span className="ml-4">
                  <span className="font-medium">Tenancy:</span> {globals.tenCode}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Connection status */}
        {connectionStatus === 'checking' && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-500" />
            <p className="mt-3 text-sm text-zinc-500">Checking connection...</p>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="space-y-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-emerald-900">Connected to Reapit</h3>
              </div>
              <p className="mt-1 text-sm text-emerald-700">
                Your Reapit account is syncing with Renovo AI.
              </p>
            </div>

            {/* Quick actions */}
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              <h3 className="mb-4 text-sm font-semibold text-zinc-900">Quick Actions</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/operator/cases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <h4 className="text-sm font-medium text-zinc-900">View Cases</h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Manage end-of-tenancy cases synced from Reapit
                  </p>
                </a>
                <a
                  href="/operator/reports"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <h4 className="text-sm font-medium text-zinc-900">Reports</h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    View analytics and portfolio reports
                  </p>
                </a>
                <a
                  href="/operator/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <h4 className="text-sm font-medium text-zinc-900">Settings</h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Configure sync and automation rules
                  </p>
                </a>
                <a
                  href="/operator/communications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-zinc-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <h4 className="text-sm font-medium text-zinc-900">Communications</h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Tenant and landlord communications
                  </p>
                </a>
              </div>
            </div>
          </div>
        )}

        {connectionStatus === 'not_connected' && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-4.486a4.5 4.5 0 0 0-6.364-6.364L4.5 6.818" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">Connect Your Account</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                Sign in with your Reapit account to start syncing end-of-tenancy cases with Renovo AI.
              </p>

              {connectError && (
                <p className="mx-auto mt-4 max-w-sm rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                  {connectError}
                </p>
              )}

              <button
                type="button"
                onClick={startReapitConnect}
                disabled={connecting}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connecting ? 'Redirecting…' : 'Connect with Reapit'}
                {!connecting && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>

              <p className="mx-auto mt-4 max-w-sm text-xs text-zinc-400">
                Already have a Renovo account?{' '}
                <a href="/login" className="text-zinc-600 underline hover:text-zinc-900">
                  Sign in to the dashboard
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {connectionStatus === 'error' && !error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-900">Connection Error</h3>
            <p className="mt-1 text-sm text-amber-700">
              Unable to verify the Reapit connection. Please check your Renovo dashboard settings.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          Renovo AI &mdash; End of Tenancy Automation for UK Letting Agencies
        </div>
      </main>
    </div>
  )
}

export default function ReapitAppPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-emerald-500" />
        </div>
      }
    >
      <ReapitAppContent />
    </Suspense>
  )
}
