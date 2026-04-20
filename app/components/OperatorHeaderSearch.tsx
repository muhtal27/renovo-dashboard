'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { filterCommandItems, groupCommandItems } from '@/app/components/command-items'
import { cn } from '@/lib/ui'

// Header-local type-ahead search — prototype: public/demo.html:2015-2030
export function OperatorHeaderSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => filterCommandItems(value), [value])
  const grouped = useMemo(() => groupCommandItems(filtered), [filtered])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleSelect(href: string) {
    setOpen(false)
    setValue('')
    router.push(href)
  }

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setOpen(event.target.value.length > 0)
          }}
          onFocus={() => {
            if (value.length > 0) setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false)
            }
            if (event.key === 'Enter' && filtered[0]) {
              event.preventDefault()
              handleSelect(filtered[0].href)
            }
          }}
          placeholder={placeholder}
          className="h-9 w-full max-w-[420px] rounded-[14px] border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </label>

      {open ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[340px] max-w-[420px] overflow-y-auto rounded-[14px] border border-zinc-200 bg-white p-1.5 shadow-lg"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <p className="px-4 py-4 text-center text-[13px] text-zinc-400">No results found</p>
          ) : (
            Array.from(grouped.entries()).map(([section, items]) => (
              <div key={section}>
                <p className="px-2.5 pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
                  {section}
                </p>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault()
                        handleSelect(item.href)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] text-zinc-700 transition',
                        'hover:bg-zinc-50'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
