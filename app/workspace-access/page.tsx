'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { MarketingShell } from '@/app/components/MarketingShell'
import { getReturnToFromSearch } from '@/lib/return-to'
import { getOperatorLabel, type CurrentOperator } from '@/lib/operator-types'

type SelectionState = {
  loading: boolean
  error: string | null
  membershipId: string | null
}

function getSafeReturnTo() {
  if (typeof window === 'undefined') return '/eot'

  return getReturnToFromSearch(window.location.search)
}

function getReason() {
  if (typeof window === 'undefined') return null

  const value = new URLSearchParams(window.location.search).get('reason')
  return value === 'forbidden' ? 'forbidden' : value === 'membership' ? 'membership' : null
}

export default function WorkspaceAccessPage() {
  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectionState, setSelectionState] = useState<SelectionState>({
    loading: false,
    error: null,
    membershipId: null,
  })

  const returnTo = useMemo(() => getSafeReturnTo(), [])
  const reason = useMemo(() => getReason(), [])

  useEffect(() => {
    let cancelled = false

    async function loadOperator() {
      try {
        const response = await fetch('/api/operator/session', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        })

        if (cancelled) return

        if (response.status === 401) {
          setOperator(null)
          setError(null)
          setLoading(false)
          return
        }

        if (!response.ok) {
          throw new Error('Unable to load workspace access details.')
        }

        const payload = (await response.json()) as CurrentOperator
        setOperator(payload)
        setError(null)
        setLoading(false)
      } catch (requestError) {
        if (cancelled) return

        setOperator(null)
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load workspace access details.'
        )
        setLoading(false)
      }
    }

    void loadOperator()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSelectMembership(membershipId: string) {
    setSelectionState({
      loading: true,
      error: null,
      membershipId,
    })

    try {
      const response = await fetch('/api/operator/active-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ membershipId }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null
        throw new Error(payload?.detail ?? 'Unable to switch workspace access.')
      }

      window.location.href = returnTo
    } catch (selectionError) {
      setSelectionState({
        loading: false,
        error:
          selectionError instanceof Error
            ? selectionError.message
            : 'Unable to switch workspace access.',
        membershipId,
      })
    }
  }

  const operatorLabel = getOperatorLabel(operator)
  const signInHref = `/login?returnTo=${encodeURIComponent(returnTo)}`

  let heading = 'Resolve workspace access'
  let body =
    'Your account needs an active Renovo workspace context before this page can load.'

  if (reason === 'forbidden') {
    heading = 'Access restricted'
    body = 'Your account is signed in, but it does not have permission to open that area.'
  } else if (loading) {
    body = 'Checking your operator session and workspace access now.'
  } else if (!operator?.authUser) {
    heading = 'Sign in required'
    body = 'You need to sign in before Renovo can open this workspace.'
  } else if (operator.profile?.is_active === false) {
    heading = 'Account disabled'
    body = 'This operator account is disabled. Contact Renovo if you need access restored.'
  } else if (operator.requiresTenantSelection) {
    heading = 'Choose a workspace'
    body = 'This account is linked to more than one workspace. Pick the one you want to open.'
  } else if (!operator.memberships.length) {
    heading = 'No active workspace access'
    body = 'This account is signed in, but it is not linked to an active workspace yet.'
  } else if (operator.membership) {
    heading = 'Workspace available'
    body = 'Your workspace access is configured. Continue back into the operator app.'
  }

  return (
    <MarketingShell currentPath="/contact">
      <section className="marketing-frame pb-16 pt-14 md:pt-24">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[rgba(15,14,13,0.1)] bg-white p-7 shadow-[0_20px_60px_rgba(15,14,13,0.08)] md:p-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e1f5ee] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em] text-[#0f6e56]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0f6e56]" />
            Operator access
          </p>

          <h1 className="mt-6 text-[clamp(2rem,4.2vw,3rem)] leading-[1.06] tracking-[-0.03em]">
            {heading}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#3d3b37]">{body}</p>

          {operator?.authUser ? (
            <div className="mt-6 rounded-2xl border border-[rgba(15,14,13,0.08)] bg-[#faf8f5] px-5 py-4 text-sm text-[#4b4741]">
              Signed in as <span className="font-medium text-[#0f0e0d]">{operatorLabel || operator.authUser.email || 'Operator account'}</span>
            </div>
          ) : null}

          {loading ? (
            <div className="mt-8 rounded-2xl border border-[rgba(15,14,13,0.08)] bg-[#fcfbf9] px-5 py-5 text-sm text-[#4b4741]">
              Loading access details...
            </div>
          ) : null}

          {error ? (
            <div className="mt-8 rounded-2xl border border-[rgba(163,45,45,0.2)] bg-[#fcebeb] px-5 py-4 text-sm text-[#7f2727]">
              {error}
            </div>
          ) : null}

          {!loading && !operator?.authUser ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={signInHref} className="app-primary-button rounded px-6 py-3 text-sm font-medium">
                Sign in
              </Link>
              <Link href="/contact" className="app-secondary-button rounded px-6 py-3 text-sm font-medium">
                Contact Renovo
              </Link>
            </div>
          ) : null}

          {!loading && operator?.profile?.is_active === false ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="app-primary-button rounded px-6 py-3 text-sm font-medium">
                Contact support
              </Link>
              <Link href={signInHref} className="app-secondary-button rounded px-6 py-3 text-sm font-medium">
                Use another account
              </Link>
            </div>
          ) : null}

          {!loading && operator?.requiresTenantSelection ? (
            <div className="mt-8 space-y-3">
              {operator.memberships.map((membership) => {
                const selecting =
                  selectionState.loading && selectionState.membershipId === membership.id

                return (
                  <button
                    key={membership.id}
                    type="button"
                    onClick={() => handleSelectMembership(membership.id)}
                    disabled={selectionState.loading}
                    className="flex w-full items-center justify-between rounded-2xl border border-[rgba(15,14,13,0.1)] bg-[#fcfbf9] px-5 py-4 text-left transition hover:border-[rgba(15,14,13,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      <span className="block text-base text-[#0f0e0d]">Workspace {membership.tenant_id}</span>
                      <span className="mt-1 block text-sm text-[#7a7670]">
                        Role: {membership.role}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-[#0f0e0d]">
                      {selecting ? 'Opening...' : 'Open'}
                    </span>
                  </button>
                )
              })}

              {selectionState.error ? (
                <div className="rounded-2xl border border-[rgba(163,45,45,0.2)] bg-[#fcebeb] px-5 py-4 text-sm text-[#7f2727]">
                  {selectionState.error}
                </div>
              ) : null}
            </div>
          ) : null}

          {!loading && operator?.authUser && !operator.requiresTenantSelection && !operator.memberships.length ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="app-primary-button rounded px-6 py-3 text-sm font-medium">
                Request workspace access
              </Link>
              <Link href={signInHref} className="app-secondary-button rounded px-6 py-3 text-sm font-medium">
                Use another account
              </Link>
            </div>
          ) : null}

          {!loading && operator?.membership && reason !== 'forbidden' ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={returnTo} className="app-primary-button rounded px-6 py-3 text-sm font-medium">
                Continue to workspace
              </Link>
              <Link href="/eot" className="app-secondary-button rounded px-6 py-3 text-sm font-medium">
                Open checkouts
              </Link>
            </div>
          ) : null}

          {!loading && operator?.membership && reason === 'forbidden' ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/eot" className="app-primary-button rounded px-6 py-3 text-sm font-medium">
                Open checkouts
              </Link>
              <Link href="/overview" className="app-secondary-button rounded px-6 py-3 text-sm font-medium">
                Go to overview
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </MarketingShell>
  )
}
