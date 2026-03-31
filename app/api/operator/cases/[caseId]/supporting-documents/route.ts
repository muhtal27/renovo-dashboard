import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  buildManagedSupportingDocumentPath,
  getInspectionsStorageBucketName,
  resolveManagedStorageObject,
  SUPPORTING_DOCUMENT_TYPE,
} from '@/lib/operator-core-documents'
import {
  removeStructuredDocumentsForLegacyIds,
  syncStructuredSupportingDocument,
} from '@/lib/operator-checkout-document-sync'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

const MAX_SUPPORTING_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024
const MAX_SUPPORTING_DOCUMENT_COUNT = 15

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

type DocumentRow = {
  id: string
  name: string
  file_url: string
  metadata: Record<string, unknown> | null
}

type UploadRequestPayload = {
  fileName?: unknown
  fileSize?: unknown
  contentType?: unknown
  label?: unknown
}

type FinalizeRequestPayload = {
  fileName?: unknown
  storagePath?: unknown
  label?: unknown
  contentType?: unknown
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function isAllowedSupportingContentType(contentType: string, fileName: string) {
  if (contentType === 'application/pdf') {
    return true
  }

  if (contentType.startsWith('image/')) {
    return true
  }

  const normalized = fileName.toLowerCase()
  return (
    normalized.endsWith('.pdf') ||
    normalized.endsWith('.png') ||
    normalized.endsWith('.jpg') ||
    normalized.endsWith('.jpeg') ||
    normalized.endsWith('.webp') ||
    normalized.endsWith('.gif')
  )
}

async function requireAuthorizedCase(caseId: string) {
  const authResult = await getOperatorTenantContextForApi(OPERATOR_PERMISSIONS.MANAGE_EVIDENCE)

  if (!authResult.ok) {
    return {
      ok: false as const,
      response: jsonError(authResult.detail, authResult.status),
    }
  }

  const supabase = getSupabaseServiceRoleClient()
  const caseResult = await supabase
    .from('cases')
    .select('id')
    .eq('id', caseId)
    .eq('tenant_id', authResult.context.tenantId)
    .is('deleted_at', null)
    .maybeSingle()

  if (caseResult.error) {
    console.error('Supporting document case lookup failed', {
      caseId,
      tenantId: authResult.context.tenantId,
      error: caseResult.error.message,
    })
    return {
      ok: false as const,
      response: jsonError('Unable to load this case.', 500),
    }
  }

  if (!caseResult.data) {
    return {
      ok: false as const,
      response: jsonError('Case not found.', 404),
    }
  }

  return {
    ok: true as const,
    auth: authResult.context,
    supabase,
  }
}

async function getManagedSupportingDocuments({
  supabase,
  tenantId,
  caseId,
}: {
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>
  tenantId: string
  caseId: string
}) {
  const documentResult = await supabase
    .from('documents')
    .select('id,name,file_url,metadata')
    .eq('tenant_id', tenantId)
    .eq('case_id', caseId)
    .eq('document_type', SUPPORTING_DOCUMENT_TYPE)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (documentResult.error) {
    console.error('Supporting document lookup failed', {
      caseId,
      tenantId,
      error: documentResult.error.message,
    })
    throw new Error('document_lookup_failed')
  }

  return (documentResult.data ?? []) as DocumentRow[]
}

async function softDeleteDocuments({
  supabase,
  tenantId,
  ids,
}: {
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>
  tenantId: string
  ids: string[]
}) {
  if (ids.length === 0) {
    return
  }

  const timestamp = new Date().toISOString()
  const { error } = await supabase
    .from('documents')
    .update({
      deleted_at: timestamp,
      updated_at: timestamp,
    })
    .eq('tenant_id', tenantId)
    .in('id', ids)

  if (error) {
    console.error('Supporting document delete failed', {
      tenantId,
      ids,
      error: error.message,
    })
    throw new Error('document_delete_failed')
  }
}

async function removeManagedStorageObjects({
  supabase,
  rows,
}: {
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>
  rows: DocumentRow[]
}) {
  const removals = new Map<string, Set<string>>()

  for (const row of rows) {
    const storageObject = resolveManagedStorageObject(row.file_url, row.metadata)

    if (!storageObject) {
      continue
    }

    const bucketPaths = removals.get(storageObject.bucket) ?? new Set<string>()
    bucketPaths.add(storageObject.path)
    removals.set(storageObject.bucket, bucketPaths)
  }

  for (const [bucket, paths] of removals.entries()) {
    const pathList = Array.from(paths)

    if (pathList.length === 0) {
      continue
    }

    const { error } = await supabase.storage.from(bucket).remove(pathList)

    if (error) {
      console.warn('Supporting document storage removal failed', {
        bucket,
        pathCount: pathList.length,
        error: error.message,
      })
    }
  }
}

async function touchCaseWorkflow({
  supabase,
  tenantId,
  caseId,
}: {
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>
  tenantId: string
  caseId: string
}) {
  const now = new Date().toISOString()
  await supabase
    .from('cases')
    .update({
      last_activity_at: now,
      updated_at: now,
      status: 'collecting_evidence',
    })
    .eq('tenant_id', tenantId)
    .eq('id', caseId)
    .in('status', ['draft', 'collecting_evidence'])

  await supabase
    .from('checkout_cases')
    .update({
      status: 'in_review',
      updated_at: now,
    })
    .eq('tenant_id', tenantId)
    .eq('case_id', caseId)
    .is('deleted_at', null)
}

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  const authorization = await requireAuthorizedCase(caseId)

  if (!authorization.ok) {
    return authorization.response
  }

  const payload = (await request.json().catch(() => null)) as UploadRequestPayload | null
  const fileName = typeof payload?.fileName === 'string' ? payload.fileName.trim() : ''
  const label = typeof payload?.label === 'string' ? payload.label.trim() : ''
  const fileSize = typeof payload?.fileSize === 'number' ? payload.fileSize : NaN
  const contentType = typeof payload?.contentType === 'string' ? payload.contentType.trim() : ''

  if (!fileName) {
    return jsonError('A file is required.', 400)
  }

  if (!label) {
    return jsonError('A document label is required.', 400)
  }

  if (label.length > 80) {
    return jsonError('Document label is too long.', 400)
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return jsonError('File size is invalid.', 400)
  }

  if (fileSize > MAX_SUPPORTING_DOCUMENT_SIZE_BYTES) {
    return jsonError('File is too large. Maximum size is 25 MB.', 400)
  }

  if (!isAllowedSupportingContentType(contentType, fileName)) {
    return jsonError('Only PDF and image supporting documents are supported.', 400)
  }

  const { auth, supabase } = authorization

  try {
    const existingDocuments = await getManagedSupportingDocuments({
      supabase,
      tenantId: auth.tenantId,
      caseId,
    })

    if (existingDocuments.length >= MAX_SUPPORTING_DOCUMENT_COUNT) {
      return jsonError('Supporting document limit reached. Remove a file before adding another.', 400)
    }

    const bucketName = getInspectionsStorageBucketName()
    const storagePath = buildManagedSupportingDocumentPath({
      tenantId: auth.tenantId,
      caseId,
      fileName,
    })

    const signedUploadResult = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(storagePath)

    if (signedUploadResult.error || !signedUploadResult.data?.token) {
      console.error('Supporting document signed upload init failed', {
        caseId,
        tenantId: auth.tenantId,
        error: signedUploadResult.error?.message ?? 'missing_token',
      })
      return jsonError('Unable to prepare this upload right now.', 500)
    }

    return NextResponse.json({
      success: true,
      bucketName,
      storagePath,
      token: signedUploadResult.data.token,
    })
  } catch (error) {
    console.error('Supporting document upload init failed', {
      caseId,
      tenantId: auth.tenantId,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return jsonError('Unable to prepare this upload right now.', 500)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  const authorization = await requireAuthorizedCase(caseId)

  if (!authorization.ok) {
    return authorization.response
  }

  const payload = (await request.json().catch(() => null)) as FinalizeRequestPayload | null
  const fileName = typeof payload?.fileName === 'string' ? payload.fileName.trim() : ''
  const storagePath = typeof payload?.storagePath === 'string' ? payload.storagePath.trim() : ''
  const label = typeof payload?.label === 'string' ? payload.label.trim() : ''
  const contentType = typeof payload?.contentType === 'string' ? payload.contentType.trim() : ''

  if (!fileName || !storagePath || !label) {
    return jsonError('Uploaded file details are missing.', 400)
  }

  const { auth, supabase } = authorization
  const bucketName = getInspectionsStorageBucketName()
  const insertedDocumentId = randomUUID()

  try {
    const publicUrlResult = supabase.storage.from(bucketName).getPublicUrl(storagePath)
    const metadata = {
      label,
      source: 'operator_supporting_document',
      uploaded_from: 'operator_case_workspace',
      storage_bucket: bucketName,
      storage_path: storagePath,
      original_file_name: fileName,
      content_type: contentType || null,
    }

    const insertResult = await supabase
      .from('documents')
      .insert({
        id: insertedDocumentId,
        tenant_id: auth.tenantId,
        case_id: caseId,
        name: fileName,
        document_type: SUPPORTING_DOCUMENT_TYPE,
        file_url: publicUrlResult.data.publicUrl,
        metadata,
      })

    if (insertResult.error) {
      throw insertResult.error
    }

    await syncStructuredSupportingDocument({
      supabase,
      tenantId: auth.tenantId,
      caseId,
      legacyDocumentId: insertedDocumentId,
      fileName,
      storagePath,
    })
    await touchCaseWorkflow({
      supabase,
      tenantId: auth.tenantId,
      caseId,
    })

    revalidatePath(`/operator/cases/${caseId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    const { error: cleanupError } = await supabase.storage.from(bucketName).remove([storagePath])

    if (cleanupError) {
      console.warn('Supporting document cleanup failed after finalize error', {
        caseId,
        tenantId: auth.tenantId,
        path: storagePath,
        error: cleanupError.message,
      })
    }

    console.error('Supporting document finalize failed', {
      caseId,
      tenantId: auth.tenantId,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return jsonError('Unable to save this document right now.', 500)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  const authorization = await requireAuthorizedCase(caseId)

  if (!authorization.ok) {
    return authorization.response
  }

  const payload = (await request.json().catch(() => null)) as {
    documentId?: unknown
  } | null
  const documentId = typeof payload?.documentId === 'string' ? payload.documentId.trim() : ''

  if (!documentId) {
    return jsonError('Document id is required.', 400)
  }

  const { auth, supabase } = authorization

  try {
    const existingDocuments = await getManagedSupportingDocuments({
      supabase,
      tenantId: auth.tenantId,
      caseId,
    })

    const targetDocument = existingDocuments.find((document) => document.id === documentId)

    if (!targetDocument) {
      return jsonError('Supporting document not found.', 404)
    }

    await softDeleteDocuments({
      supabase,
      tenantId: auth.tenantId,
      ids: [targetDocument.id],
    })
    await removeStructuredDocumentsForLegacyIds({
      supabase,
      tenantId: auth.tenantId,
      caseId,
      legacyDocumentIds: [targetDocument.id],
    })
    await removeManagedStorageObjects({
      supabase,
      rows: [targetDocument],
    })
    await touchCaseWorkflow({
      supabase,
      tenantId: auth.tenantId,
      caseId,
    })

    revalidatePath(`/operator/cases/${caseId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supporting document removal failed', {
      caseId,
      tenantId: auth.tenantId,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return jsonError('Unable to remove this document right now.', 500)
  }
}
