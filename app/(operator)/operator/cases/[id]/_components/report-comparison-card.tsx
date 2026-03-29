'use client'

import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { EmptyState } from '@/app/operator-ui'
import { StatusBadge, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { EditableCoreDocumentKind } from '@/lib/operator-core-documents'
import { getInspectionsStorageBucketName } from '@/lib/operator-core-documents'
import type {
  CaseWorkspaceReportDocument,
  OperatorCaseWorkspaceData,
} from '@/lib/operator-case-workspace-types'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

type MutationState = {
  pending: boolean
  error: string | null
  action: 'upload' | 'delete' | null
}

const INITIAL_MUTATION_STATE: MutationState = {
  pending: false,
  error: null,
  action: null,
}

function ReportDocumentPane({
  label,
  document,
}: {
  label: string
  document: CaseWorkspaceReportDocument | null
}) {
  if (!document) {
    return (
      <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-3 text-sm font-semibold text-slate-950">Document not available</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Seeded evidence has not linked a {label.toLowerCase()} document yet.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500"
        >
          Open
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-[18px] border border-slate-200 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{document.fileName}</p>
        </div>
        <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={formatEnumLabel(document.documentType)} tone="document" />
        <StatusBadge label={formatEnumLabel(document.source)} tone="document" />
      </div>

      <p className="mt-4 text-sm text-slate-600">Created {formatDate(document.createdAt)}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Open
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

function ManageableReportDocumentPane({
  caseId,
  label,
  kind,
  document,
}: {
  caseId: string
  label: string
  kind: EditableCoreDocumentKind
  document: CaseWorkspaceReportDocument | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [mutationState, setMutationState] = useState<MutationState>(INITIAL_MUTATION_STATE)
  const canRemove = document?.source === 'document'

  async function refreshWorkspace() {
    router.refresh()
  }

  async function uploadDocument(file: File) {
    setMutationState({
      pending: true,
      error: null,
      action: 'upload',
    })

    try {
      const initResponse = await fetch(`/api/operator/cases/${caseId}/core-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentKind: kind,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      })

      const initPayload = (await initResponse.json().catch(() => null)) as {
        error?: string
        token?: string
        storagePath?: string
        bucketName?: string
      } | null

      if (!initResponse.ok || !initPayload?.token || !initPayload.storagePath) {
        throw new Error(initPayload?.error || 'Upload failed.')
      }

      const supabase = getSupabaseBrowserClient()
      const bucketName = initPayload.bucketName || getInspectionsStorageBucketName()
      const uploadResult = await supabase.storage
        .from(bucketName)
        .uploadToSignedUrl(initPayload.storagePath, initPayload.token, file, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || 'Upload failed.')
      }

      const finalizeResponse = await fetch(`/api/operator/cases/${caseId}/core-documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentKind: kind,
          fileName: file.name,
          storagePath: initPayload.storagePath,
        }),
      })
      const finalizePayload = (await finalizeResponse.json().catch(() => null)) as {
        error?: string
      } | null

      if (!finalizeResponse.ok) {
        throw new Error(finalizePayload?.error || 'Upload failed.')
      }

      await refreshWorkspace()
      setMutationState(INITIAL_MUTATION_STATE)
    } catch (error) {
      setMutationState({
        pending: false,
        error: error instanceof Error ? error.message : 'Upload failed.',
        action: 'upload',
      })
    }
  }

  async function removeDocument() {
    setMutationState({
      pending: true,
      error: null,
      action: 'delete',
    })

    try {
      const response = await fetch(`/api/operator/cases/${caseId}/core-documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentKind: kind }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Remove failed.')
      }

      await refreshWorkspace()
      setMutationState(INITIAL_MUTATION_STATE)
    } catch (error) {
      setMutationState({
        pending: false,
        error: error instanceof Error ? error.message : 'Remove failed.',
        action: 'delete',
      })
    }
  }

  function handleSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    void uploadDocument(selectedFile)
    event.target.value = ''
  }

  const isUploading = mutationState.pending && mutationState.action === 'upload'
  const isDeleting = mutationState.pending && mutationState.action === 'delete'

  if (!document) {
    return (
      <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-3 text-sm font-semibold text-slate-950">Document not available</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Upload the current {label.toLowerCase()} so this case is ready for evidence review and backend analysis.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleSelectFile}
        />
        <button
          type="button"
          disabled={mutationState.pending}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </button>
        {mutationState.error ? (
          <p className="mt-3 text-sm leading-6 text-rose-700 [overflow-wrap:anywhere]">{mutationState.error}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-[18px] border border-slate-200 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{document.fileName}</p>
        </div>
        <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={formatEnumLabel(document.documentType)} tone="document" />
        <StatusBadge label={formatEnumLabel(document.source)} tone="document" />
      </div>

      <p className="mt-4 text-sm text-slate-600">Created {formatDate(document.createdAt)}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Open
          <ExternalLink className="h-4 w-4" />
        </a>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleSelectFile}
        />
        <button
          type="button"
          disabled={mutationState.pending}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? 'Replacing...' : 'Replace'}
        </button>
        <button
          type="button"
          disabled={mutationState.pending || !canRemove}
          onClick={() => void removeDocument()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isDeleting ? 'Removing...' : 'Remove'}
        </button>
      </div>
      {!canRemove ? (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          This file is currently linked from evidence. Upload a dedicated report to manage this slot directly.
        </p>
      ) : null}
      {mutationState.error ? (
        <p className="mt-3 text-sm leading-6 text-rose-700 [overflow-wrap:anywhere]">{mutationState.error}</p>
      ) : null}
    </div>
  )
}

export function ReportComparisonCard({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  const reportCount =
    Number(Boolean(workspace.reportDocuments.checkIn)) +
    Number(Boolean(workspace.reportDocuments.checkOut)) +
    Number(Boolean(workspace.reportDocuments.tenancyAgreement))

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Core documents</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review the tenancy agreement alongside check-in and check-out records from the same file.
          </p>
        </div>
        <StatusBadge label={`${reportCount}/3 documents found`} tone={reportCount === 3 ? 'stable' : 'attention'} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <ReportDocumentPane
          label="Tenancy agreement"
          document={workspace.reportDocuments.tenancyAgreement}
        />
        <ManageableReportDocumentPane
          caseId={workspace.case.id}
          label="Check-in report"
          kind="check_in"
          document={workspace.reportDocuments.checkIn}
        />
        <ManageableReportDocumentPane
          caseId={workspace.case.id}
          label="Check-out report"
          kind="check_out"
          document={workspace.reportDocuments.checkOut}
        />
      </div>

      {workspace.documents.length === 0 && workspace.evidence.length === 0 ? (
        <EmptyState
          title="No case evidence available"
          body="This workspace has not received documents or supporting evidence yet."
          className="mt-5"
        />
      ) : null}
    </div>
  )
}
