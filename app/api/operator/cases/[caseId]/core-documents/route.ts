import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import {
  buildManagedCoreDocumentPath,
  getEditableCoreDocumentSpec,
  getInspectionsStorageBucketName,
  isEditableCoreDocumentKind,
  resolveManagedStorageObject,
  type EditableCoreDocumentKind,
} from '@/lib/operator-core-documents'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

const MAX_CORE_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024

type RouteContext = {
  params: Promise<{
    caseId: string
  }>
}

type DocumentRow = {
  id: string
  file_url: string
  metadata: Record<string, unknown> | null
}

type UploadRequestPayload = {
  documentKind?: unknown
  fileName?: unknown
  fileSize?: unknown
  contentType?: unknown
}

type FinalizeRequestPayload = {
  documentKind?: unknown
  fileName?: unknown
  storagePath?: unknown
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
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
    console.error('Core document case lookup failed', {
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

async function getActiveCoreDocuments({
  supabase,
  tenantId,
  caseId,
  kind,
}: {
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>
  tenantId: string
  caseId: string
  kind: EditableCoreDocumentKind
}) {
  const spec = getEditableCoreDocumentSpec(kind)
  const documentResult = await supabase
    .from('documents')
    .select('id,file_url,metadata')
    .eq('tenant_id', tenantId)
    .eq('case_id', caseId)
    .eq('document_type', spec.documentType)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (documentResult.error) {
    console.error('Core document lookup failed', {
      caseId,
      tenantId,
      documentType: spec.documentType,
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
    console.error('Core document delete failed', {
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
      console.warn('Core document storage removal failed', {
        bucket,
        pathCount: pathList.length,
        error: error.message,
      })
    }
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { caseId } = await context.params
  const authorization = await requireAuthorizedCase(caseId)

  if (!authorization.ok) {
    return authorization.response
  }

  const payload = (await request.json().catch(() => null)) as UploadRequestPayload | null
  const documentKind = payload?.documentKind
  const fileName = typeof payload?.fileName === 'string' ? payload.fileName.trim() : ''
  const fileSize = typeof payload?.fileSize === 'number' ? payload.fileSize : NaN
  const contentType = typeof payload?.contentType === 'string' ? payload.contentType.trim() : ''

  if (!isEditableCoreDocumentKind(documentKind)) {
    return jsonError('Invalid document type.', 400)
  }

  if (!fileName) {
    return jsonError('A PDF file is required.', 400)
  }

  const isPdf = contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')

  if (!isPdf) {
    return jsonError('Only PDF reports are supported.', 400)
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return jsonError('File size is invalid.', 400)
  }

  if (fileSize > MAX_CORE_DOCUMENT_SIZE_BYTES) {
    return jsonError('File is too large. Maximum size is 25 MB.', 400)
  }

  const { auth, supabase } = authorization
  const bucketName = getInspectionsStorageBucketName()
  const storagePath = buildManagedCoreDocumentPath({
    tenantId: auth.tenantId,
    caseId,
    kind: documentKind,
    fileName,
  })

  try {
    const signedUploadResult = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(storagePath)

    if (signedUploadResult.error || !signedUploadResult.data?.token) {
      console.error('Core document signed upload init failed', {
        caseId,
        tenantId: auth.tenantId,
        documentKind,
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
    console.error('Core document upload init failed', {
      caseId,
      tenantId: auth.tenantId,
      documentKind,
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
  const documentKind = payload?.documentKind
  const fileName = typeof payload?.fileName === 'string' ? payload.fileName.trim() : ''
  const storagePath = typeof payload?.storagePath === 'string' ? payload.storagePath.trim() : ''

  if (!isEditableCoreDocumentKind(documentKind)) {
    return jsonError('Invalid document type.', 400)
  }

  if (!fileName || !storagePath) {
    return jsonError('Uploaded file details are missing.', 400)
  }

  const { auth, supabase } = authorization
  const spec = getEditableCoreDocumentSpec(documentKind)
  const bucketName = getInspectionsStorageBucketName()

  try {
    const existingDocuments = await getActiveCoreDocuments({
      supabase,
      tenantId: auth.tenantId,
      caseId,
      kind: documentKind,
    })
    const [primaryDocument, ...duplicateDocuments] = existingDocuments

    const publicUrlResult = supabase.storage.from(bucketName).getPublicUrl(storagePath)
    const now = new Date().toISOString()
    const metadata = {
      label: spec.label,
      source: 'operator_workspace_upload',
      uploaded_from: 'operator_case_workspace',
      storage_bucket: bucketName,
      storage_path: storagePath,
      original_file_name: fileName,
    }

    if (primaryDocument) {
      const updateResult = await supabase
        .from('documents')
        .update({
          name: fileName,
          file_url: publicUrlResult.data.publicUrl,
          metadata,
          updated_at: now,
          deleted_at: null,
        })
        .eq('id', primaryDocument.id)
        .eq('tenant_id', auth.tenantId)

      if (updateResult.error) {
        throw updateResult.error
      }
    } else {
      const insertResult = await supabase
        .from('documents')
        .insert({
          id: randomUUID(),
          tenant_id: auth.tenantId,
          case_id: caseId,
          name: fileName,
          document_type: spec.documentType,
          file_url: publicUrlResult.data.publicUrl,
          metadata,
        })

      if (insertResult.error) {
        throw insertResult.error
      }
    }

    await softDeleteDocuments({
      supabase,
      tenantId: auth.tenantId,
      ids: duplicateDocuments.map((row) => row.id),
    })

    await removeManagedStorageObjects({
      supabase,
      rows: [...duplicateDocuments, ...(primaryDocument ? [primaryDocument] : [])],
    })

    revalidatePath(`/operator/cases/${caseId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    const { error: cleanupError } = await supabase.storage.from(bucketName).remove([storagePath])

    if (cleanupError) {
      console.warn('Core document cleanup failed after finalize error', {
        caseId,
        tenantId: auth.tenantId,
        path: storagePath,
        error: cleanupError.message,
      })
    }

    console.error('Core document finalize failed', {
      caseId,
      tenantId: auth.tenantId,
      documentType: spec.documentType,
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
    documentKind?: unknown
  } | null
  const documentKind = payload?.documentKind

  if (!isEditableCoreDocumentKind(documentKind)) {
    return jsonError('Invalid document type.', 400)
  }

  const { auth, supabase } = authorization

  try {
    const existingDocuments = await getActiveCoreDocuments({
      supabase,
      tenantId: auth.tenantId,
      caseId,
      kind: documentKind,
    })

    if (existingDocuments.length === 0) {
      revalidatePath(`/operator/cases/${caseId}`)
      return NextResponse.json({ success: true })
    }

    await softDeleteDocuments({
      supabase,
      tenantId: auth.tenantId,
      ids: existingDocuments.map((row) => row.id),
    })
    await removeManagedStorageObjects({
      supabase,
      rows: existingDocuments,
    })

    revalidatePath(`/operator/cases/${caseId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Core document removal failed', {
      caseId,
      tenantId: auth.tenantId,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return jsonError('Unable to remove this document right now.', 500)
  }
}
