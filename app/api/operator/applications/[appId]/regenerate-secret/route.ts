import { NextResponse } from 'next/server'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params
  if (!UUID_RE.test(appId)) {
    return NextResponse.json({ detail: 'Invalid application ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/operator/applications/${appId}/regenerate-secret`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
