'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getEotCaseWorkspace, listEotCases } from '@/lib/eot-api'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type { EotPortfolioSnapshot } from '@/lib/eot-server-data'

async function fetchPortfolioSnapshot(): Promise<EotPortfolioSnapshot> {
  const cases = await listEotCases()
  const sortedCases = [...cases].sort(byLastActivityDesc)
  const workspaces = await Promise.all(
    sortedCases.map((caseItem) => getEotCaseWorkspace(caseItem.id))
  )

  return { cases: sortedCases, workspaces }
}

export function useEotPortfolioData(initialSnapshot?: EotPortfolioSnapshot | null) {
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['eot', 'portfolio'],
    queryFn: fetchPortfolioSnapshot,
    initialData: initialSnapshot ?? undefined,
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
  })

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Unable to load the end-of-tenancy portfolio.'
    : null

  return useMemo(
    () => ({
      cases: data?.cases ?? [],
      workspaces: data?.workspaces ?? [],
      loading: isLoading,
      error,
      hasData: (data?.cases.length ?? 0) > 0,
    }),
    [data, isLoading, error]
  )
}
