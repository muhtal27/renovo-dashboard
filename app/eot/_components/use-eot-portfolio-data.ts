'use client'

import { useEffect, useMemo, useState } from 'react'
import { getEotCaseWorkspace, listEotCases } from '@/lib/eot-api'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type { EotPortfolioSnapshot } from '@/lib/eot-server-data'

type PortfolioState = EotPortfolioSnapshot & {
  loading: boolean
  error: string | null
}

const PORTFOLIO_CACHE_TTL_MS = 30_000

let cachedPortfolio: EotPortfolioSnapshot | null = null
let cachedPortfolioAt = 0
let inFlightPortfolioRequest: Promise<EotPortfolioSnapshot> | null = null

function primePortfolioCache(snapshot: EotPortfolioSnapshot | null | undefined) {
  if (!snapshot) {
    return
  }

  cachedPortfolio = snapshot
  cachedPortfolioAt = Date.now()
}

async function fetchPortfolioSnapshot(): Promise<EotPortfolioSnapshot> {
  const cases = await listEotCases()
  const sortedCases = [...cases].sort(byLastActivityDesc)
  const workspaces = await Promise.all(
    sortedCases.map((caseItem) => getEotCaseWorkspace(caseItem.id))
  )

  return {
    cases: sortedCases,
    workspaces,
  }
}

async function loadPortfolioSnapshot(forceRefresh = false): Promise<EotPortfolioSnapshot> {
  const now = Date.now()

  if (!forceRefresh && cachedPortfolio && now - cachedPortfolioAt < PORTFOLIO_CACHE_TTL_MS) {
    return cachedPortfolio
  }

  if (!forceRefresh && inFlightPortfolioRequest) {
    return inFlightPortfolioRequest
  }

  const request = fetchPortfolioSnapshot()
    .then((snapshot) => {
      cachedPortfolio = snapshot
      cachedPortfolioAt = Date.now()
      return snapshot
    })
    .finally(() => {
      if (inFlightPortfolioRequest === request) {
        inFlightPortfolioRequest = null
      }
    })

  inFlightPortfolioRequest = request

  return request
}

export function invalidateEotPortfolioCache() {
  cachedPortfolio = null
  cachedPortfolioAt = 0
  inFlightPortfolioRequest = null
}

export function useEotPortfolioData(initialSnapshot?: EotPortfolioSnapshot | null) {
  primePortfolioCache(initialSnapshot)

  const [state, setState] = useState<PortfolioState>(() => ({
    cases: initialSnapshot?.cases ?? cachedPortfolio?.cases ?? [],
    workspaces: initialSnapshot?.workspaces ?? cachedPortfolio?.workspaces ?? [],
    loading: initialSnapshot == null && cachedPortfolio === null,
    error: null,
  }))

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      if (initialSnapshot) {
        return
      }

      const shouldRefreshInBackground = Boolean(cachedPortfolio)

      if (!shouldRefreshInBackground) {
        setState((current) => ({
          ...current,
          loading: true,
          error: null,
        }))
      }

      try {
        const snapshot = await loadPortfolioSnapshot(shouldRefreshInBackground)

        if (cancelled) return

        setState({
          cases: snapshot.cases,
          workspaces: snapshot.workspaces,
          loading: false,
          error: null,
        })
      } catch (error) {
        if (cancelled) return

        setState((current) => ({
          cases: current.cases,
          workspaces: current.workspaces,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load the end-of-tenancy portfolio.',
        }))
      }
    }

    void loadPortfolio()

    return () => {
      cancelled = true
    }
  }, [initialSnapshot])

  return useMemo(
    () => ({
      ...state,
      hasData: state.cases.length > 0,
    }),
    [state]
  )
}
