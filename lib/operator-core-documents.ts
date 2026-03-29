export type EditableCoreDocumentKind = 'check_in' | 'check_out'

export const CORE_CASE_DOCUMENT_TYPES = ['check_in_report', 'check_out_report'] as const
export const SUPPORTING_DOCUMENT_TYPE = 'supporting_document'

type EditableCoreDocumentSpec = {
  kind: EditableCoreDocumentKind
  label: string
  documentType: 'check_in_report' | 'check_out_report'
}

const CORE_DOCUMENT_SPECS: Record<EditableCoreDocumentKind, EditableCoreDocumentSpec> = {
  check_in: {
    kind: 'check_in',
    label: 'Check-in report',
    documentType: 'check_in_report',
  },
  check_out: {
    kind: 'check_out',
    label: 'Check-out report',
    documentType: 'check_out_report',
  },
}

const SUPABASE_STORAGE_PUBLIC_SEGMENT = '/storage/v1/object/public/'

export function isEditableCoreDocumentKind(value: unknown): value is EditableCoreDocumentKind {
  return value === 'check_in' || value === 'check_out'
}

export function getEditableCoreDocumentSpec(kind: EditableCoreDocumentKind) {
  return CORE_DOCUMENT_SPECS[kind]
}

export function isCoreCaseDocumentType(value: string | null | undefined) {
  return CORE_CASE_DOCUMENT_TYPES.includes(
    value as (typeof CORE_CASE_DOCUMENT_TYPES)[number]
  )
}

export function getInspectionsStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET_INSPECTIONS?.trim() || 'inspection-files'
}

export function buildManagedCoreDocumentPath({
  tenantId,
  caseId,
  kind,
  fileName,
}: {
  tenantId: string
  caseId: string
  kind: EditableCoreDocumentKind
  fileName: string
}) {
  const safeName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

  const normalizedFileName = safeName || `${kind}.pdf`
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `tenants/${tenantId}/cases/${caseId}/core-documents/${kind}/${uniquePrefix}-${normalizedFileName}`
}

export function buildManagedSupportingDocumentPath({
  tenantId,
  caseId,
  fileName,
}: {
  tenantId: string
  caseId: string
  fileName: string
}) {
  const safeName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

  const normalizedFileName = safeName || 'supporting-document'
  const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `tenants/${tenantId}/cases/${caseId}/supporting-documents/${uniquePrefix}-${normalizedFileName}`
}

export function resolveManagedStorageObject(
  fileUrl: string,
  metadata: Record<string, unknown> | null | undefined
) {
  const bucket =
    typeof metadata?.storage_bucket === 'string' && metadata.storage_bucket.trim()
      ? metadata.storage_bucket.trim()
      : null
  const storagePath =
    typeof metadata?.storage_path === 'string' && metadata.storage_path.trim()
      ? metadata.storage_path.trim().replace(/^\/+/, '')
      : null

  if (bucket && storagePath) {
    return {
      bucket,
      path: storagePath,
    }
  }

  const publicSegmentIndex = fileUrl.indexOf(SUPABASE_STORAGE_PUBLIC_SEGMENT)

  if (publicSegmentIndex === -1) {
    return null
  }

  const publicPath = fileUrl.slice(publicSegmentIndex + SUPABASE_STORAGE_PUBLIC_SEGMENT.length)
  const [bucketName, ...pathParts] = publicPath.split('/')

  if (!bucketName || pathParts.length === 0) {
    return null
  }

  return {
    bucket: decodeURIComponent(bucketName),
    path: decodeURIComponent(pathParts.join('/')),
  }
}
