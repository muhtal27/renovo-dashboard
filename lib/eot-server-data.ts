import 'server-only'

import type { OperatorTenantContext } from '@/lib/operator-server'
import { buildEotInternalAuthHeaders, getEotApiBaseUrl } from '@/lib/eot-server'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type {
  EotCaseListItem,
  EotCaseWorkspace,
  EotCaseWorkspaceSummary,
  EotReportSummary,
} from '@/lib/eot-types'

export type EotPortfolioSnapshot = {
  cases: EotCaseListItem[]
  workspaces: EotCaseWorkspace[]
}

function buildBackendUrl(pathname: string) {
  return new URL(pathname, getEotApiBaseUrl())
}

async function fetchEotJson<T>(
  context: OperatorTenantContext,
  pathname: string
): Promise<T> {
  const response = await fetch(buildBackendUrl(pathname), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...buildEotInternalAuthHeaders({
        userId: context.user.id,
        tenantId: context.tenantId,
        role: context.role,
        membershipId: context.membershipId,
        membershipStatus: context.membershipStatus,
      }),
    },
    next: { revalidate: 60 },
  })

  const text = await response.text()
  let payload: unknown = null

  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : `Request failed with status ${response.status}.`

    throw new Error(detail)
  }

  return payload as T
}

export async function getEotCaseListSnapshot(context: OperatorTenantContext) {
  const cases = await fetchEotJson<EotCaseListItem[]>(context, '/api/eot/cases')
  return [...cases].sort(byLastActivityDesc)
}

async function getEotCaseWorkspaceSnapshot(
  context: OperatorTenantContext,
  caseId: string
) {
  return fetchEotJson<EotCaseWorkspace>(context, `/api/eot/cases/${caseId}`)
}

export async function getEotCaseWorkspaceSummarySnapshot(
  context: OperatorTenantContext,
  caseId: string
) {
  return fetchEotJson<EotCaseWorkspaceSummary>(context, `/api/eot/cases/${caseId}/summary`)
}

export async function getEotPortfolioSnapshot(context: OperatorTenantContext) {
  const cases = await getEotCaseListSnapshot(context)
  const workspaces = await Promise.all(
    cases.map((caseItem) => getEotCaseWorkspaceSnapshot(context, caseItem.id))
  )

  return {
    cases,
    workspaces,
  } satisfies EotPortfolioSnapshot
}

export async function getEotInventoryFeedbackSnapshot(context: OperatorTenantContext) {
  const cases = await getEotCaseListSnapshot(context)
  const casesWithIssues = cases.filter((c) => c.issue_count > 0)

  const issueResults = await Promise.all(
    casesWithIssues.map(async (caseItem) => {
      const issues = await fetchEotJson<import('@/lib/eot-types').EotIssue[]>(
        context,
        `/api/eot/cases/${caseItem.id}/issues`
      )
      return issues.map((issue) => ({ issue, caseItem }))
    })
  )

  return issueResults.flat()
}

export async function getEotTenancyListSnapshot(context: OperatorTenantContext) {
  return fetchEotJson<import('@/lib/eot-types').EotTenancyListItem[]>(
    context,
    '/api/eot/tenancies'
  )
}

export function getEotReportSummary(context: OperatorTenantContext) {
  return fetchEotJson<EotReportSummary>(context, '/api/eot/reports/summary')
}
