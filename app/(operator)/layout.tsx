import type { ReactNode } from 'react'
import { OperatorLayout } from '@/app/operator-layout'
import { getCurrentOperatorForLayout } from '@/lib/operator-server'
import { AppQueryClientProvider } from '@/lib/query-client'

export default async function OperatorRouteLayout({
  children,
}: {
  children: ReactNode
}) {
  const operator = await getCurrentOperatorForLayout()

  if (!operator) {
    return <>{children}</>
  }

  return (
    <AppQueryClientProvider>
      <OperatorLayout operator={operator}>{children}</OperatorLayout>
    </AppQueryClientProvider>
  )
}
