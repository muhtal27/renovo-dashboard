'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/ui'
import { filterCommandItems, groupCommandItems, type CommandItem } from '@/app/components/command-items'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filtered = useMemo(() => filterCommandItems(query), [query])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const handleSelect = useCallback(
    (item: CommandItem) => {
      handleClose()
      router.push(item.href)
    },
    [handleClose, router]
  )

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
        if (!open) {
          setQuery('')
          setSelectedIndex(0)
        }
      }

      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [open, handleClose])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleKeydown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  const grouped = groupCommandItems(filtered)

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/40 pt-[20vh]"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-[14px] border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeydown}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <kbd className="hidden rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-400">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section}>
                <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  {section}
                </p>
                {items.map((item) => {
                  const idx = flatIndex++
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-zinc-700 transition',
                        idx === selectedIndex
                          ? 'bg-zinc-50'
                          : 'hover:bg-zinc-50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-60" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.description ? (
                          <p className="truncate text-xs text-zinc-400">{item.description}</p>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
