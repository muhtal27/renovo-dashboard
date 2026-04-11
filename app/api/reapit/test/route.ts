import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

/** Test the existing Reapit connection. */
export async function POST(request: Request) {
  return proxyEotRequest(
    request,
    '/api/integrations/reapit/test',
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
