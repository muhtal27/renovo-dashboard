import { createClient } from '@supabase/supabase-js'

let browserClient: ReturnType<typeof createClient> | null = null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function requireBrowserEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing ${name}.`)
  }

  return value
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  browserClient = createClient(
    requireBrowserEnv(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL'),
    requireBrowserEnv(supabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  return browserClient
}
