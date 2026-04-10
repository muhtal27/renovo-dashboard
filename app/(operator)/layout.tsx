import type { ReactNode } from 'react'
import { OperatorLayout } from '@/app/operator-layout'
import { getCurrentOperatorForLayout } from '@/lib/operator-server'
import { getLatestRelease } from '@/lib/changelog'
import { AppQueryClientProvider } from '@/lib/query-client'

export default async function OperatorRouteLayout({
  children,
}: {
  children: ReactNode
}) {
  const [operator, latestRelease] = await Promise.all([
    getCurrentOperatorForLayout(),
    getLatestRelease(),
  ])

  if (!operator) {
    return <>{children}</>
  }

  return (
    <AppQueryClientProvider>
      <OperatorLayout operator={operator} latestRelease={latestRelease}>{children}</OperatorLayout>
    </AppQueryClientProvider>
  )
}
