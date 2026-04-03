import { redirect } from 'next/navigation'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Integrations | Renovo AI',
  description: 'Renovo AI integrations for end of tenancy workflows.',
  path: '/integrations',
  noIndex: true,
})

export default function IntegrationsPage() {
  redirect('/contact')
}
