import type { EditableCoreDocumentKind } from '@/lib/operator-core-documents'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

type SupabaseServiceClient = ReturnType<typeof getSupabaseServiceRoleClient>

export type StructuredCheckoutDocumentKind =
  | 'checkin'
  | 'checkout'
  | 'tenancy'
  | 'supplementary'

function getStructuredDocumentType(kind: EditableCoreDocumentKind): StructuredCheckoutDocumentKind {
  if (kind === 'check_in') {
    return 'checkin'
  }

  if (kind === 'check_out') {
    return 'checkout'
  }

  return 'tenancy'
}

async function getCheckoutCaseId({
  supabase,
  tenantId,
  caseId,
}: {
  supabase: SupabaseServiceClient
  tenantId: string
  caseId: string
}) {
  const result = await supabase
    .from('checkout_cases')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('case_id', caseId)
    .is('deleted_at', null)
    .maybeSingle()

  if (result.error) {
    throw result.error
  }

  return typeof result.data?.id === 'string' ? result.data.id : null
}

export async function syncStructuredCoreDocument({
  supabase,
  tenantId,
  caseId,
  legacyDocumentId,
  fileName,
  storagePath,
  fileSizeBytes,
  kind,
}: {
  supabase: SupabaseServiceClient
  tenantId: string
  caseId: string
  legacyDocumentId: string
  fileName: string
  storagePath: string
  fileSizeBytes?: number | null
  kind: EditableCoreDocumentKind
}) {
  const checkoutCaseId = await getCheckoutCaseId({ supabase, tenantId, caseId })

  if (!checkoutCaseId) {
    return
  }

  const source = `legacy_document:${legacyDocumentId}`
  const existingResult = await supabase
    .from('checkout_documents')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('case_id', checkoutCaseId)
    .eq('source', source)
    .is('deleted_at', null)
    .maybeSingle()

  if (existingResult.error) {
    throw existingResult.error
  }

  const payload = {
    case_id: checkoutCaseId,
    tenant_id: tenantId,
    document_name: fileName,
    document_type: getStructuredDocumentType(kind),
    file_path: storagePath,
    file_size_bytes: fileSizeBytes ?? null,
    page_count: null,
    source,
    processing_status: 'uploaded',
    processed_at: null,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }

  if (typeof existingResult.data?.id === 'string') {
    const updateResult = await supabase
      .from('checkout_documents')
      .update(payload)
      .eq('id', existingResult.data.id)
      .eq('tenant_id', tenantId)

    if (updateResult.error) {
      throw updateResult.error
    }

    return
  }

  const insertResult = await supabase
    .from('checkout_documents')
    .insert(payload)

  if (insertResult.error) {
    throw insertResult.error
  }
}

export async function syncStructuredSupportingDocument({
  supabase,
  tenantId,
  caseId,
  legacyDocumentId,
  fileName,
  storagePath,
  fileSizeBytes,
}: {
  supabase: SupabaseServiceClient
  tenantId: string
  caseId: string
  legacyDocumentId: string
  fileName: string
  storagePath: string
  fileSizeBytes?: number | null
}) {
  const checkoutCaseId = await getCheckoutCaseId({ supabase, tenantId, caseId })

  if (!checkoutCaseId) {
    return
  }

  const source = `legacy_document:${legacyDocumentId}`
  const existingResult = await supabase
    .from('checkout_documents')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('case_id', checkoutCaseId)
    .eq('source', source)
    .is('deleted_at', null)
    .maybeSingle()

  if (existingResult.error) {
    throw existingResult.error
  }

  const payload = {
    case_id: checkoutCaseId,
    tenant_id: tenantId,
    document_name: fileName,
    document_type: 'supplementary',
    file_path: storagePath,
    file_size_bytes: fileSizeBytes ?? null,
    page_count: null,
    source,
    processing_status: 'uploaded',
    processed_at: null,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }

  if (typeof existingResult.data?.id === 'string') {
    const updateResult = await supabase
      .from('checkout_documents')
      .update(payload)
      .eq('id', existingResult.data.id)
      .eq('tenant_id', tenantId)

    if (updateResult.error) {
      throw updateResult.error
    }

    return
  }

  const insertResult = await supabase.from('checkout_documents').insert(payload)

  if (insertResult.error) {
    throw insertResult.error
  }
}

export async function removeStructuredDocumentsForLegacyIds({
  supabase,
  tenantId,
  caseId,
  legacyDocumentIds,
}: {
  supabase: SupabaseServiceClient
  tenantId: string
  caseId: string
  legacyDocumentIds: string[]
}) {
  if (legacyDocumentIds.length === 0) {
    return
  }

  const checkoutCaseId = await getCheckoutCaseId({ supabase, tenantId, caseId })

  if (!checkoutCaseId) {
    return
  }

  const sources = legacyDocumentIds.map((documentId) => `legacy_document:${documentId}`)
  const timestamp = new Date().toISOString()
  const updateResult = await supabase
    .from('checkout_documents')
    .update({
      deleted_at: timestamp,
      updated_at: timestamp,
    })
    .eq('tenant_id', tenantId)
    .eq('case_id', checkoutCaseId)
    .in('source', sources)

  if (updateResult.error) {
    throw updateResult.error
  }
}
