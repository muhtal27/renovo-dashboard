'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useCrossTabSync } from '@/lib/use-cross-tab-sync'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60_000,
        gcTime: 5 * 60_000,
        // Disabled: the polling intervals on list queries already keep data
        // fresh; focus-refetches on top of that fire redundant requests on
        // every tab switch, which stacks with the auth-per-request cost.
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient()
  }

  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }

  return browserQueryClient
}

function CrossTabSyncSetup() {
  useCrossTabSync()
  return null
}

export function AppQueryClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <CrossTabSyncSetup />
      {children}
    </QueryClientProvider>
  )
}

export { getQueryClient }
