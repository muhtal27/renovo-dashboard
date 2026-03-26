import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

export async function GET(request: Request) {
  return proxyEotRequest(request, '/api/eot/cases', OPERATOR_PERMISSIONS.VIEW_CASE)
}

export async function POST(request: Request) {
  return proxyEotRequest(request, '/api/eot/cases', OPERATOR_PERMISSIONS.CREATE_CASE)
}
