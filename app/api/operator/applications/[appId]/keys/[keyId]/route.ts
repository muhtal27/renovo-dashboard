import { NextResponse } from 'next/server'
import { proxyEotRequest } from '@/lib/eot-proxy'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ appId: string; keyId: string }> }
) {
  const { appId, keyId } = await params
  if (!UUID_RE.test(appId) || !UUID_RE.test(keyId)) {
    return NextResponse.json({ detail: 'Invalid ID' }, { status: 400 })
  }
  return proxyEotRequest(
    request,
    `/operator/applications/${appId}/keys/${keyId}`,
    OPERATOR_PERMISSIONS.MANAGE_SETTINGS
  )
}
