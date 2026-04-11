import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function GET(request: Request) {
  return proxyEotRequest(
    request,
    '/api/integrations/automation/logs',
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
