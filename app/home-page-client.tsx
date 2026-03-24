'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublicHome } from '@/app/public-home'
import { useOperatorGate } from '@/lib/use-operator-gate'

export default function HomePage() {
  const router = useRouter()
  const { operator, authLoading } = useOperatorGate({
    unauthenticatedMode: 'allow-null',
  })

  useEffect(() => {
    if (!authLoading && operator?.authUser) {
      router.replace('/eot')
    }
  }, [authLoading, operator, router])

  if (authLoading) {
    return <PublicHome />
  }

  if (operator?.authUser) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Redirecting to your workspace...
          </div>
        </div>
      </main>
    )
  }

  return <PublicHome />
}
