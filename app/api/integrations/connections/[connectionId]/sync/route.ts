import { NextResponse } from 'next/server'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const { connectionId } = await params
  if (!UUID_RE.test(connectionId)) {
    return NextResponse.json({ detail: 'Invalid connection ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/api/integrations/connections/${connectionId}/sync`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
