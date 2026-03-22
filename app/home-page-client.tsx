'use client'

import dynamic from 'next/dynamic'
import HomepageDemo from '@/app/components/HomepageDemo'
import { OperatorSessionState } from '@/app/operator-session-state'
import { PublicHome } from '@/app/public-home'
import { useOperatorGate } from '@/lib/use-operator-gate'

const OperatorDashboard = dynamic(() => import('@/app/operator-dashboard'), {
  loading: () => (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
          Loading your workspace...
        </div>
      </div>
    </main>
  ),
})

export default function HomePage() {
  const { operator, authLoading } = useOperatorGate({
    unauthenticatedMode: 'allow-null',
  })

  if (authLoading && !operator?.authUser) {
    return <PublicHome productDemo={<HomepageDemo />} />
  }

  if (authLoading) {
    return operator?.authUser ? (
      <OperatorSessionState authLoading={authLoading} />
    ) : (
      <PublicHome productDemo={<HomepageDemo />} />
    )
  }

  if (!operator?.authUser) {
    return <PublicHome productDemo={<HomepageDemo />} />
  }

  return <OperatorDashboard operator={operator} />
}
