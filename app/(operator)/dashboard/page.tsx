import { redirect } from 'next/navigation'

/**
 * Dashboard root now redirects to /tenancies which is the
 * primary tenancy list view in the operator workspace.
 */
export default function DashboardPage() {
  redirect('/tenancies')
}
