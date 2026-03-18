'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSessionUser } from '@/lib/operator'
import { resolveWorkspaceForUser } from '@/lib/portal'

export default function PortalIndexPage() {
  const router = useRouter()

  useEffect(() => {
    async function routeToWorkspace() {
      const user = await getSessionUser()

      if (!user) {
        router.replace('/login')
        return
      }

      const workspace = await resolveWorkspaceForUser(user.id)
      router.replace(workspace.destination || '/login')
    }

    void routeToWorkspace()
  }, [router])

  return (
    <main className="app-grid min-h-screen px-6 py-8 text-stone-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
          Opening the right portal...
        </div>
      </div>
    </main>
  )
}
