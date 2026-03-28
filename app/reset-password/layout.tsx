import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Reset Password | Renovo AI',
  description: 'Reset the password for your Renovo AI workspace account.',
  path: '/reset-password',
  noIndex: true,
})

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
