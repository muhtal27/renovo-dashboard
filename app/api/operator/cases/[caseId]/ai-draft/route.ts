import { revalidatePath } from 'next/cache'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

export const maxDuration = 120

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  const response = await proxyEotRequest(
    request,
    `/operator/cases/${caseId}/ai-draft`,
    OPERATOR_PERMISSIONS.GENERATE_CLAIM_OUTPUT,
    { timeoutMs: 120_000 }
  )

  if (response.ok) {
    revalidatePath(`/operator/cases/${caseId}`)
  }

  return response
}
