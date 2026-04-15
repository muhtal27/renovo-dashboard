import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import {
  createEvidenceUploadUrl,
  finalizeEvidenceUpload,
  deleteEvidence,
} from '@/lib/eot-workspace-service'

const MAX_EVIDENCE_SIZE_BYTES = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
])

type RouteContext = {
  params: Promise<{ caseId: string }>
}

/**
 * POST — Request a signed upload URL for an evidence file.
 * Body: { fileName, contentType, fileSize }
 * Returns: { bucketName, storagePath, token }
 */
export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.MANAGE_EVIDENCE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  let body: { fileName?: string; contentType?: string; fileSize?: number }
  try {
    body = (await request.json()) as { fileName?: string; contentType?: string; fileSize?: number }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : ''
  const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : ''
  const fileSize = typeof body.fileSize === 'number' ? body.fileSize : NaN

  if (!fileName) {
    return NextResponse.json({ detail: 'fileName is required.' }, { status: 400 })
  }
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { detail: `Unsupported file type. Allowed: ${[...ALLOWED_TYPES].join(', ')}` },
      { status: 400 },
    )
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ detail: 'Invalid fileSize.' }, { status: 400 })
  }
  if (fileSize > MAX_EVIDENCE_SIZE_BYTES) {
    return NextResponse.json({ detail: 'File exceeds 25 MB limit.' }, { status: 400 })
  }

  try {
    const result = await createEvidenceUploadUrl(caseId, authResult.context.tenantId, {
      fileName,
      contentType,
      fileSize,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Evidence upload init failed', {
      caseId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 500 },
    )
  }
}

/**
 * PUT — Finalize an evidence upload after the file has been uploaded to storage.
 * Body: { storagePath, fileName, contentType, area? }
 * Returns: { evidence: EotEvidencePhoto }
 */
export async function PUT(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.MANAGE_EVIDENCE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  let body: { storagePath?: string; fileName?: string; contentType?: string; area?: string }
  try {
    body = (await request.json()) as { storagePath?: string; fileName?: string; contentType?: string; area?: string }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.storagePath || !body.fileName || !body.contentType) {
    return NextResponse.json({ detail: 'storagePath, fileName, and contentType are required.' }, { status: 400 })
  }

  try {
    const evidence = await finalizeEvidenceUpload(
      caseId,
      authResult.context.tenantId,
      authResult.context.user.id,
      {
        storagePath: body.storagePath,
        fileName: body.fileName,
        contentType: body.contentType,
        area: body.area ?? null,
      },
    )
    return NextResponse.json({ success: true, evidence })
  } catch (error) {
    console.error('Evidence finalize failed', {
      caseId,
      error: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Finalize failed.' },
      { status: 500 },
    )
  }
}

/**
 * DELETE — Remove an evidence record and its storage object.
 * Body: { evidenceId }
 */
export async function DELETE(request: Request, context: RouteContext) {
  const { caseId } = await context.params

  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.MANAGE_EVIDENCE)
  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  let body: { evidenceId?: string }
  try {
    body = (await request.json()) as { evidenceId?: string }
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.evidenceId) {
    return NextResponse.json({ detail: 'evidenceId is required.' }, { status: 400 })
  }

  try {
    await deleteEvidence(caseId, authResult.context.tenantId, authResult.context.user.id, body.evidenceId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Delete failed.' },
      { status: 500 },
    )
  }
}
