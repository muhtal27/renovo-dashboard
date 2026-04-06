'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { broadcastInvalidation } from '@/lib/use-cross-tab-sync'
import {
  listEotCases,
  listEotTenancies,
  getEotCaseWorkspace,
  getEotCaseWorkspaceSummary,
  listEotCaseIssues,
} from '@/lib/eot-api'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type {
  EotCaseListItem,
  EotCaseWorkspace,
  EotCaseWorkspaceSummary,
  EotIssue,
  EotTenancyListItem,
} from '@/lib/eot-types'

// ── Query keys ──────────────────────────────────────────────────────

export const eotKeys = {
  cases: ['eot', 'cases'] as const,
  caseWorkspace: (caseId: string) => ['eot', 'case', caseId, 'workspace'] as const,
  caseSummary: (caseId: string) => ['eot', 'case', caseId, 'summary'] as const,
  caseIssues: (caseId: string) => ['eot', 'case', caseId, 'issues'] as const,
  tenancies: ['eot', 'tenancies'] as const,
  assignees: ['operator', 'assignees'] as const,
}

// ── Cases ───────────────────────────────────────────────────────────

export function useEotCases(initialData?: EotCaseListItem[] | null) {
  return useQuery({
    queryKey: eotKeys.cases,
    queryFn: async () => {
      const cases = await listEotCases()
      return [...cases].sort(byLastActivityDesc)
    },
    initialData: initialData ?? undefined,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

// ── Case workspace ────────���─────────────────────────────────────────

export function useEotCaseWorkspace(caseId: string, initialData?: EotCaseWorkspace | null) {
  return useQuery({
    queryKey: eotKeys.caseWorkspace(caseId),
    queryFn: () => getEotCaseWorkspace(caseId),
    initialData: initialData ?? undefined,
  })
}

// ── Case summary ────────────────────────────────────────────────────

export function useEotCaseSummary(caseId: string, initialData?: EotCaseWorkspaceSummary | null) {
  return useQuery({
    queryKey: eotKeys.caseSummary(caseId),
    queryFn: () => getEotCaseWorkspaceSummary(caseId),
    initialData: initialData ?? undefined,
  })
}

// ── Case issues ─────────────────────────────────────────────────────

export function useEotCaseIssues(caseId: string) {
  return useQuery({
    queryKey: eotKeys.caseIssues(caseId),
    queryFn: () => listEotCaseIssues(caseId),
  })
}

// ── Tenancies ───────────────────────────────────────────────────────

export function useEotTenancies(initialData?: EotTenancyListItem[] | null) {
  return useQuery({
    queryKey: eotKeys.tenancies,
    queryFn: listEotTenancies,
    initialData: initialData ?? undefined,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

// ── Assignees ───────────────────────────────────────────────────────

type Assignee = {
  userId: string
  fullName: string | null
  email: string | null
}

export function useOperatorAssignees() {
  return useQuery({
    queryKey: eotKeys.assignees,
    queryFn: async () => {
      const res = await fetch('/api/operator/assignees')
      const data = (await res.json()) as { assignees?: Assignee[] }
      return data.assignees ?? []
    },
    staleTime: 5 * 60_000,
  })
}

// ── Inventory feedback (all issues across cases) ────────────────────

type FeedbackRow = {
  issue: EotIssue
  caseItem: EotCaseListItem
}

export function useInventoryFeedback(initialData?: FeedbackRow[] | null) {
  return useQuery({
    queryKey: ['eot', 'inventory-feedback'],
    queryFn: async (): Promise<FeedbackRow[]> => {
      const res = await fetch('/api/eot/feedback')
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const detail = body?.detail ?? `Request failed with status ${res.status}.`
        throw new Error(detail)
      }
      return res.json()
    },
    initialData: initialData ?? undefined,
    staleTime: 5 * 60_000,
  })
}

// ── Invalidation helpers ─────��──────────────────────────────────────

export function useInvalidateEotCases() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: eotKeys.cases })
    broadcastInvalidation([eotKeys.cases])
  }
}

export function useInvalidateEotCase(caseId: string) {
  const queryClient = useQueryClient()
  return () => {
    const keys = [
      eotKeys.caseWorkspace(caseId),
      eotKeys.caseSummary(caseId),
      eotKeys.caseIssues(caseId),
    ]
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key })
    }
    broadcastInvalidation(keys)
  }
}
