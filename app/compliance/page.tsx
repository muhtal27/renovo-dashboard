import ComplianceClient from "@/app/compliance/compliance-client"
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Compliance | Renovo AI',
  description:
    'Overview of Renovo AI compliance, privacy, hosting, access control, audit trail, and information handling practices.',
  path: '/compliance',
})

export default function CompliancePage() {
  return <ComplianceClient />
}
