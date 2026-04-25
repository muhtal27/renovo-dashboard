import type { ReactNode } from 'react'
import { requireInternalUser } from '@/lib/internal-auth'
import { InternalShell } from './internal-shell'

export const metadata = {
  title: 'Renovo · Internal',
}

export default async function InternalRouteLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await requireInternalUser()
  return <InternalShell email={user.email ?? ''}>{children}</InternalShell>
}
