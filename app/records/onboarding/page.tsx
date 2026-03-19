'use client'

import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOperatorProfile, getSessionUser, type CurrentOperator } from '@/lib/operator'
import { supabase } from '@/lib/supabase'
import { OperatorNav } from '@/app/operator-nav'

type OperatorRole = 'admin' | 'manager' | 'operator' | 'viewer'
type PortalRole = 'tenant' | 'landlord' | 'contractor'

type OperatorProfileRow = {
  id: string
  auth_user_id: string | null
  full_name: string | null
  email: string | null
  role: string | null
  is_active: boolean | null
  updated_at: string | null
}

type PortalProfileRow = {
  id: string
  auth_user_id: string | null
  contact_id: string
  contractor_id: string | null
  portal_role: PortalRole
  display_name: string | null
  is_active: boolean | null
  updated_at: string | null
}

type ContactRow = {
  id: string
  full_name: string | null
  company_name: string | null
  email: string | null
  phone: string | null
}

type ContractorRow = {
  id: string
  contact_id: string
  company_name: string | null
  primary_trade: string | null
}

function formatRelativeTime(value: string | null) {
  if (!value) return 'No recent update'

  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  return `${Math.floor(diffHours / 24)}d ago`
}

function getContactLabel(contact: ContactRow | null) {
  if (!contact) return 'Unknown contact'

  return (
    contact.full_name?.trim() ||
    contact.company_name?.trim() ||
    contact.email?.trim() ||
    contact.phone?.trim() ||
    'Unknown contact'
  )
}

export default function OnboardingPage() {
  const router = useRouter()

  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [operatorProfiles, setOperatorProfiles] = useState<OperatorProfileRow[]>([])
  const [portalProfiles, setPortalProfiles] = useState<PortalProfileRow[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [contractors, setContractors] = useState<ContractorRow[]>([])

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [grantOperatorAccess, setGrantOperatorAccess] = useState(true)
  const [workspaceRole, setWorkspaceRole] = useState<OperatorRole>('operator')
  const [grantPortalAccess, setGrantPortalAccess] = useState(false)
  const [portalRole, setPortalRole] = useState<PortalRole>('tenant')
  const [contactId, setContactId] = useState('')
  const [contractorId, setContractorId] = useState('')
  const [isActive, setIsActive] = useState(true)

  const hydrateOperatorProfile = useEffectEvent(async (userId: string) => {
    try {
      const profile = await getOperatorProfile(userId)

      setOperator((current) => {
        if (!current?.authUser || current.authUser.id !== userId) return current
        return {
          ...current,
          profile,
        }
      })

      if (!profile) {
        setError('Your account is not linked to the operator workspace.')
      } else if (profile.is_active === false) {
        setError('Your operator profile is inactive. Please contact an administrator.')
      }
    } catch (profileError) {
      setError(
        profileError instanceof Error ? profileError.message : 'Unable to load operator profile.'
      )
    }
  })

  async function loadPage() {
    setLoading(true)
    setError(null)

    const [operatorProfilesResponse, portalProfilesResponse, contactsResponse, contractorsResponse] =
      await Promise.all([
        supabase
          .from('users_profiles')
          .select('id, auth_user_id, full_name, email, role, is_active, updated_at')
          .order('updated_at', { ascending: false }),
        supabase
          .from('portal_profiles')
          .select('id, auth_user_id, contact_id, contractor_id, portal_role, display_name, is_active, updated_at')
          .order('updated_at', { ascending: false }),
        supabase
          .from('contacts')
          .select('id, full_name, company_name, email, phone')
          .order('updated_at', { ascending: false })
          .limit(250),
        supabase
          .from('contractors')
          .select('id, contact_id, company_name, primary_trade')
          .order('updated_at', { ascending: false }),
      ])

    const firstError = [
      operatorProfilesResponse.error,
      portalProfilesResponse.error,
      contactsResponse.error,
      contractorsResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    setOperatorProfiles((operatorProfilesResponse.data || []) as OperatorProfileRow[])
    setPortalProfiles((portalProfilesResponse.data || []) as PortalProfileRow[])
    setContacts((contactsResponse.data || []) as ContactRow[])
    setContractors((contractorsResponse.data || []) as ContractorRow[])
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false

    async function bootstrapAuth() {
      try {
        const user = await getSessionUser()

        if (cancelled) return

        if (!user) {
          router.replace('/login')
          setAuthLoading(false)
          return
        }

        setOperator({
          authUser: user,
          profile: null,
        })
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : 'Unable to load operator session.')
          setAuthLoading(false)
        }
      }
    }

    void bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    if (!operator?.authUser?.id) return
    void loadPage()
  }, [operator?.authUser?.id])

  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts]
  )

  const eligibleContractors = useMemo(() => {
    if (portalRole !== 'contractor') return contractors

    return contractors.filter((contractor) => !contactId || contractor.contact_id === contactId)
  }, [contactId, contractors, portalRole])

  const counts = useMemo(
    () => ({
      operators: operatorProfiles.length,
      activeOperators: operatorProfiles.filter((profile) => profile.is_active !== false).length,
      portals: portalProfiles.length,
      activePortals: portalProfiles.filter((profile) => profile.is_active !== false).length,
    }),
    [operatorProfiles, portalProfiles]
  )

  async function handleSubmit() {
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('Your session expired. Sign in again and retry.')
      }

      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'sync_access',
          email,
          fullName,
          displayName,
          isActive,
          grantOperatorAccess,
          workspaceRole,
          grantPortalAccess,
          portalRole,
          contactId,
          contractorId,
        }),
      })

      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to save onboarding access.')
      }

      setMessage(payload.message || 'Access updated successfully.')
      await loadPage()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save access.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Loading operator session...
          </div>
        </div>
      </main>
    )
  }

  if (!operator?.authUser) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Redirecting to sign in...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <OperatorNav current="onboarding" />

        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div>
              <p className="app-kicker">New business</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Invite people in and control access without touching Supabase by hand
              </h1>
              <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">
                Assign dashboard roles, link portal users to the right contact record, and control
                access from one place after the auth user exists in Supabase.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Operators', value: counts.operators, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
                  { label: 'Portal users', value: counts.portals, tone: 'border-sky-200 bg-sky-50 text-sky-900' },
                  { label: 'Active operators', value: counts.activeOperators, tone: 'border-stone-200 bg-white text-stone-900' },
                  { label: 'Active portals', value: counts.activePortals, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
                ].map((card) => (
                  <article key={card.label} className={`rounded-[1.6rem] border p-4 shadow-sm ${card.tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      {card.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="app-surface rounded-[1.8rem] p-5">
              <p className="app-kicker">How this works</p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-stone-600">
                <p>Invite an operator when the person needs dashboard access.</p>
                <p>Invite a portal user when the person should land in tenant, landlord, or contractor access.</p>
                <p>Use role and active status to control who can work where.</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface rounded-[2rem] p-5 md:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.9fr)]">
            <section className="rounded-[1.6rem] border border-stone-200 bg-white/90 p-5">
              <p className="app-kicker">Access form</p>
              <h2 className="mt-2 text-2xl font-semibold">One form for all roles</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">Auth email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="app-field text-sm outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">Status</span>
                  <select
                    value={isActive ? 'active' : 'inactive'}
                    onChange={(event) => setIsActive(event.target.value === 'active')}
                    className="app-select text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={grantOperatorAccess}
                    onChange={(event) => setGrantOperatorAccess(event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-stone-900">Dashboard access</span>
                </label>

                {grantOperatorAccess && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Full name</span>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="Jane Smith"
                        className="app-field text-sm outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Operator role</span>
                      <select
                        value={workspaceRole}
                        onChange={(event) => setWorkspaceRole(event.target.value as OperatorRole)}
                        className="app-select text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="operator">Operator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={grantPortalAccess}
                    onChange={(event) => setGrantPortalAccess(event.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium text-stone-900">Portal access</span>
                </label>

                {grantPortalAccess && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Display name</span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Jane Smith"
                        className="app-field text-sm outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Portal role</span>
                      <select
                        value={portalRole}
                        onChange={(event) => {
                          const nextRole = event.target.value as PortalRole
                          setPortalRole(nextRole)
                          if (nextRole !== 'contractor') {
                            setContractorId('')
                          }
                        }}
                        className="app-select text-sm"
                      >
                        <option value="tenant">Tenant</option>
                        <option value="landlord">Landlord</option>
                        <option value="contractor">Contractor</option>
                      </select>
                    </label>

                    <label className="block md:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-stone-700">Linked contact</span>
                      <select
                        value={contactId}
                        onChange={(event) => setContactId(event.target.value)}
                        className="app-select text-sm"
                      >
                        <option value="">Select contact</option>
                        {contacts.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {getContactLabel(contact)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {portalRole === 'contractor' && (
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-sm font-medium text-stone-700">Linked contractor</span>
                        <select
                          value={contractorId}
                          onChange={(event) => setContractorId(event.target.value)}
                          className="app-select text-sm"
                        >
                          <option value="">Select contractor</option>
                          {eligibleContractors.map((contractor) => (
                            <option key={contractor.id} value={contractor.id}>
                              {(contractor.company_name || contractor.primary_trade || contractor.id).trim()}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="app-primary-button rounded-2xl px-5 py-3 text-sm font-medium disabled:opacity-60"
                >
                  {saving ? 'Saving access...' : 'Save access'}
                </button>
                <p className="text-sm text-stone-600">
                  One joined-up form replaces separate add-role sections.
                </p>
              </div>

              {message && (
                <div className="mt-4 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Error: {error}
                </div>
              )}
            </section>

            <section className="rounded-[1.6rem] border border-stone-200 bg-stone-50/80 p-5">
              <p className="app-kicker">Live access</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.3rem] border border-stone-200 bg-white/90 p-4">
                  <p className="text-sm font-semibold text-stone-900">Active operators</p>
                  <div className="mt-3 space-y-3">
                    {loading && <p className="text-sm text-stone-600">Loading operator access...</p>}
                    {!loading && operatorProfiles.length === 0 && (
                      <p className="text-sm text-stone-600">No operator profiles found yet.</p>
                    )}
                    {operatorProfiles.slice(0, 4).map((profile) => (
                      <div key={profile.id} className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {profile.full_name || profile.email || 'Unknown operator'}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">{profile.role || 'operator'}</p>
                          </div>
                          <span className="text-xs text-stone-500">{formatRelativeTime(profile.updated_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.3rem] border border-stone-200 bg-white/90 p-4">
                  <p className="text-sm font-semibold text-stone-900">Active portals</p>
                  <div className="mt-3 space-y-3">
                    {loading && <p className="text-sm text-stone-600">Loading portal access...</p>}
                    {!loading && portalProfiles.length === 0 && (
                      <p className="text-sm text-stone-600">No portal profiles found yet.</p>
                    )}
                    {portalProfiles.slice(0, 4).map((profile) => (
                      <div key={profile.id} className="rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {profile.display_name || getContactLabel(contactById.get(profile.contact_id) ?? null)}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">{profile.portal_role}</p>
                          </div>
                          <span className="text-xs text-stone-500">{formatRelativeTime(profile.updated_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}
