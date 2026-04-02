'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, UserPlus } from 'lucide-react'
import { PageHeader, EmptyState } from '@/app/operator-ui'

type TeamInfo = {
  id: string
  name: string
  description: string | null
  createdAt: string
}

type TeamMember = {
  teamMembershipId: string
  userId: string
  email: string | null
  fullName: string | null
  role: string
  createdAt: string
}

type WorkspaceMember = {
  membershipId: string
  userId: string
  email: string | null
  fullName: string | null
  role: string
  status: string
}

const TEAM_ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'lead', label: 'Lead' },
] as const

export function TeamDetailPanel({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [addRole, setAddRole] = useState<string>('member')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [teamRes, membersRes, workspaceRes] = await Promise.all([
        fetch(`/api/operator/teams/${teamId}`, { credentials: 'same-origin' }),
        fetch(`/api/operator/teams/${teamId}/members`, { credentials: 'same-origin' }),
        fetch('/api/operator/members', { credentials: 'same-origin' }),
      ])

      if (cancelled) return

      if (teamRes.ok) {
        const data = await teamRes.json()
        setTeam(data.team ?? null)
      }

      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members ?? [])
      }

      if (workspaceRes.ok) {
        const data = await workspaceRes.json()
        setWorkspaceMembers(data.members ?? [])
      }

      setLoading(false)
    }

    load()

    return () => { cancelled = true }
  }, [teamId, refreshKey])

  function triggerRefresh() {
    setRefreshKey((k) => k + 1)
  }

  // Filter workspace members not already in this team
  const availableMembers = workspaceMembers.filter(
    (wm) => wm.status === 'active' && !members.some((tm) => tm.userId === wm.userId)
  )

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError(null)
    setSuccess(null)

    const res = await fetch(`/api/operator/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ userId: selectedUserId, role: addRole }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to add member.')
    } else {
      const added = workspaceMembers.find((wm) => wm.userId === selectedUserId)
      setSuccess(`${added?.email ?? 'Member'} added as ${addRole}.`)
      setSelectedUserId('')
      setAddRole('member')
      setShowAdd(false)
      triggerRefresh()
    }

    setAdding(false)
  }

  async function handleRoleChange(teamMembershipId: string, newRole: string) {
    setError(null)
    const res = await fetch(`/api/operator/teams/${teamId}/members/${teamMembershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ role: newRole }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to update role.')
    } else {
      triggerRefresh()
    }
  }

  async function handleRemove(teamMembershipId: string, email: string | null) {
    if (!confirm(`Remove ${email ?? 'this member'} from the team?`)) return

    setError(null)
    const res = await fetch(`/api/operator/teams/${teamId}/members/${teamMembershipId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to remove member.')
    } else {
      triggerRefresh()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-3 py-8">
          <div className="h-6 w-48 rounded bg-zinc-100" />
          <div className="h-4 w-32 rounded bg-zinc-50" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="h-4 w-40 rounded bg-zinc-100" />
                <div className="h-4 w-20 rounded bg-zinc-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="Team not found"
          body="This team may have been deleted."
          action={
            <Link
              href="/teams/teams"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Back to teams
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teams"
        title={team.name}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/teams/teams"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              All teams
            </Link>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 hover:border-emerald-700"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} />
              Add member
            </button>
          </div>
        }
      />

      {team.description ? (
        <p className="text-sm text-zinc-500">{team.description}</p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {showAdd ? (
        <form
          onSubmit={handleAdd}
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-zinc-950">Add a workspace member to this team</p>
          <p className="mt-1 text-sm text-zinc-500">
            Only workspace members who are not already in this team are shown.
          </p>

          {availableMembers.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              All active workspace members are already in this team.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-[2fr_160px_auto]">
              <div>
                <label htmlFor="add-user" className="sr-only">
                  Workspace member
                </label>
                <select
                  id="add-user"
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Select a member...</option>
                  {availableMembers.map((wm) => (
                    <option key={wm.userId} value={wm.userId}>
                      {wm.fullName ?? wm.email ?? wm.userId}
                      {wm.fullName && wm.email ? ` (${wm.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="add-role" className="sr-only">
                  Team role
                </label>
                <select
                  id="add-role"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {TEAM_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={adding || !selectedUserId}
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 hover:border-emerald-700 disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  {adding ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setSelectedUserId(''); setError(null) }}
                  className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      ) : null}

      {members.length === 0 ? (
        <EmptyState
          title="No team members"
          body="Add workspace members to this team to get started."
          action={
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} />
              Add member
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Member
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Team role
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map((member) => (
                <tr key={member.teamMembershipId} className="group">
                  <td className="px-5 py-3">
                    <p className="font-medium text-zinc-900">
                      {member.fullName ?? member.email ?? 'Unknown'}
                    </p>
                    {member.fullName && member.email ? (
                      <p className="mt-0.5 text-xs text-zinc-400">{member.email}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.teamMembershipId, e.target.value)}
                      className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none transition hover:border-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {TEAM_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => handleRemove(member.teamMembershipId, member.email)}
                        className="rounded px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
