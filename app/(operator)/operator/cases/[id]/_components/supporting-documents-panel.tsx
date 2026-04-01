'use client'

import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { Download, ExternalLink, Loader2, Trash2, Upload } from 'lucide-react'
import { EmptyState, StatusBadge } from '@/app/eot/_components/eot-ui'
import { SectionHeading } from '@/app/operator-ui'
import { getInspectionsStorageBucketName } from '@/lib/operator-core-documents'
import type { SupportingCaseDocument } from '@/lib/operator-case-workspace-types'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

const MAX_SUPPORTING_DOCUMENT_COUNT = 15

type MutationState = {
  pending: boolean
  error: string | null
  action: 'upload' | 'delete' | null
  targetId?: string
}

const INITIAL_MUTATION_STATE: MutationState = {
  pending: false,
  error: null,
  action: null,
}

function getDocumentTone(document: SupportingCaseDocument) {
  return document.contentType?.startsWith('image/') ? 'image' : 'document'
}

function getDocumentTypeLabel(document: SupportingCaseDocument) {
  if (document.contentType === 'application/pdf') {
    return 'PDF'
  }

  if (document.contentType?.startsWith('image/')) {
    return 'Image'
  }

  return 'Document'
}

export function SupportingDocumentsPanel({
  caseId,
  documents,
  onRefresh,
}: {
  caseId: string
  documents: SupportingCaseDocument[]
  onRefresh: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [label, setLabel] = useState('')
  const [mutationState, setMutationState] = useState<MutationState>(INITIAL_MUTATION_STATE)

  async function uploadDocument(file: File, documentLabel: string) {
    setMutationState({
      pending: true,
      error: null,
      action: 'upload',
    })

    try {
      const initResponse = await fetch(`/api/operator/cases/${caseId}/supporting-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          label: documentLabel,
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
          contentType: file.type || undefined,
          upsert: false,
        })

      if (uploadResult.error) {
        throw new Error(uploadResult.error.message || 'Upload failed.')
      }

      const finalizeResponse = await fetch(`/api/operator/cases/${caseId}/supporting-documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          storagePath: initPayload.storagePath,
          label: documentLabel,
          contentType: file.type,
        }),
      })

      const finalizePayload = (await finalizeResponse.json().catch(() => null)) as {
        error?: string
      } | null

      if (!finalizeResponse.ok) {
        throw new Error(finalizePayload?.error || 'Upload failed.')
      }

      setLabel('')
      onRefresh()
      setMutationState(INITIAL_MUTATION_STATE)
    } catch (error) {
      setMutationState({
        pending: false,
        error: error instanceof Error ? error.message : 'Upload failed.',
        action: 'upload',
      })
    }
  }

  async function removeDocument(documentId: string) {
    setMutationState({
      pending: true,
      error: null,
      action: 'delete',
      targetId: documentId,
    })

    try {
      const response = await fetch(`/api/operator/cases/${caseId}/supporting-documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      })

      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Remove failed.')
      }

      onRefresh()
      setMutationState(INITIAL_MUTATION_STATE)
    } catch (error) {
      setMutationState({
        pending: false,
        error: error instanceof Error ? error.message : 'Remove failed.',
        action: 'delete',
        targetId: documentId,
      })
    }
  }

  function handleSelectFile(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    const trimmedLabel = label.trim()

    if (!trimmedLabel) {
      setMutationState({
        pending: false,
        error: 'Add a label before uploading a supporting document.',
        action: 'upload',
      })
      event.target.value = ''
      return
    }

    void uploadDocument(selectedFile, trimmedLabel)
    event.target.value = ''
  }

  const reachedLimit = documents.length >= MAX_SUPPORTING_DOCUMENT_COUNT

  return (
    <div className="border border-zinc-200 bg-zinc-50/70 p-5">
      <SectionHeading
        title="Supporting tenancy documents"
        description="Upload invoices, quotes, receipts, correspondence, and other supporting files without affecting the core analysis reports."
        aside={
          <StatusBadge
            label={`${documents.length}/${MAX_SUPPORTING_DOCUMENT_COUNT} files`}
            tone={reachedLimit ? 'attention' : 'stable'}
          />
        }
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Document label
          </span>
          <input
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Invoice, contractor quote, cleaning receipt..."
            maxLength={80}
            className="mt-2 h-12 w-full border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-slate-400"
          />
        </label>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/*,application/pdf"
            className="hidden"
            onChange={handleSelectFile}
          />
          <button
            type="button"
            disabled={mutationState.pending || reachedLimit}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-12 items-center justify-center gap-2 border border-zinc-900 bg-zinc-900 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
          >
            {mutationState.pending && mutationState.action === 'upload' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {mutationState.pending && mutationState.action === 'upload'
              ? 'Uploading...'
              : reachedLimit
                ? 'Limit reached'
                : 'Upload document'}
          </button>
        </div>
      </div>

      {mutationState.error ? (
        <p className="mt-3 text-sm leading-6 text-rose-700 [overflow-wrap:anywhere]">
          {mutationState.error}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <EmptyState
          title="No supporting documents yet"
          body="Add labelled supporting files here so invoices, receipts, and correspondence stay attached to the case."
          className="mt-5 bg-white"
        />
      ) : (
        <div className="mt-5 overflow-hidden border border-zinc-200 bg-white">
          {documents.map((document) => {
            const isDeleting =
              mutationState.pending &&
              mutationState.action === 'delete' &&
              mutationState.targetId === document.id

            return (
              <div
                key={document.id}
                className="flex flex-col gap-4 border-b border-zinc-200 px-4 py-4 last:border-b-0 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={getDocumentTypeLabel(document)}
                      tone={getDocumentTone(document)}
                    />
                    {!document.canManage ? (
                      <StatusBadge label="Read only" tone="document" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-zinc-950 [overflow-wrap:anywhere]">
                    {document.label}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 [overflow-wrap:anywhere]">{document.name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open document
                  </a>
                  <a
                    href={document.file_url}
                    download={document.name}
                    className="inline-flex h-10 items-center justify-center gap-2 border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  {document.canManage ? (
                    <button
                      type="button"
                      disabled={mutationState.pending}
                      onClick={() => void removeDocument(document.id)}
                      className="inline-flex h-10 items-center justify-center gap-2 border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {isDeleting ? 'Removing...' : 'Remove'}
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
