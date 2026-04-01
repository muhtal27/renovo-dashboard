'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Users, ChevronRight } from 'lucide-react'
import { PageHeader, EmptyState } from '@/app/operator-ui'

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

  async function handleDelete(teamId: string, teamName: string) {
    if (!confirm(`Delete team "${teamName}"? All team memberships will be removed.`)) return

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
      <PageHeader
        eyebrow="Settings"
        title="Teams"
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
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 hover:border-emerald-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              New team
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

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-semibold text-zinc-950">Create a new team</p>
          <p className="mt-1 text-sm text-zinc-500">
            Teams let you organise workspace members into groups — e.g. by property portfolio or region.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr_auto]">
            <div>
              <label htmlFor="team-name" className="sr-only">
                Team name
              </label>
              <input
                id="team-name"
                type="text"
                required
                placeholder="e.g. North London Team"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="team-description" className="sr-only">
                Description (optional)
              </label>
              <input
                id="team-description"
                type="text"
                placeholder="Description (optional)"
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 hover:border-emerald-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setTeamName(''); setTeamDescription(''); setError(null) }}
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
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          body="Create your first team to organise workspace members into groups."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              New team
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="group flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-5 py-4 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium text-zinc-900">{team.name}</p>
                  {team.description ? (
                    <p className="mt-0.5 text-xs text-zinc-400">{team.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-500">
                  {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                </span>

                <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => handleDelete(team.id, team.name)}
                    className="rounded px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>

                <Link
                  href={`/settings/teams/${team.id}`}
                  className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-950"
                >
                  Manage
                  <ChevronRight className="h-3 w-3" strokeWidth={2} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
