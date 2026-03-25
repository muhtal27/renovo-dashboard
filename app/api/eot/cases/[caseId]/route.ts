import { proxyEotRequest } from '@/lib/eot-proxy'

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  return proxyEotRequest(request, `/api/eot/cases/${caseId}`)
}
