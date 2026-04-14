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

function statusBadgeClass(status: string) {
  switch (status) {
    case 'draft': return 'badge-zinc'
    case 'collecting_evidence': return 'badge-sky'
    case 'analysis': return 'badge-indigo'
    case 'review':
    case 'draft_sent': return 'badge-amber'
    case 'ready_for_claim': return 'badge-emerald'
    case 'submitted': return 'badge-cyan'
    case 'disputed': return 'badge-rose'
    case 'resolved': return 'badge-emerald'
    default: return 'badge-zinc'
  }
}

export function CaseAllocationPanel() {
  const [cases, setCases] = useState<EotCaseListItem[]>([])
  const [members, setMembers] = useState<Assignee[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
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
          ? `Assigned to ${assigneeLabel(memberName!)}`
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

  const unassignedCount = cases.filter((c) => c.assigned_to === null).length
  const activeMembers = members.length
  const memberMap = new Map(members.map((m) => [m.userId, m]))

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
          ))}
        </div>
        <div className="h-[300px] animate-pulse rounded-[10px] border border-zinc-200 bg-white" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {loadError}
      </div>
    )
  }

  return (
    <>
      {/* Stat cards row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="text-xs font-medium text-zinc-500">Unassigned Cases</div>
          <div className="mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums text-amber-700">
            {unassignedCount}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="text-xs font-medium text-zinc-500">Team Members</div>
          <div className="mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums text-zinc-900">
            {members.length}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="text-xs font-medium text-zinc-500">Active Operators</div>
          <div className="mt-2 text-[28px] font-bold leading-none tracking-tight tabular-nums text-zinc-900">
            {activeMembers}
          </div>
        </div>
      </div>

      {/* Case Allocation card */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-base font-semibold text-zinc-900">Case Allocation</h3>

        {/* Inline assign error */}
        {assignError ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
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

        {cases.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">No cases found.</p>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-zinc-200">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Property</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((caseItem) => {
                  const isAssigning = assigning === caseItem.id
                  return (
                    <tr key={caseItem.id} className="transition hover:bg-zinc-50">
                      <td className="font-medium text-zinc-900">
                        <Link href={`/operator/cases/${caseItem.id}`} className="hover:underline">
                          {caseItem.id.slice(0, 12)}
                        </Link>
                      </td>
                      <td className="text-zinc-700">
                        {buildAddress(caseItem.property).split(',')[0]}
                      </td>
                      <td>
                        <span className={`badge ${statusBadgeClass(caseItem.status)}`}>
                          {formatEnumLabel(caseItem.status)}
                        </span>
                      </td>
                      <td>
                        <select
                          value={caseItem.assigned_to ?? ''}
                          disabled={isAssigning}
                          onChange={(e) => {
                            const value = e.target.value || null
                            if (value === null && caseItem.assigned_to) {
                              setConfirmRemove({
                                caseId: caseItem.id,
                                address: buildAddress(caseItem.property),
                              })
                            } else {
                              void handleAssign(caseItem.id, value)
                            }
                          }}
                          className="h-8 w-[180px] rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-700 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10 disabled:opacity-50"
                        >
                          <option value="">Unassigned</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {assigneeLabel(m)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </>
  )
}
