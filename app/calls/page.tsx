import { OperatorLayout } from '@/app/operator-layout'
import { requireOperatorTenant } from '@/lib/operator-server'

export default async function CallsPage() {
  await requireOperatorTenant('/calls')

  return (
    <OperatorLayout
      pageTitle="Inbox"
      pageDescription="Central queue for case notes, outbound communication, and operator follow-up."
      breadcrumbs={[{ label: 'Overview', href: '/overview' }, { label: 'Inbox' }]}
    >
      <section className="rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white px-6 py-10 text-sm text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:px-8">
        Inbox workflows are next in line. This area will consolidate operator communication, reminders, and case follow-up.
      </section>
    </OperatorLayout>
  )
}
