import 'server-only'

import type { OperatorTenantContext } from '@/lib/operator-server'
import { buildEotInternalAuthHeaders, getEotApiBaseUrl } from '@/lib/eot-server'
import { byLastActivityDesc } from '@/lib/eot-dashboard'
import type { EotCaseListItem, EotCaseWorkspace } from '@/lib/eot-types'

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
    cache: 'no-store',
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

export async function getEotCaseWorkspaceSnapshot(
  context: OperatorTenantContext,
  caseId: string
) {
  return fetchEotJson<EotCaseWorkspace>(context, `/api/eot/cases/${caseId}`)
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
