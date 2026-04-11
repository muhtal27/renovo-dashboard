import { NextResponse } from 'next/server'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await params
  if (!UUID_RE.test(ruleId)) {
    return NextResponse.json({ detail: 'Invalid rule ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/api/integrations/automation/rules/${ruleId}/toggle`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
