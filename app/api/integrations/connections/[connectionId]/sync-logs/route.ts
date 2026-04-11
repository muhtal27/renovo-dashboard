import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params
  return proxyEotRequest(
    request,
    `/api/integrations/connections/${connectionId}/sync-logs`,
    OPERATOR_PERMISSIONS.VIEW_CASE
  )
}
