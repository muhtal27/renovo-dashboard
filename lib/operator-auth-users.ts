import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Batch-resolve Supabase auth users by ID.
 *
 * Instead of calling getUserById() N times (one per user), this fetches
 * the full user list once and filters in-memory. For workspaces with
 * fewer than ~1 000 members this is dramatically faster because it
 * replaces N network round-trips with a single one.
 */
export async function resolveAuthUsersByIds(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, User>> {
  if (userIds.length === 0) {
    return new Map()
  }

  // Single request: fetch up to 1 000 users from Supabase auth admin API
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const allUsers = data?.users ?? []

  const idSet = new Set(userIds)
  const userMap = new Map<string, User>()

  for (const user of allUsers) {
    if (idSet.has(user.id)) {
      userMap.set(user.id, user)
    }
  }

  return userMap
}
