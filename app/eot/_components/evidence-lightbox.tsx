'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImageIcon,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { cn } from '@/lib/ui'

/* ── Types ────────────────────────────────────────────────────── */

export type LightboxItem = {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  url: string
  area: string | null
  uploadedAt: string | null
}

type EvidenceLightboxProps = {
  items: LightboxItem[]
  activeIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

/* ── Keyboard trap hook ───────────────────────────────────────── */

function useKeyboardTrap(
  onClose: () => void,
  onPrev: () => void,
  onNext: () => void,
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onPrev()
          break
        case 'ArrowRight':
          onNext()
          break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onPrev, onNext])
}

/* ── File type icon ───────────────────────────────────────────── */

function FileTypeIcon({ type }: { type: LightboxItem['type'] }) {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-16 w-16 text-zinc-300" />
    case 'video':
      return <Video className="h-16 w-16 text-zinc-300" />
    case 'document':
      return <FileText className="h-16 w-16 text-zinc-300" />
  }
}

/* ── Main lightbox component ──────────────────────────────────── */

export function EvidenceLightbox({
  items,
  activeIndex,
  onClose,
  onNavigate,
}: EvidenceLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const backdropRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Move focus into dialog on mount
  useEffect(() => {
    closeButtonRef.current?.focus()
    // Prevent background scrolling
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const item = items[activeIndex]
  if (!item) return null

  const hasPrev = activeIndex > 0
  const hasNext = activeIndex < items.length - 1

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onNavigate(activeIndex - 1)
      setZoom(1)
    }
  }, [hasPrev, activeIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(activeIndex + 1)
      setZoom(1)
    }
  }, [hasNext, activeIndex, onNavigate])

  useKeyboardTrap(onClose, handlePrev, handleNext)

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose()
    },
    [onClose],
  )

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Evidence viewer: ${item.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80"
      onClick={handleBackdropClick}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-zinc-950/60 to-transparent px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{item.name}</p>
          <p className="text-xs text-zinc-400">
            {activeIndex + 1} of {items.length}
            {item.area ? ` · ${item.area}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-xs tabular-nums text-zinc-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="mx-1 h-5 w-px bg-zinc-700" />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close viewer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Previous item"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Next item"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Content area */}
      <div
        className="flex items-center justify-center overflow-auto"
        style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
      >
        {item.type === 'image' && item.url && item.url !== '#' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.name}
            className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-12 py-16">
            <FileTypeIcon type={item.type} />
            <p className="text-sm font-medium text-zinc-400">{item.name}</p>
            <p className="text-xs text-zinc-600">
              {item.type === 'document'
                ? 'Document preview not available'
                : item.type === 'video'
                  ? 'Video preview not available'
                  : 'Image placeholder'}
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-zinc-950/60 to-transparent px-4 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto">
            {items.map((thumb, i) => (
              <button
                key={thumb.id}
                type="button"
                onClick={() => { onNavigate(i); setZoom(1) }}
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition',
                  i === activeIndex
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500',
                )}
                aria-label={`View ${thumb.name}`}
              >
                <FileTypeIcon type={thumb.type} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
