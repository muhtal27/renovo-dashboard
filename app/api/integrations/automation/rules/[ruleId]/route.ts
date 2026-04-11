import { NextResponse } from 'next/server'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await params
  if (!UUID_RE.test(ruleId)) {
    return NextResponse.json({ detail: 'Invalid rule ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/api/integrations/automation/rules/${ruleId}`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await params
  if (!UUID_RE.test(ruleId)) {
    return NextResponse.json({ detail: 'Invalid rule ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/api/integrations/automation/rules/${ruleId}`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  const { ruleId } = await params
  if (!UUID_RE.test(ruleId)) {
    return NextResponse.json({ detail: 'Invalid rule ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/api/integrations/automation/rules/${ruleId}`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
