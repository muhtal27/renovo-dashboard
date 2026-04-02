'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight, Plus, Users } from 'lucide-react'

type Team = {
  id: string
  name: string
  description: string | null
  memberCount: number
  createdAt: string
}

export function TeamsPanel() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const res = await fetch('/api/operator/teams', { credentials: 'same-origin' })
      if (cancelled) return
      if (res.ok) {
        const data = await res.json()
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
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
      setShowCreate(false)
      triggerRefresh()
    }

    setCreating(false)
  }

  async function handleDelete(teamId: string, name: string) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            Admin
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link
            href="/teams/members"
            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            Teams
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <span className="text-xs font-medium text-zinc-700">Groups</span>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-3.5 w-3.5" />
          New team
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

      {/* Create form */}
      {showCreate ? (
        <section className="border border-zinc-200 bg-white px-5 py-5">
          <p className="text-sm font-semibold text-zinc-950">Create a new team</p>
          <p className="mt-1 text-sm text-zinc-500">
            Teams let you organise workspace members into groups — e.g. by property portfolio or
            region.
          </p>
          <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
            <input
              type="text"
              required
              placeholder="e.g. North London Team"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="h-9 w-full border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              className="h-9 w-full border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:bg-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false)
                  setTeamName('')
                  setTeamDescription('')
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

      {/* Teams list */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Team groups</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {teams.length} team{teams.length !== 1 ? 's' : ''}
        </p>

        {loading ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse border border-zinc-100 bg-zinc-50" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="mt-4 py-8 text-center">
            <p className="text-sm text-zinc-500">No teams yet.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-3 inline-flex items-center gap-1.5 border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              New team
            </button>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Team</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                    Members
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr
                    key={team.id}
                    className="group border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/60"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-950">{team.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{team.description || '—'}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">{team.memberCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(team.id, team.name)}
                          className="px-2 py-1 text-xs font-medium text-rose-600 opacity-0 transition hover:bg-rose-50 group-hover:opacity-100"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/teams/teams/${team.id}`}
                          className="inline-flex items-center gap-1 border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300"
                        >
                          Manage
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
