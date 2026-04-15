'use client'

import { useState } from 'react'
import {
  FileText,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Check,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import { EmptyState } from '@/app/operator-ui'

/* ── Types ────────────────────────────────────────────────────── */

type InventoryDocument = {
  id: string
  name: string
  type: 'checkin' | 'checkout' | 'schedule' | 'supporting'
  status: 'uploaded' | 'pending' | 'missing'
  uploadedAt: string | null
  fileUrl: string | null
  pageCount: number | null
}

/* ── Mock data ────────────────────────────────────────────────── */

const MOCK_DOCUMENTS: InventoryDocument[] = [
  {
    id: 'doc-1',
    name: 'Check-in Inventory Report',
    type: 'checkin',
    status: 'uploaded',
    uploadedAt: '12 Mar 2026',
    fileUrl: '#',
    pageCount: 24,
  },
  {
    id: 'doc-2',
    name: 'Check-out Inventory Report',
    type: 'checkout',
    status: 'uploaded',
    uploadedAt: '08 Apr 2026',
    fileUrl: '#',
    pageCount: 28,
  },
  {
    id: 'doc-3',
    name: 'Schedule of Condition',
    type: 'schedule',
    status: 'uploaded',
    uploadedAt: '12 Mar 2026',
    fileUrl: '#',
    pageCount: 6,
  },
  {
    id: 'doc-4',
    name: 'Supporting Photographs',
    type: 'supporting',
    status: 'pending',
    uploadedAt: null,
    fileUrl: null,
    pageCount: null,
  },
]

/* ── Document card ────────────────────────────────────────────── */

function DocumentCard({ doc }: { doc: InventoryDocument }) {
  const statusConfig = {
    uploaded: { label: 'Uploaded', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: Check },
    pending: { label: 'Pending', tone: 'border-amber-200 bg-amber-50 text-amber-700', icon: Clock },
    missing: { label: 'Missing', tone: 'border-rose-200 bg-rose-50 text-rose-700', icon: Clock },
  }

  const config = statusConfig[doc.status]
  const StatusIcon = config.icon

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
        {doc.uploadedAt && (
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Uploaded {doc.uploadedAt}
            {doc.pageCount ? ` · ${doc.pageCount} pages` : ''}
          </p>
        )}
        {doc.status === 'uploaded' && doc.fileUrl && (
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ExternalLink className="h-3 w-3" />
            View Document
          </button>
        )}
        {doc.status === 'pending' && (
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Upload className="h-3 w-3" />
            Upload
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Upload zone ──────────────────────────────────────────────── */

function UploadDropZone() {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-dashed px-6 py-10 text-center transition',
        dragOver
          ? 'border-emerald-400 bg-emerald-50/50'
          : 'border-zinc-200 bg-zinc-50/50',
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false) }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault() } }}
      role="button"
      tabIndex={0}
      aria-label="Upload files by dragging or clicking"
    >
      <Upload className="mx-auto h-8 w-8 text-zinc-400" />
      <p className="mt-2 text-sm font-medium text-zinc-700">
        Drag files here or click to upload
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        PDF, JPG, PNG up to 15 files · Max 25MB each
      </p>
    </div>
  )
}

/* ── Evidence photos grid ─────────────────────────────────────── */

const MOCK_PHOTOS = [
  { id: 'p1', name: 'Living room overview', room: 'Living Room', thumbnail: null },
  { id: 'p2', name: 'Carpet stain close-up', room: 'Living Room', thumbnail: null },
  { id: 'p3', name: 'Kitchen extractor hood', room: 'Kitchen', thumbnail: null },
  { id: 'p4', name: 'Oven interior', room: 'Kitchen', thumbnail: null },
  { id: 'p5', name: 'Bedroom wall marks', room: 'Master Bedroom', thumbnail: null },
  { id: 'p6', name: 'Bathroom sealant', room: 'Bathroom', thumbnail: null },
]

function EvidencePhotoGrid() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-900">Evidence Photos</h4>
        <span className="text-xs text-zinc-500">{MOCK_PHOTOS.length} items</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {MOCK_PHOTOS.map((photo) => (
          <button
            key={photo.id}
            type="button"
            className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 transition hover:border-zinc-300 hover:shadow-sm"
            aria-label={`View ${photo.name}`}
          >
            <ImageIcon className="h-6 w-6 text-zinc-400 group-hover:text-zinc-600" />
            <span className="mt-1 max-w-full truncate px-1 text-[10px] text-zinc-500">
              {photo.room}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

export function WorkspaceInventoryPanel() {
  const uploaded = MOCK_DOCUMENTS.filter((d) => d.status === 'uploaded').length
  const total = MOCK_DOCUMENTS.length

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
            {uploaded} of {total} documents uploaded
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
      <div className="grid gap-4 lg:grid-cols-2">
        {MOCK_DOCUMENTS.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>

      {/* Evidence photos */}
      <EvidencePhotoGrid />

      {/* Upload zone */}
      <UploadDropZone />
    </div>
  )
}
