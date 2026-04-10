/**
 * Changelog types, constants, and server-side data access.
 *
 * Entries are stored in the `changelog_entries` Supabase table.
 * The GitHub Action at `.github/workflows/changelog.yml` creates new
 * entries automatically on every push to main.
 */

import 'server-only'

import { unstable_cache } from 'next/cache'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export type ChangelogCategory = 'added' | 'improved' | 'fixed' | 'removed'

export type ChangelogEntry = {
  version: string
  date: string
  title: string
  summary: string
  changes: Array<{
    category: ChangelogCategory
    items: string[]
  }>
}

export const CATEGORY_META: Record<
  ChangelogCategory,
  { label: string; color: string; dot: string }
> = {
  added: { label: 'Added', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  improved: { label: 'Improved', color: 'text-sky-700 bg-sky-50', dot: 'bg-sky-500' },
  fixed: { label: 'Fixed', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  removed: { label: 'Removed', color: 'text-zinc-600 bg-zinc-100', dot: 'bg-zinc-400' },
}

// ---------------------------------------------------------------------------
// Server-side data access
// ---------------------------------------------------------------------------

export async function getChangelog(): Promise<ChangelogEntry[]> {
  const supabase = getSupabaseServiceRoleClient()

  const { data, error } = await supabase
    .from('changelog_entries')
    .select('version, date, title, summary, changes')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to load changelog from database', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    version: row.version,
    date: row.date,
    title: row.title,
    summary: row.summary,
    changes: row.changes as ChangelogEntry['changes'],
  }))
}

async function fetchLatestRelease(): Promise<{ version: string; title: string } | null> {
  const supabase = getSupabaseServiceRoleClient()

  const { data } = await supabase
    .from('changelog_entries')
    .select('version, title')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

export const getLatestRelease = unstable_cache(
  fetchLatestRelease,
  ['latest-release'],
  { revalidate: 86_400 },
)
