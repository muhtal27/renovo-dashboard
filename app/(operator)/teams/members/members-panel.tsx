'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight, Plus, Settings, UserPlus } from 'lucide-react'

/* ─── Types ─── */

type Member = {
  membershipId: string
  userId: string
  email: string | null
  fullName: string | null
  role: string
  status: string
  createdAt: string
}

type Team = {
  id: string
  name: string
  description: string | null
  memberCount: number
  createdAt: string
}

const ROLE_OPTIONS = [
  { value: 'operator', label: 'Operator' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
] as const

function roleBadgeClass(role: string) {
  return role === 'admin' ? 'badge-violet' : 'badge-zinc'
}

function statusBadgeClass(status: string) {
  return status === 'active' ? 'badge-emerald' : 'badge-amber'
}

function getInitials(name: string | null, email: string | null) {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return (email ?? '?')[0].toUpperCase()
}

/* ─── Component ─── */

export function MembersPanel() {
  const [tab, setTab] = useState<'members' | 'groups'>('members')
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>('operator')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  /* Team creation state */
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [membersRes, teamsRes] = await Promise.all([
        fetch('/api/operator/members', { credentials: 'same-origin' }),
        fetch('/api/operator/teams', { credentials: 'same-origin' }),
      ])
      if (cancelled) return
      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data.members ?? [])
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json()
        setTeams(data.teams ?? [])
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [refreshKey])

  function triggerRefresh() {
    setRefreshKey((k) => k + 1)
  }

  /* ─── Member actions ─── */

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

  async function handleRemoveMember(membershipId: string, email: string | null) {
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

  /* ─── Team actions ─── */

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    setCreatingTeam(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/operator/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ name: teamName, description: teamDescription || undefined }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to create team.')
    } else {
      setSuccess(`Team "${data.team.name}" created.`)
      setTeamName('')
      setTeamDescription('')
      setShowCreateTeam(false)
      triggerRefresh()
    }

    setCreatingTeam(false)
  }

  async function handleDeleteTeam(teamId: string, name: string) {
    if (!confirm(`Delete team "${name}"? All team memberships will be removed.`)) return
    setError(null)
    const res = await fetch(`/api/operator/teams/${teamId}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to delete team.')
    } else {
      triggerRefresh()
    }
  }

  /* ─── Render ─── */

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Teams</h2>
          <p className="mt-1 text-sm text-zinc-500">Manage members and team groups</p>
        </div>
        {tab === 'members' ? (
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Invite Member
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreateTeam(true)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Team
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setTab('members')}
          className={`border-b-2 px-[18px] py-2.5 text-[13px] font-medium transition ${
            tab === 'members'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Members
        </button>
        <button
          type="button"
          onClick={() => setTab('groups')}
          className={`border-b-2 px-[18px] py-2.5 text-[13px] font-medium transition ${
            tab === 'groups'
              ? 'border-zinc-900 text-zinc-900'
              : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Team Groups
        </button>
      </div>

      {/* Messages */}
      {error ? (
        <p className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {/* Invite member form */}
      {showInvite && tab === 'members' ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
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
              className="h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,.1)]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="h-10 rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,.1)]"
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
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-zinc-900 bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                {inviting ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { setShowInvite(false); setInviteEmail(''); setError(null) }}
                className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Create team form */}
      {showCreateTeam && tab === 'groups' ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-950">Create a new team</p>
          <p className="mt-1 text-sm text-zinc-500">
            Teams let you organise workspace members into groups — e.g. by property portfolio or region.
          </p>
          <form onSubmit={handleCreateTeam} className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
            <input
              type="text"
              required
              placeholder="e.g. Edinburgh Portfolio"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,.1)]"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] outline-none transition focus:border-emerald-400 focus:shadow-[0_0_0_3px_rgba(16,185,129,.1)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creatingTeam}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-zinc-900 bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                {creatingTeam ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreateTeam(false); setTeamName(''); setTeamDescription(''); setError(null) }}
                className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* ────── Members tab ────── */}
      {tab === 'members' ? (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-[10px] border border-zinc-100/80 bg-zinc-50" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-[10px] border border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-500">No team members yet.</p>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-[10px] border border-zinc-200 bg-white">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Cases</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr
                    key={member.membershipId}
                    className="group transition hover:bg-zinc-50"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                          {getInitials(member.fullName, member.email)}
                        </div>
                        <span className="font-medium text-zinc-900">
                          {member.fullName ?? member.email ?? 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="text-zinc-500">
                      {member.email ?? '—'}
                    </td>
                    <td>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.membershipId, e.target.value)}
                        className={`badge cursor-pointer outline-none transition hover:opacity-80 ${roleBadgeClass(member.role)}`}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(member.status)}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-right font-semibold tabular-nums text-zinc-900">
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}

      {/* ────── Team Groups tab ────── */}
      {tab === 'groups' ? (
        loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-[10px] border border-zinc-100/80 bg-zinc-50" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="rounded-[10px] border border-zinc-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-zinc-500">No teams yet.</p>
            <button
              type="button"
              onClick={() => setShowCreateTeam(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[10px] border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Team
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-900">{team.name}</h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      className="rounded-[6px] px-2 py-1 text-xs font-medium text-rose-600 opacity-0 transition hover:bg-rose-50 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                    <Link
                      href={`/teams/teams/${team.id}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Member avatars */}
                <div className="mt-3 flex gap-2">
                  {members.slice(0, team.memberCount || 3).map((m) => (
                    <div
                      key={m.membershipId}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700"
                      title={m.fullName ?? m.email ?? undefined}
                    >
                      {getInitials(m.fullName, m.email)}
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-zinc-500">
                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </div>
  )
}
