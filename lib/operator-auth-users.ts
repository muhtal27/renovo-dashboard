import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Batch-resolve Supabase auth users by ID using per-user admin lookups.
 *
 * Uses getUserById() in parallel (capped at 20 concurrent) instead of
 * fetching the entire user list. Scales to any workspace size.
 */
export async function resolveAuthUsersByIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, User>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const unique = [...new Set(userIds)]
  const userMap = new Map<string, User>()

  // Process in batches of 20 to avoid overwhelming the auth API
  const BATCH_SIZE = 20
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map((id) => supabase.auth.admin.getUserById(id))
    )
    for (const result of results) {
      if (result.data?.user) {
        userMap.set(result.data.user.id, result.data.user)
      }
    }
  }

  return userMap
}

/**
 * Look up exactly one auth user by email address.
 *
 * Paginates through the admin user list in small pages until a match is
 * found. Only used on cold paths (e.g. member invite), not on GET listings.
 */
export async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<User | null> {
  const normalised = email.toLowerCase()
  let page = 1
  const perPage = 50

  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage })
    const users = data?.users ?? []

    const match = users.find((u) => u.email?.toLowerCase() === normalised)
    if (match) return match
    if (users.length < perPage) break
    page++
  }

  return null
}
