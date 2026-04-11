import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { templateId } = await params
  return proxyEotRequest(
    request,
    `/api/integrations/automation/templates/${templateId}/activate`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
