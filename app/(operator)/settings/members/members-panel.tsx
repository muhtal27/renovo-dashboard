'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'

type Member = {
  membershipId: string
  userId: string
  email: string | null
  fullName: string | null
  role: string
  status: string
  createdAt: string
}

const ROLE_OPTIONS = [
  { value: 'operator', label: 'Operator' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
] as const

export function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('operator')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const res = await fetch('/api/operator/members', { credentials: 'same-origin' })
      if (cancelled) return
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members ?? [])
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [refreshKey])

  function triggerRefresh() {
    setRefreshKey((k) => k + 1)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/operator/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to add member.')
    } else {
      setSuccess(`${data.email} added as ${data.role}.`)
      setInviteEmail('')
      setInviteRole('operator')
      setShowInvite(false)
      triggerRefresh()
    }

    setInviting(false)
  }

  async function handleRoleChange(membershipId: string, newRole: string) {
    setError(null)
    const res = await fetch(`/api/operator/members/${membershipId}`, {
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

  async function handleStatusChange(membershipId: string, newStatus: string) {
    setError(null)
    const res = await fetch(`/api/operator/members/${membershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to update status.')
    } else {
      triggerRefresh()
    }
  }

  async function handleRemove(membershipId: string, email: string | null) {
    if (!confirm(`Remove ${email ?? 'this member'} from the workspace?`)) return
    setError(null)
    const res = await fetch(`/api/operator/members/${membershipId}`, {
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

  const activeCount = members.filter((m) => m.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/overview"
            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            Admin
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <span className="text-xs font-medium text-zinc-700">Members</span>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add member
        </button>
      </div>

      {error ? (
        <p className="border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {/* Invite form */}
      {showInvite ? (
        <section className="border border-zinc-200 bg-white px-5 py-5">
          <p className="text-sm font-semibold text-zinc-950">Add a new member</p>
          <p className="mt-1 text-sm text-zinc-500">
            Enter their email address. If they don&apos;t have an auth account yet, one will be
            created automatically.
          </p>
          <form onSubmit={handleInvite} className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-9 w-full border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="h-9 border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                {inviting ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvite(false)
                  setInviteEmail('')
                  setError(null)
                }}
                className="border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Members table */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Workspace members</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {members.length} member{members.length !== 1 ? 's' : ''} · {activeCount} active
        </p>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse border border-zinc-100 bg-zinc-50" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="mt-4 py-8 text-center">
            <p className="text-sm text-zinc-500">No team members yet.</p>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="mt-3 inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add member
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Member
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Role</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.membershipId}
                    className="group border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/60"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-950">
                        {member.fullName ?? member.email ?? 'Unknown'}
                      </p>
                      {member.fullName && member.email ? (
                        <p className="mt-0.5 text-xs text-zinc-400">{member.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.membershipId, e.target.value)}
                        className="border border-transparent bg-transparent px-1 py-0.5 text-sm text-zinc-600 outline-none transition hover:border-zinc-200 focus:border-zinc-400"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.status === 'active'
                              ? 'bg-emerald-500'
                              : member.status === 'suspended'
                                ? 'bg-amber-500'
                                : 'bg-zinc-300'
                          }`}
                        />
                        <span className="text-zinc-600">
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                        {member.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(member.membershipId, 'suspended')}
                            className="px-2 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(member.membershipId, 'active')}
                            className="px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemove(member.membershipId, member.email)}
                          className="px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
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
      </section>

      {/* Link to teams */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Team groups</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Organise members into teams by portfolio, region, or function.
            </p>
          </div>
          <Link
            href="/settings/teams"
            className="border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            Manage teams
          </Link>
        </div>
      </section>
    </div>
  )
}
