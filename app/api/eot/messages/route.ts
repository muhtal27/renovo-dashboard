import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function POST(request: Request) {
  return proxyEotRequest(request, '/api/eot/messages', OPERATOR_PERMISSIONS.EDIT_CASE)
}
