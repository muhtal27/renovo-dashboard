import { EmptyState, SectionCard } from '@/app/operator-ui'
import { requireOperatorTenant } from '@/lib/operator-server'

export default async function CallsPage() {
  await requireOperatorTenant('/calls')

  return (
    <SectionCard className="px-6 py-10 md:px-8">
      <EmptyState
        title="Inbox workflows are being finalised"
        body="This area will consolidate operator communication, reminders, and checkout follow-up without breaking the current audit trail."
      />
    </SectionCard>
  )
}
