'use client'

import { useMemo, useState } from 'react'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import type { CaseDocumentRole, EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'
import { supabase } from '@/lib/supabase'
import { formatDateTime, formatLabel, getDocumentRoleTone, getExtractionTone } from '@/app/cases/[id]/workspace-utils'

const STORAGE_BUCKET_CANDIDATES = ['case-documents', 'documents', 'tenancy-documents'] as const

const DOCUMENT_ROLE_OPTIONS: Array<{ value: CaseDocumentRole; label: string }> = [
  { value: 'check_in', label: 'Check-in' },
  { value: 'check_out', label: 'Check-out' },
  { value: 'photo', label: 'Photo' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'tenancy_agreement', label: 'Tenancy agreement' },
  { value: 'supporting_evidence', label: 'Supporting evidence' },
  { value: 'other', label: 'Other' },
]

type EvidencePackProps = {
  caseId: string
  endOfTenancyCaseId: string
  documents: EndOfTenancyWorkspacePayload['documents']
  onRefresh: () => Promise<void>
}

async function uploadDocumentToStorage(file: File, caseId: string) {
  const safeName = file.name.replace(/\s+/g, '-')
  const storagePath = `cases/${caseId}/${Date.now()}-${safeName}`
  let lastError: string | null = null

  for (const bucket of STORAGE_BUCKET_CANDIDATES) {
    const uploadResult = await supabase.storage.from(bucket).upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

    if (uploadResult.error) {
      lastError = uploadResult.error.message
      continue
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl

    return {
      storagePath,
      fileUrl: publicUrl || null,
      bucket,
    }
  }

  throw new Error(lastError || 'Unable to upload this file to storage.')
}

export function EvidencePack({
  caseId,
  endOfTenancyCaseId,
  documents,
  onRefresh,
}: EvidencePackProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentRole, setDocumentRole] = useState<CaseDocumentRole>('supporting_evidence')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sortedDocuments = useMemo(
    () =>
      [...documents].sort((left, right) =>
        (right.created_at || '').localeCompare(left.created_at || '')
      ),
    [documents]
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError('Choose a file to attach.')
      return
    }

    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const upload = await uploadDocumentToStorage(selectedFile, caseId)

      await endOfTenancyApiRequest(`/api/end-of-tenancy/${endOfTenancyCaseId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'attach_evidence',
          fileName: selectedFile.name,
          fileUrl: upload.fileUrl,
          storagePath: upload.storagePath,
          mimeType: selectedFile.type || 'application/octet-stream',
          documentRole,
          notes: notes.trim() || null,
        }),
      })

      setSelectedFile(null)
      setDocumentRole('supporting_evidence')
      setNotes('')
      setMessage('Evidence attached successfully.')
      await onRefresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to attach evidence.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="evidence" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="app-kicker">Evidence pack</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Documents and extraction status
          </h2>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
          {sortedDocuments.length} document{sortedDocuments.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="app-divider my-6" />

      {sortedDocuments.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-sm text-stone-500">
          No evidence has been attached yet. Upload the first checkout document to start the pack.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                <th className="px-3 py-2">Document name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Captured</th>
                <th className="px-3 py-2">Extraction</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedDocuments.map((document) => {
                const latestExtraction =
                  [...document.extractions].sort((left, right) =>
                    (right.created_at || '').localeCompare(left.created_at || '')
                  )[0] ?? null
                const viewHref =
                  document.file_url ||
                  (document.storage_path?.startsWith('http') ? document.storage_path : null)

                return (
                  <tr key={document.id} className="bg-white">
                    <td className="rounded-l-[1.4rem] border border-r-0 border-stone-200 px-3 py-4 text-sm font-medium text-stone-900">
                      {document.file_name || 'Untitled document'}
                    </td>
                    <td className="border border-r-0 border-stone-200 px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getDocumentRoleTone(document.document_role)}`}>
                        {formatLabel(document.document_role)}
                      </span>
                    </td>
                    <td className="border border-r-0 border-stone-200 px-3 py-4 text-sm text-stone-700">
                      {formatLabel(document.source_type)}
                    </td>
                    <td className="border border-r-0 border-stone-200 px-3 py-4 text-sm text-stone-700">
                      {formatDateTime(document.captured_at || document.created_at)}
                    </td>
                    <td className="border border-r-0 border-stone-200 px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getExtractionTone(latestExtraction?.status || 'pending')}`}>
                        {latestExtraction ? formatLabel(latestExtraction.status) : 'Pending'}
                      </span>
                    </td>
                    <td className="rounded-r-[1.4rem] border border-stone-200 px-3 py-4 text-right">
                      {viewHref ? (
                        <a
                          href={viewHref}
                          target="_blank"
                          rel="noreferrer"
                          className="app-secondary-button inline-flex rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-stone-400">Unavailable</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="app-divider my-6" />

      <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-800" htmlFor="evidence-file">
            File
          </label>
          <input
            id="evidence-file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            className="app-field w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-800" htmlFor="document-role">
            Document role
          </label>
          <select
            id="document-role"
            value={documentRole}
            onChange={(event) => setDocumentRole(event.target.value as CaseDocumentRole)}
            className="app-field w-full"
          >
            {DOCUMENT_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-stone-800" htmlFor="evidence-notes">
            Notes
          </label>
          <textarea
            id="evidence-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="app-field w-full resize-y"
            placeholder="Optional context for the manager review trail"
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm">
            {message ? <p className="text-emerald-700">{message}</p> : null}
            {error ? <p className="text-red-700">{error}</p> : null}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="app-primary-button rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? 'Uploading evidence...' : 'Attach evidence'}
          </button>
        </div>
      </form>
    </section>
  )
}
