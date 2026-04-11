import { NextResponse } from 'next/server'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  const { caseId } = await params
  if (!UUID_RE.test(caseId)) {
    return NextResponse.json({ detail: 'Invalid case ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/api/integrations/cases/${caseId}/submit-claim`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
