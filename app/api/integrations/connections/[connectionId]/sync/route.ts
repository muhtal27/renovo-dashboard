import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params
  return proxyEotRequest(
    request,
    `/api/integrations/connections/${connectionId}/sync`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
