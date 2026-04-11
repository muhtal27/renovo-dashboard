import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params
  return proxyEotRequest(
    request,
    `/api/integrations/connections/${connectionId}`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
