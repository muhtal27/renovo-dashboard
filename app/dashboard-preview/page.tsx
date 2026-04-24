import type { Metadata } from 'next'
import { DashboardPreviewClient } from './preview-client'

// Unauthenticated design preview of the operator dashboard. Renders
// DashboardOverviewClient with fixture data so the redesign can be diffed
// against private-content/demo.html without SSO or a real tenant.
//
// No PII: fixture data only. Do not add real tenant reads here.

export const metadata: Metadata = {
  title: 'Dashboard preview | Renovo AI',
  robots: { index: false, follow: false },
}

export default function DashboardPreviewPage() {
  return <DashboardPreviewClient />
}
