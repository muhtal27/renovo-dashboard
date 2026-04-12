'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { assignEotCase, listEotCases } from '@/lib/eot-api'
import type { EotCaseListItem } from '@/lib/eot-types'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'

type Assignee = {
  userId: string
  email: string | null
  fullName: string | null
}

function formatEnumLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildAddress(property: EotCaseListItem['property']): string {
  const parts = [property.address_line_1, property.city, property.postcode].filter(Boolean)
  return parts.join(', ') || property.name
}

function assigneeLabel(assignee: Assignee) {
  return assignee.fullName || assignee.email || assignee.userId.slice(0, 8)
}

export function CaseAllocationPanel() {
  const [cases, setCases] = useState<EotCaseListItem[]>([])
  const [members, setMembers] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [filter, setFilter] = useState<'unallocated' | 'allocated' | 'all'>('unallocated')
  const [confirmRemove, setConfirmRemove] = useState<{ caseId: string; address: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      try {
        const [casesResult, assigneesResult] = await Promise.all([
          listEotCases(),
          fetch('/api/operator/assignees').then((r) => r.json()) as Promise<{ assignees: Assignee[] }>,
        ])

        if (!cancelled) {
          setCases(casesResult)
          setMembers(assigneesResult.assignees ?? [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setLoadError(loadError instanceof Error ? loadError.message : 'Failed to load data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  async function handleAssign(caseId: string, userId: string | null) {
    setAssigning(caseId)
    setAssignError(null)

    try {
      await assignEotCase(caseId, userId)
      setCases((current) =>
        current.map((c) => (c.id === caseId ? { ...c, assigned_to: userId } : c))
      )
      const memberName = userId ? memberMap.get(userId) : null
      toast.success(
        userId
          ? `Case assigned to ${assigneeLabel(memberName!)}`
          : 'Assignment removed'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to assign case.'
      setAssignError(msg)
      toast.error(msg)
    } finally {
      setAssigning(null)
    }
  }

  const filteredCases = cases.filter((c) => {
    if (filter === 'unallocated') return c.assigned_to === null
    if (filter === 'allocated') return c.assigned_to !== null
    return true
  })

  const unallocatedCount = cases.filter((c) => c.assigned_to === null).length
  const allocatedCount = cases.filter((c) => c.assigned_to !== null).length

  const memberMap = new Map(members.map((m) => [m.userId, m]))

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-zinc-400">
        Loading cases and members...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Inline assign error */}
      {assignError ? (
        <div className="flex items-center justify-between gap-3 border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          <span>{assignError}</span>
          <button
            type="button"
            onClick={() => setAssignError(null)}
            className="text-xs font-medium text-rose-600 hover:text-rose-800"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Filter tabs */}
      <div className="flex items-center gap-0">
        {[
          { value: 'unallocated' as const, label: `Unallocated (${unallocatedCount})` },
          { value: 'allocated' as const, label: `Allocated (${allocatedCount})` },
          { value: 'all' as const, label: `All (${cases.length})` },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              filter === tab.value
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Case list */}
      {filteredCases.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          {filter === 'unallocated'
            ? 'All cases have been allocated.'
            : filter === 'allocated'
              ? 'No cases have been allocated yet.'
              : 'No cases found.'}
        </p>
      ) : (
        <div className="overflow-hidden border border-zinc-200/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200/60 bg-zinc-50/60">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                  Property
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                  Tenant
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                  Assigned to
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem) => {
                const isAssigning = assigning === caseItem.id

                return (
                  <tr
                    key={caseItem.id}
                    className="border-b border-zinc-100/80 last:border-0 transition modern-table-row"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/operator/cases/${caseItem.id}`}
                        className="font-medium text-zinc-950 hover:underline"
                      >
                        {buildAddress(caseItem.property)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">
                      {caseItem.tenant_name}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-zinc-600">
                        {formatEnumLabel(caseItem.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={caseItem.assigned_to ?? ''}
                        disabled={isAssigning}
                        onChange={(e) => {
                          const value = e.target.value || null
                          void handleAssign(caseItem.id, value)
                        }}
                        className="h-7 w-full max-w-[200px] border border-zinc-200/60 bg-white px-2 text-xs text-zinc-700 disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {assigneeLabel(m)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {caseItem.assigned_to ? (
                        <button
                          type="button"
                          disabled={isAssigning}
                          onClick={() =>
                            setConfirmRemove({
                              caseId: caseItem.id,
                              address: buildAddress(caseItem.property),
                            })
                          }
                          className="text-xs font-medium text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                        >
                          {isAssigning ? 'Removing...' : 'Remove'}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          {isAssigning ? 'Assigning...' : 'Select member'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remove assignment"
        description={
          confirmRemove
            ? `Are you sure you want to unassign the case for ${confirmRemove.address}? It will return to the unallocated queue.`
            : ''
        }
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (confirmRemove) {
            void handleAssign(confirmRemove.caseId, null)
          }
          setConfirmRemove(null)
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  )
}
