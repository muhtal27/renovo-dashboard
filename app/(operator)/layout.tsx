import type { ReactNode } from 'react'
import { OperatorLayout } from '@/app/operator-layout'
import { getCurrentOperatorForLayout } from '@/lib/operator-server'

export default async function OperatorRouteLayout({
  children,
}: {
  children: ReactNode
}) {
  const operator = await getCurrentOperatorForLayout()

  if (!operator) {
    return <>{children}</>
  }

  return <OperatorLayout operator={operator}>{children}</OperatorLayout>
}
