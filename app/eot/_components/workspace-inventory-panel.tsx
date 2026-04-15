'use client'

import { useCallback, useRef, useState } from 'react'
import {
  FileText,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Check,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import type { EotInventoryDocument, EotEvidencePhoto } from '@/lib/eot-types'
import { initEvidenceUpload, finalizeEvidenceUpload } from '@/lib/eot-api'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

/* ── Document card ────────────────────────────────────────────── */

function DocumentCard({ doc }: { doc: EotInventoryDocument }) {
  const statusConfig = {
    uploaded: { label: 'Uploaded', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: Check },
    pending: { label: 'Pending', tone: 'border-amber-200 bg-amber-50 text-amber-700', icon: Clock },
    missing: { label: 'Missing', tone: 'border-rose-200 bg-rose-50 text-rose-700', icon: Clock },
  }

  const config = statusConfig[doc.status]
  const StatusIcon = config.icon

  const dateStr = doc.uploaded_at
    ? (() => {
        try {
          return new Date(doc.uploaded_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        } catch {
          return doc.uploaded_at
        }
      })()
    : null

  return (
    <div className="stat-card flex items-start gap-4">
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
        doc.status === 'uploaded' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400',
      )}>
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[13px] font-semibold text-zinc-900">{doc.name}</h4>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
            config.tone,
          )}>
            <StatusIcon className="h-2.5 w-2.5" />
            {config.label}
          </span>
        </div>
        {dateStr && (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Uploaded {dateStr}
            {doc.page_count ? ` · ${doc.page_count} pages` : ''}
          </p>
        )}
        {doc.status === 'uploaded' && doc.file_url && (
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ExternalLink className="h-3 w-3" />
            View Document
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Upload zone ──────────────────────────────────────────────── */

type UploadDropZoneProps = {
  caseId: string
  onUploaded: (photo: EotEvidencePhoto) => void
}

function UploadDropZone({ caseId, onUploaded }: UploadDropZoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 15)
    if (fileArray.length === 0) return

    setUploading(true)
    setUploadError(null)

    for (const file of fileArray) {
      try {
        // 1. Get signed upload URL
        const init = await initEvidenceUpload(caseId, {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        })

        // 2. Upload file directly to Supabase Storage via signed URL
        const supabase = getSupabaseBrowserClient()
        const { error: uploadError } = await supabase.storage
          .from(init.bucketName)
          .uploadToSignedUrl(init.storagePath, init.token, file, {
            contentType: file.type || undefined,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        // 3. Finalize — persist DB record
        const result = await finalizeEvidenceUpload(caseId, {
          storagePath: init.storagePath,
          fileName: file.name,
          contentType: file.type,
        })

        onUploaded(result.evidence)
      } catch (err) {
        console.error('Evidence upload failed', { file: file.name, err })
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      }
    }

    setUploading(false)
  }, [caseId, onUploaded])

  return (
    <div>
      <div
        className={cn(
          'rounded-xl border-2 border-dashed px-6 py-10 text-center transition',
          uploading
            ? 'border-emerald-300 bg-emerald-50/30'
            : dragOver
              ? 'border-emerald-400 bg-emerald-50/50'
              : 'border-zinc-200 bg-zinc-50/50',
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length > 0) {
            void handleFiles(e.dataTransfer.files)
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
        role="button"
        tabIndex={0}
        aria-label="Upload files by dragging or clicking"
      >
        {uploading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
        ) : (
          <Upload className="mx-auto h-8 w-8 text-zinc-400" />
        )}
        <p className="mt-2 text-sm font-medium text-zinc-700">
          {uploading ? 'Uploading…' : 'Drag files here or click to upload'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          PDF, JPG, PNG up to 15 files · Max 25MB each
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            void handleFiles(e.target.files)
            e.target.value = ''
          }
        }}
      />
      {uploadError && (
        <p className="mt-2 text-sm text-rose-600">{uploadError}</p>
      )}
    </div>
  )
}

/* ── Evidence photos grid ─────────────────────────────────────── */

type EvidencePhotoGridProps = {
  photos: EotEvidencePhoto[]
  onPhotoClick: (index: number) => void
}

function EvidencePhotoGrid({ photos, onPhotoClick }: EvidencePhotoGridProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900">Evidence Photos</h4>
        <span className="text-xs text-zinc-500">{photos.length} items</span>
      </div>
      {photos.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No evidence photos uploaded yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => onPhotoClick(i)}
              className="group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 transition hover:border-zinc-300 hover:shadow-sm"
              aria-label={`View ${photo.name}`}
            >
              {photo.type === 'image' && photo.file_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.thumbnail_url ?? photo.file_url}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600" />
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 to-transparent px-1 pb-1 pt-3 text-[10px] text-white">
                {photo.room ?? photo.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

type WorkspaceInventoryPanelProps = {
  caseId: string
  documents: EotInventoryDocument[]
  photos: EotEvidencePhoto[]
  onPhotoClick: (index: number) => void
  onPhotoAdded: (photo: EotEvidencePhoto) => void
}

export function WorkspaceInventoryPanel({
  caseId,
  documents,
  photos,
  onPhotoClick,
  onPhotoAdded,
}: WorkspaceInventoryPanelProps) {
  const uploaded = documents.filter((d) => d.status === 'uploaded').length
  const total = documents.length || 1

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-zinc-900">
            Inventory Documents
          </p>
          <p className="text-[11px] text-zinc-500">
            {uploaded} of {documents.length} documents uploaded
          </p>
        </div>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(uploaded / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Document cards */}
      {documents.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-500">No inventory documents found for this case.</p>
        </div>
      )}

      {/* Evidence photos */}
      <EvidencePhotoGrid photos={photos} onPhotoClick={onPhotoClick} />

      {/* Upload zone */}
      <UploadDropZone caseId={caseId} onUploaded={onPhotoAdded} />
    </div>
  )
}
