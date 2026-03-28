import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Login | Renovo AI',
  description: 'Sign in to your Renovo AI workspace.',
  path: '/login',
  noIndex: true,
})

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
