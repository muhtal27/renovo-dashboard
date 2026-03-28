import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Workspace Access | Renovo AI',
  description: 'Resolve workspace access for your Renovo AI operator account.',
  path: '/workspace-access',
  noIndex: true,
})

export default function WorkspaceAccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
