import { createClient } from '@supabase/supabase-js'
import { createBrowserSupabaseStorage, getSupabaseStorageKey } from '@/lib/supabase-session'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Set them in your local env or Vercel project settings before loading the app.'
  )
}

const storageKey = getSupabaseStorageKey(supabaseUrl)

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storageKey,
      storage: createBrowserSupabaseStorage(storageKey),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
