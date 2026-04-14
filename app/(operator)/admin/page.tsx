import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'
import { CaseAllocationPanel } from './case-allocation-panel'

export const metadata: Metadata = {
  title: 'Admin | Renovo AI',
}

export default async function AdminPage() {
  await requireOperatorTenant('/admin')

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Page heading */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Admin</h2>
        <p className="mt-1 text-sm text-zinc-500">Case allocation and workspace management</p>
      </div>

      {/* Full admin panel with stat cards + allocation table */}
      <CaseAllocationPanel />
    </div>
  )
}
