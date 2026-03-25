'use client'

import { useEffect, useMemo, useState } from 'react'
import { getEotCaseWorkspace, listEotCases } from '@/lib/eot-api'
import type { EotCaseListItem, EotCaseWorkspace } from '@/lib/eot-types'
import { byLastActivityDesc } from '@/lib/eot-dashboard'

type PortfolioState = {
  cases: EotCaseListItem[]
  workspaces: EotCaseWorkspace[]
  loading: boolean
  error: string | null
}

export function useEotPortfolioData() {
  const [state, setState] = useState<PortfolioState>({
    cases: [],
    workspaces: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }))

      try {
        const cases = await listEotCases()
        const sortedCases = [...cases].sort(byLastActivityDesc)

        const workspaces = await Promise.all(
          sortedCases.map((caseItem) => getEotCaseWorkspace(caseItem.id))
        )

        if (cancelled) return

        setState({
          cases: sortedCases,
          workspaces,
          loading: false,
          error: null,
        })
      } catch (error) {
        if (cancelled) return

        setState({
          cases: [],
          workspaces: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load the end-of-tenancy portfolio.',
        })
      }
    }

    void loadPortfolio()

    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(
    () => ({
      ...state,
      hasData: state.cases.length > 0,
    }),
    [state]
  )
}
