'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, UserPlus } from 'lucide-react'
import { PageHeader, EmptyState } from '@/app/operator-ui'

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

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'active'
      ? 'bg-emerald-500'
      : status === 'suspended'
        ? 'bg-amber-500'
        : 'bg-zinc-300'

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Team members"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              Settings
            </Link>
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 hover:border-emerald-700"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2} />
              Add member
            </button>
          </div>
        }
      />

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

      {showInvite ? (
        <form
          onSubmit={handleInvite}
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-zinc-950">Add a new team member</p>
          <p className="mt-1 text-sm text-zinc-500">
            Enter their email address. If they don&apos;t have a Supabase auth account yet, one will be created automatically.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_160px_auto]">
            <div>
              <label htmlFor="invite-email" className="sr-only">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                placeholder="name@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="invite-role" className="sr-only">
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 hover:border-emerald-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                {inviting ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => { setShowInvite(false); setInviteEmail(''); setError(null) }}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="space-y-3 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="h-4 w-40 rounded bg-zinc-100" />
                <div className="h-4 w-20 rounded bg-zinc-50" />
              </div>
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          title="No team members"
          body="Add your first team member to get started."
          action={
            <button
              onClick={() => setShowInvite(true)}
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
                  Role
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.map((member) => (
                <tr key={member.membershipId} className="group">
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
                      onChange={(e) => handleRoleChange(member.membershipId, e.target.value)}
                      className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm outline-none transition hover:border-zinc-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <StatusDot status={member.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                      {member.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(member.membershipId, 'suspended')}
                          className="rounded px-2 py-1 text-xs font-medium text-amber-600 transition hover:bg-amber-50"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(member.membershipId, 'active')}
                          className="rounded px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(member.membershipId, member.email)}
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
