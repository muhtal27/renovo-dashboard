import { redirect } from 'next/navigation'

/**
 * Legacy /tenancies route — redirects to /dashboard which is the
 * primary tenancy list view in the operator workspace.
 */
export default function LegacyTenanciesPage() {
  redirect('/dashboard')
}
