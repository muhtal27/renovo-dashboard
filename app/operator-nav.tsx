'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type OperatorNavKey =
  | 'eot_overview'
  | 'eot_cases'
  | 'deposits'
  | 'properties'
  | 'tenancies'
  | 'knowledge'
  | 'maintenance'
  | 'calls'
  | 'rent'
  | 'reporting'
  | 'onboarding'

export function OperatorNav({ current }: { current: OperatorNavKey }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  const [viewerLabel, setViewerLabel] = useState<string>('Signed in')
  void current

  useEffect(() => {
    let cancelled = false

    async function loadViewer() {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email?.trim()
      if (cancelled) return
      setViewerLabel(email ? email : 'Signed in')
    }

    void loadViewer()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignOut() {
    setSigningOut(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setSigningOut(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  return (
    <nav className="app-surface rounded-[1.9rem] p-4 md:p-5" aria-label="Operator navigation">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="app-kicker">End of Tenancy Engine</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Purpose-built for the operator decision flow from review queue to claim output
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            The main surface now follows the end-of-tenancy path first: overview, queue, workspace, review, and claim readiness.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-600">
            {viewerLabel}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-600 disabled:opacity-60"
          >
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-4">
        <p className="app-kicker">Workflow path</p>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          {['Overview', 'EOT Cases', 'Workspace', 'Review', 'Claim Output'].map((step, index) => (
            <div key={step} className="rounded-[1.2rem] border border-stone-200 bg-stone-50/85 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Step {index + 1}
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-stone-200/80 bg-white/80 p-4">
        <p className="app-kicker">Operator shell</p>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Records, portal, and showcase routes have been removed from the main operator surface.
        </p>
      </div>
    </nav>
  )
}
