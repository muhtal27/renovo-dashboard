import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function GET(request: Request) {
  return proxyEotRequest(request, '/api/street/sync/logs', OPERATOR_PERMISSIONS.VIEW_CASE)
}
