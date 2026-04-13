'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/ui'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'

const TABS = ['Account', 'Team', 'Integrations', 'Email Ingestion', 'Automation', 'API Partners'] as const
type Tab = (typeof TABS)[number]

function AccountTab() {
  return (
    <div className="space-y-6">
      {/* Basic information */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">Basic information</h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          Your personal details used across the workspace.
        </p>

        <div className="mt-5 max-w-md space-y-4">
          <div>
            <label htmlFor="first-name" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              First name
            </label>
            <input
              id="first-name"
              type="text"
              placeholder="First name"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>
          <div>
            <label htmlFor="last-name" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Last name
            </label>
            <input
              id="last-name"
              type="text"
              placeholder="Last name"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.co.uk"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-600 placeholder:text-zinc-400"
              disabled
            />
            <p className="mt-1 text-xs text-zinc-400">
              Email is managed by your identity provider and cannot be changed here.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-zinc-900">Receive email notifications</p>
              <p className="text-xs text-zinc-500">Get notified about case updates and team activity.</p>
            </div>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              role="switch"
              aria-checked="true"
            >
              <span className="pointer-events-none inline-block h-5 w-5 translate-x-5 rounded-full bg-white shadow ring-0 transition-transform" />
            </button>
          </div>

          <button
            type="button"
            className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
          >
            Update profile
          </button>
        </div>
      </section>

      {/* Change password */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">Change password</h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          Update your workspace password. You'll need to confirm your current password first.
        </p>

        <div className="mt-5 max-w-md space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              placeholder="Enter current password"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>

          <button
            type="button"
            className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
          >
            Update password
          </button>
        </div>
      </section>

      {/* Two-factor authentication */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Two-factor authentication</h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Add an extra layer of security to your account.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
            Not enabled
          </span>
        </div>

        <div className="mt-5 rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500">
          Two-factor authentication is not yet configured for this account.
        </div>
      </section>
    </div>
  )
}

const TEAM_SUB_TABS = ['Active Users', 'Invited Users', 'Archived Users'] as const
type TeamSubTab = (typeof TEAM_SUB_TABS)[number]

const teamData: Record<TeamSubTab, Array<{ name: string; email: string; role: string; status: string; joined: string }>> = {
  'Active Users': [
    { name: 'Operator account', email: 'operator@company.co.uk', role: 'Admin', status: 'Owner', joined: '--' },
  ],
  'Invited Users': [],
  'Archived Users': [],
}

function TeamTab() {
  const [activeSubTab, setActiveSubTab] = useState<TeamSubTab>('Active Users')
  const members = teamData[activeSubTab]

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Your team</h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Manage workspace members, roles, and permissions.
            </p>
          </div>
          <button
            type="button"
            className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
          >
            Invite user
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search for users"
            className="h-10 w-[200px] rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        <div className="mt-5 flex gap-0 overflow-x-auto border-b border-zinc-200">
          {TEAM_SUB_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              className={cn(
                'whitespace-nowrap px-[18px] py-2.5 text-[13px] font-medium transition border-b-2',
                activeSubTab === tab
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          {members.length > 0 ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Date Joined</th>
                  <th className="pb-3 pr-4">Permission Level</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.email} className="border-b border-zinc-50">
                    <td className="py-3 pr-4 font-medium text-zinc-900">{member.name}</td>
                    <td className="py-3 pr-4 text-zinc-600">{member.email}</td>
                    <td className="py-3 pr-4 text-zinc-600">{member.joined}</td>
                    <td className="py-3 pr-4 text-zinc-600">{member.role}</td>
                    <td className="py-3">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-6 text-center text-[13px] text-zinc-500">
              No {activeSubTab.toLowerCase()} to display.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

type Integration = {
  name: string
  description: string
  features: string[]
}

const INTEGRATION_LIST: Integration[] = [
  {
    name: 'Street.co.uk',
    description: 'Sync properties, tenancies, landlords, and maintenance data from Street.',
    features: [
      'Pull properties and addresses',
      'Sync tenancy records and rent details',
      'Import landlord contact details',
      'Pull maintenance job history',
    ],
  },
  {
    name: 'SME Professional',
    description: 'Pull properties and push report URLs to SME Professional.',
    features: ['Pull properties from SME', 'Push report URLs to SME'],
  },
  {
    name: 'Reapit',
    description: 'Sync property and tenancy data with Reapit Foundations via the Reapit Marketplace.',
    features: [
      'Pull properties and addresses from Reapit',
      'Sync tenancy records with tenant and landlord contacts',
      'Receive real-time updates via webhooks',
      'Push case status notes as journal entries',
      'Attach generated documents to properties',
    ],
  },
  {
    name: 'FixFlo',
    description: 'Connect maintenance and end-of-tenancy workflows with FixFlo.',
    features: ['Pull maintenance reports', 'Push checkout outcomes'],
  },
  {
    name: 'HelloReport',
    description: 'Import inventory reports and property condition data from HelloReport.',
    features: ['Import inventory reports', 'Sync property conditions', 'Pull check-in/check-out data'],
  },
  {
    name: 'No Letting Go',
    description: 'Connect inventory inspection data from No Letting Go.',
    features: ['Import inspection reports', 'Sync property inventory', 'Pull mid-term inspection data'],
  },
  {
    name: 'Inventory Base',
    description: 'Sync property inventory and condition reports from Inventory Base.',
    features: ['Import inventory reports', 'Sync check-in/check-out reports', 'Pull schedule of condition'],
  },
  {
    name: 'Inventory Hive',
    description: 'Connect property reports and inspection data from Inventory Hive.',
    features: ['Import property reports', 'Sync inspection data', 'Pull compliance documents'],
  },
  {
    name: 'TDS',
    description: 'Submit deposit claims and track disputes with the Tenancy Deposit Scheme.',
    features: [
      'Submit deposit claims directly',
      'Upload evidence bundles',
      'Track dispute status in real time',
      'Auto-update case on scheme decision',
    ],
  },
  {
    name: 'DPS',
    description: 'Submit deposit claims and track disputes with the Deposit Protection Service.',
    features: [
      'Submit deposit claims directly',
      'Upload evidence bundles',
      'Track dispute status in real time',
      'Auto-update case on scheme decision',
    ],
  },
  {
    name: 'mydeposits',
    description: 'Submit deposit claims and track disputes with mydeposits.',
    features: [
      'Submit deposit claims directly',
      'Upload evidence bundles',
      'Track dispute status in real time',
      'Auto-update case on scheme decision',
    ],
  },
  {
    name: 'SafeDeposits Scotland',
    description: 'Submit deposit claims and track disputes with SafeDeposits Scotland.',
    features: [
      'Submit deposit claims directly',
      'Upload evidence bundles',
      'Track dispute status in real time',
      'Auto-update case on scheme decision',
    ],
  },
  {
    name: 'LPS',
    description: 'Submit deposit claims and track disputes with the Letting Protection Service Scotland.',
    features: [
      'Submit deposit claims directly',
      'Upload evidence bundles',
      'Track dispute status in real time',
      'Auto-update case on scheme decision',
    ],
  },
]

// ---------------------------------------------------------------------------
// Unmatched Email Queue
// ---------------------------------------------------------------------------

type UnmatchedItem = {
  id: string
  email_log_id: string
  from_address: string
  subject: string | null
  attachment_urls: string[]
  suggested_tenancy_ids: string[]
  created_at: string
  email_log?: {
    attachment_count: number
  } | null
}

type TenancyOption = {
  id: string
  label: string
}

function UnmatchedEmailQueue({
  count,
  onResolved,
}: {
  count: number
  onResolved: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<UnmatchedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadItems() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/operator/inbound-email/unmatched')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      setError('Failed to load unmatched emails.')
    } finally {
      setLoading(false)
    }
  }

  function handleExpand() {
    if (!expanded) {
      void loadItems()
    }
    setExpanded(!expanded)
  }

  return (
    <section className="border border-amber-200 bg-amber-50 px-6 py-4 md:px-7">
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div>
          <p className="text-[13px] font-semibold text-amber-800">
            {count} unmatched {count === 1 ? 'email' : 'emails'} pending review
          </p>
          <p className="mt-0.5 text-xs text-amber-600">
            These emails could not be automatically matched to a property. Click to review.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-amber-700">
          {expanded ? 'Collapse' : 'Review'}
        </span>
      </button>

      {expanded ? (
        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="py-4 text-center text-xs text-amber-600">Loading...</p>
          ) : error ? (
            <p className="py-4 text-center text-xs text-rose-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-xs text-amber-600">
              No unmatched emails in the queue.
            </p>
          ) : (
            items.map((item) => (
              <UnmatchedEmailCard
                key={item.id}
                item={item}
                onResolved={onResolved}
              />
            ))
          )}
        </div>
      ) : null}
    </section>
  )
}

function UnmatchedEmailCard({
  item,
  onResolved,
}: {
  item: UnmatchedItem
  onResolved: () => void
}) {
  const [tenancySearch, setTenancySearch] = useState('')
  const [tenancyOptions, setTenancyOptions] = useState<TenancyOption[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedTenancy, setSelectedTenancy] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load tenancy options on mount (suggested + searchable)
  useEffect(() => {
    void loadTenancies()
  }, [])

  async function loadTenancies() {
    setSearchLoading(true)
    try {
      const res = await fetch('/api/eot/tenancies')
      if (!res.ok) throw new Error('Failed to load')
      const data = (await res.json()) as { items: Array<{
        id: string
        tenant_name: string
        property: { name: string; address_line_1?: string; postcode?: string }
      }> }
      const tenancies = data.items
      setTenancyOptions(
        tenancies.map((t) => ({
          id: t.id,
          label: `${t.property.address_line_1 || t.property.name}${t.property.postcode ? `, ${t.property.postcode}` : ''} — ${t.tenant_name}`,
        }))
      )
    } catch {
      // Silently fail — operator can still type
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleResolve() {
    if (!selectedTenancy) return
    setResolving(true)
    setError(null)
    try {
      const res = await fetch('/api/operator/inbound-email/unmatched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue_item_id: item.id,
          tenancy_id: selectedTenancy,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to resolve')
      }
      setResolved(true)
      onResolved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve.')
    } finally {
      setResolving(false)
    }
  }

  const filteredOptions = tenancySearch.trim()
    ? tenancyOptions.filter((o) =>
        o.label.toLowerCase().includes(tenancySearch.toLowerCase())
      )
    : tenancyOptions

  const attachmentCount = item.email_log?.attachment_count ?? item.attachment_urls?.length ?? 0

  if (resolved) {
    return (
      <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-medium text-emerald-700">
          Resolved — email attached to tenancy.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-amber-200 bg-white px-4 py-4">
      {/* Email details */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-zinc-900">
            {item.subject || '(no subject)'}
          </p>
          <p className="text-xs text-zinc-500">
            From: <span className="font-medium text-zinc-700">{item.from_address}</span>
          </p>
          <p className="text-xs text-zinc-400">
            {attachmentCount} attachment{attachmentCount !== 1 ? 's' : ''} ·{' '}
            {new Date(item.created_at).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Tenancy selector */}
      <div className="mt-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Assign to tenancy
        </label>
        <input
          type="text"
          placeholder="Search by property address or tenant name..."
          value={tenancySearch}
          onChange={(e) => {
            setTenancySearch(e.target.value)
            setSelectedTenancy(null)
          }}
          className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />

        {/* Results */}
        {searchLoading ? (
          <p className="mt-2 text-xs text-zinc-400">Loading tenancies...</p>
        ) : filteredOptions.length > 0 && !selectedTenancy ? (
          <div className="mt-1 max-h-40 overflow-y-auto rounded-[10px] border border-zinc-200 bg-white">
            {filteredOptions.slice(0, 8).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedTenancy(option.id)
                  setTenancySearch(option.label)
                }}
                className="w-full px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-50"
              >
                {option.label}
              </button>
            ))}
            {filteredOptions.length > 8 ? (
              <p className="px-3 py-1.5 text-xs text-zinc-400">
                {filteredOptions.length - 8} more — refine your search
              </p>
            ) : null}
          </div>
        ) : tenancySearch.trim() && !selectedTenancy && filteredOptions.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-400">No tenancies match this search.</p>
        ) : null}

        {selectedTenancy ? (
          <p className="mt-1.5 text-xs text-emerald-600">
            Selected — ready to attach.
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-xs text-rose-600">{error}</p>
        ) : null}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleResolve}
          disabled={!selectedTenancy || resolving}
          className="rounded-[10px] bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {resolving ? 'Attaching...' : 'Attach to tenancy'}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Email Ingestion Tab
// ---------------------------------------------------------------------------

type InboundConfig = {
  id: string
  address_prefix: string
  is_active: boolean
  allowed_sender_domains: string[]
}

type InboundLogEntry = {
  id: string
  from_address: string
  to_address: string
  subject: string | null
  status: 'matched' | 'unmatched' | 'failed' | 'duplicate'
  attachment_count: number
  created_at: string
}

function EmailIngestionTab() {
  const [config, setConfig] = useState<InboundConfig | null>(null)
  const [logs, setLogs] = useState<InboundLogEntry[]>([])
  const [unmatchedCount, setUnmatchedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [prefix, setPrefix] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [domains, setDomains] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operator/inbound-email')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setConfig(data.config)
      setLogs(data.recentLogs ?? [])
      setUnmatchedCount(data.unmatchedCount ?? 0)
      if (data.config) {
        setPrefix(data.config.address_prefix)
        setIsActive(data.config.is_active)
        setDomains((data.config.allowed_sender_domains ?? []).join(', '))
      }
    } catch {
      setError('Failed to load email ingestion settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/operator/inbound-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address_prefix: prefix.trim().toLowerCase(),
          is_active: isActive,
          allowed_sender_domains: domains
            .split(',')
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean),
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save')
      }
      const data = await res.json()
      setConfig(data.config)
      setSuccess('Configuration saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration.')
    } finally {
      setSaving(false)
    }
  }

  const statusColors: Record<string, string> = {
    matched: 'bg-emerald-50 text-emerald-700',
    unmatched: 'bg-amber-50 text-amber-700',
    failed: 'bg-rose-50 text-rose-700',
    duplicate: 'bg-zinc-100 text-zinc-500',
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-[13px] text-zinc-400">
        Loading email ingestion settings...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Config section */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Email Ingestion</h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Receive inventory reports and documents via email. Inventory providers
              send reports to your dedicated address and they are automatically
              matched to properties.
            </p>
          </div>
          {config ? (
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                config.is_active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-600'
              )}
            >
              {config.is_active ? 'Active' : 'Inactive'}
            </span>
          ) : (
            <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
              Not configured
            </span>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-5 max-w-lg space-y-4">
          <div>
            <label htmlFor="email-prefix" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Email address prefix
            </label>
            <div className="mt-1 flex items-center gap-0">
              <input
                id="email-prefix"
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="reports"
                className="h-10 w-48 rounded-l-[10px] border border-r-0 border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
              />
              <span className="flex h-10 items-center rounded-r-[10px] border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-600">
                @in.renovoai.co.uk
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Inventory providers will send reports to this address.
            </p>
          </div>

          <div>
            <label htmlFor="allowed-domains" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Allowed sender domains (optional)
            </label>
            <input
              id="allowed-domains"
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="helloreport.co.uk, nolettinggo.co.uk"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Comma-separated. Leave empty to accept from any sender.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-zinc-900">Enable email ingestion</p>
              <p className="text-xs text-zinc-500">
                When disabled, incoming emails will be silently ignored.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                isActive
                  ? 'bg-emerald-500 focus:ring-emerald-500'
                  : 'bg-zinc-200 focus:ring-zinc-400'
              )}
              role="switch"
              aria-checked={isActive}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                  isActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !prefix.trim()}
            className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : config ? 'Update configuration' : 'Enable email ingestion'}
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">How it works</h3>
        <div className="mt-4 space-y-3">
          {[
            {
              step: '1',
              title: 'Inventory provider sends report',
              desc: 'They email the report PDF to your dedicated address.',
            },
            {
              step: '2',
              title: 'Auto-matching',
              desc: 'We match the email to a property using the sender, subject line, postcode, and address.',
            },
            {
              step: '3',
              title: 'Attached to case',
              desc: 'If matched, the report PDF is attached to the open case automatically.',
            },
            {
              step: '4',
              title: 'Manual review',
              desc: 'Unmatched emails appear in your review queue for manual assignment.',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                {item.step}
              </span>
              <div>
                <p className="text-[13px] font-medium text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unmatched queue */}
      {unmatchedCount > 0 ? (
        <UnmatchedEmailQueue
          count={unmatchedCount}
          onResolved={() => void loadData()}
        />
      ) : null}

      {/* Recent activity */}
      {logs.length > 0 ? (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Recent activity</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="pb-2.5 pr-4">From</th>
                  <th className="pb-2.5 pr-4">Subject</th>
                  <th className="pb-2.5 pr-4">Attachments</th>
                  <th className="pb-2.5 pr-4">Status</th>
                  <th className="pb-2.5">Received</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-50 last:border-0">
                    <td className="max-w-[180px] truncate py-2.5 pr-4 text-zinc-700">
                      {log.from_address}
                    </td>
                    <td className="max-w-[200px] truncate py-2.5 pr-4 text-zinc-600">
                      {log.subject || '(no subject)'}
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-zinc-500">
                      {log.attachment_count}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                          statusColors[log.status] ?? 'bg-zinc-100 text-zinc-500'
                        )}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-xs text-zinc-400">
                      {new Date(log.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : config ? (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <p className="text-center text-[13px] text-zinc-400">
            No emails received yet. Send a test email to{' '}
            <span className="font-medium text-zinc-600">
              {config.address_prefix}@in.renovoai.co.uk
            </span>{' '}
            to verify the setup.
          </p>
        </section>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Street.co.uk Integration Panel (live)
// ---------------------------------------------------------------------------

type StreetSyncLog = {
  id: string
  status: string
  resource: string
  records_created: number
  records_updated: number
  records_skipped: number
  error_message: string | null
  started_at: string
  finished_at: string | null
}

type StreetStatus = {
  connected: boolean
  connection: {
    id: string
    base_url: string
    label: string | null
    last_synced_at: string | null
  } | null
  last_sync_logs: StreetSyncLog[]
}

function StreetIntegrationPanel() {
  const [status, setStatus] = useState<StreetStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiToken, setApiToken] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/connections')
      if (!res.ok) throw new Error('Failed to load')
      const connections = (await res.json()) as Array<{
        id: string
        provider: string
        status: string
        health_status: string
        last_synced_at: string | null
        config: Record<string, unknown>
        created_at: string
      }>
      const street = connections.find((c) => c.provider === 'street')

      if (street && street.status !== 'pending') {
        const logsRes = await fetch(`/api/integrations/connections/${street.id}/sync-logs`)
        const logs = logsRes.ok ? await logsRes.json() : []
        setStatus({
          connected: true,
          connection: {
            id: street.id,
            base_url: (street.config?.base_url as string) || '',
            label: (street.config?.label as string) || null,
            last_synced_at: street.last_synced_at,
          },
          last_sync_logs: logs,
        })
        if (street.config?.label) setLabel(street.config.label as string)
      } else {
        setStatus({ connected: false, connection: null, last_sync_logs: [] })
      }
    } catch {
      setError('Failed to load Street.co.uk connection status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadStatus() }, [loadStatus])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      if (!apiToken.trim()) throw new Error('API token is required')
      const res = await fetch('/api/integrations/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'street',
          display_name: label.trim() || 'Street.co.uk',
          credentials: { api_token: apiToken.trim() },
          config: { label: label.trim() || null },
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Failed to connect')
      }
      setApiToken('')
      setSuccess('Street.co.uk connected successfully.')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync() {
    if (!status?.connection) return
    setSyncing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/integrations/connections/${status.connection.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Sync failed')
      }
      setSuccess('Sync triggered.')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!status?.connection) return
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/integrations/connections/${status.connection.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Failed to disconnect')
      }
      setSuccess('Connection removed.')
      setApiToken('')
      setLabel('')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect.')
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-[13px] text-zinc-400">
        Loading Street.co.uk integration...
      </div>
    )
  }

  const connected = status?.connected ?? false

  return (
    <div className="space-y-6">
      {/* Connection config */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Street.co.uk Connection
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Connect your Street.co.uk account to sync properties, tenancies, and more.
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
              connected
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-zinc-100 text-zinc-600'
            )}
          >
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {error ? (
          <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-5 max-w-md space-y-4">
          <div>
            <label htmlFor="street-label" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Label (optional)
            </label>
            <input
              id="street-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main office"
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
          </div>

          <div>
            <label htmlFor="street-api-token" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              API Token
            </label>
            <input
              id="street-api-token"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder={connected ? '••••••••••••••••' : 'Paste your Street.co.uk API token'}
              className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Find this in Street &gt; Settings &gt; Account Administration &gt; Applications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!connected ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !apiToken.trim()}
                className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? 'Connecting...' : 'Connect'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Sync controls */}
      {connected ? (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Data sync</h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                Pull properties and tenancies from Street.co.uk into Renovo.
              </p>
              {status?.connection?.last_synced_at ? (
                <p className="mt-1 text-xs text-zinc-400">
                  Last synced:{' '}
                  {new Date(status.connection.last_synced_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
          </div>

          {/* Sync log history */}
          {status?.last_sync_logs && status.last_sync_logs.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    <th className="pb-2.5 pr-4">Resource</th>
                    <th className="pb-2.5 pr-4">Status</th>
                    <th className="pb-2.5 pr-4">Created</th>
                    <th className="pb-2.5 pr-4">Updated</th>
                    <th className="pb-2.5 pr-4">Skipped</th>
                    <th className="pb-2.5">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {status.last_sync_logs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-50 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-zinc-900 capitalize">
                        {log.resource}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            log.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : log.status === 'failed'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                        {log.records_created}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                        {log.records_updated}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                        {log.records_skipped}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-xs text-zinc-400">
                        {new Date(log.started_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reapit Integration Panel
// ---------------------------------------------------------------------------

type ReapitConnectionStatus = {
  connected: boolean
  connection: {
    id: string
    provider: string
    status: string
    health_status: string
    last_synced_at: string | null
    created_at: string
  } | null
  sync_logs: Array<{
    id: string
    resource: string
    status: string
    records_created: number
    records_updated: number
    records_skipped: number
    started_at: string
    error_message: string | null
  }>
}

function ReapitIntegrationPanel() {
  const [status, setStatus] = useState<ReapitConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [customerId, setCustomerId] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; detail: string } | null>(null)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/connections')
      if (!res.ok) throw new Error('Failed to load')
      const connections = (await res.json()) as Array<{
        id: string
        provider: string
        status: string
        health_status: string
        last_synced_at: string | null
        created_at: string
      }>
      const reapit = connections.find((c) => c.provider === 'reapit')

      if (reapit && reapit.status !== 'pending') {
        const logsRes = await fetch(`/api/integrations/connections/${reapit.id}/sync-logs`)
        const logs = logsRes.ok ? await logsRes.json() : []
        setStatus({ connected: true, connection: reapit, sync_logs: logs })
      } else {
        setStatus({ connected: false, connection: null, sync_logs: [] })
      }
    } catch {
      setError('Failed to load Reapit connection status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadStatus() }, [loadStatus])

  async function handleConnect() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    setTestResult(null)
    try {
      const res = await fetch('/api/reapit/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(body.detail || 'Failed to connect')
      }
      setCustomerId('')
      setSuccess('Reapit connected successfully. Initial sync is running.')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    setError(null)
    try {
      const res = await fetch('/api/reapit/test', { method: 'POST' })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; detail?: string }
      if (!res.ok) {
        throw new Error(data.detail || 'Test failed')
      }
      setTestResult({ ok: data.ok ?? true, detail: data.detail ?? 'Connection successful' })
    } catch (err) {
      setTestResult({ ok: false, detail: err instanceof Error ? err.message : 'Test failed.' })
    } finally {
      setTesting(false)
    }
  }

  async function handleSync() {
    if (!status?.connection) return
    setSyncing(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/integrations/connections/${status.connection.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(body.detail || 'Sync failed')
      }
      const logs = (await res.json()) as Array<{ status: string; records_created: number; records_updated: number; error_message: string | null }>
      const totalCreated = logs.reduce((s, l) => s + l.records_created, 0)
      const totalUpdated = logs.reduce((s, l) => s + l.records_updated, 0)
      const failed = logs.filter((l) => l.status === 'failed')
      if (failed.length > 0) {
        setError(`Sync partially failed: ${failed.map((l) => l.error_message).join('; ')}`)
      } else {
        setSuccess(`Sync complete. ${totalCreated} created, ${totalUpdated} updated.`)
      }
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!status?.connection) return
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/integrations/connections/${status.connection.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(body.detail || 'Disconnect failed')
      }
      setSuccess('Reapit disconnected.')
      await loadStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect.')
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-[13px] text-zinc-400">
        Loading Reapit integration...
      </div>
    )
  }

  const connected = status?.connected ?? false

  return (
    <div className="space-y-6">
      {/* Connection config */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Reapit Foundations
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Connect your Reapit account to sync properties, tenancies, and push case updates back.
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
              connected
                ? status?.connection?.health_status === 'healthy'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
                : 'bg-zinc-100 text-zinc-600'
            )}
          >
            {connected
              ? status?.connection?.health_status === 'healthy'
                ? 'Connected'
                : `Connected (${status?.connection?.health_status})`
              : 'Not connected'}
          </span>
        </div>

        {error ? (
          <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
            {success}
          </div>
        ) : null}

        {testResult ? (
          <div
            className={cn(
              'mt-4 rounded-[10px] border px-4 py-2.5 text-[13px]',
              testResult.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            )}
          >
            {testResult.detail}
          </div>
        ) : null}

        {!connected ? (
          <div className="mt-5 max-w-md space-y-4">
            <div>
              <label htmlFor="reapit-customer-id" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Reapit Customer ID
              </label>
              <input
                id="reapit-customer-id"
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. SBOX (sandbox) or your live customer ID"
                className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
              />
              <p className="mt-1 text-xs text-zinc-400">
                First install Renovo from the Reapit AppMarket. Your Customer ID is shown in the Reapit Developer Portal under Installations.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnect}
              disabled={saving || !customerId.trim()}
              className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test connection'}
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Disconnect
            </button>
          </div>
        )}
      </section>

      {/* Sync controls */}
      {connected && status?.connection ? (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Data sync</h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                Pull properties and tenancies from Reapit into Renovo.
              </p>
              {status.connection.last_synced_at ? (
                <p className="mt-1 text-xs text-zinc-400">
                  Last synced:{' '}
                  {new Date(status.connection.last_synced_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
          </div>

          {/* Sync log history */}
          {status.sync_logs.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    <th className="pb-2.5 pr-4">Resource</th>
                    <th className="pb-2.5 pr-4">Status</th>
                    <th className="pb-2.5 pr-4">Created</th>
                    <th className="pb-2.5 pr-4">Updated</th>
                    <th className="pb-2.5 pr-4">Skipped</th>
                    <th className="pb-2.5">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {status.sync_logs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-50 last:border-0">
                      <td className="py-2.5 pr-4 font-medium text-zinc-900 capitalize">
                        {log.resource}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            log.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : log.status === 'failed'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                        {log.records_created}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                        {log.records_updated}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums text-zinc-600">
                        {log.records_skipped}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-xs text-zinc-400">
                        {new Date(log.started_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const [activeIntegration, setActiveIntegration] = useState('Street.co.uk')
  const selected = INTEGRATION_LIST.find((i) => i.name === activeIntegration) ?? INTEGRATION_LIST[0]
  const isStreet = activeIntegration === 'Street.co.uk'
  const isReapit = activeIntegration === 'Reapit'
  const DEPOSIT_SCHEMES = ['TDS', 'DPS', 'mydeposits', 'SafeDeposits Scotland', 'LPS']
  const isDepositScheme = DEPOSIT_SCHEMES.includes(activeIntegration)

  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">Integrations</h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          Connect your property management tools and inventory software.
        </p>

        <div className="mt-5 flex gap-0 overflow-x-auto border-b border-zinc-200">
          {INTEGRATION_LIST.map((integration) => (
            <button
              key={integration.name}
              type="button"
              onClick={() => setActiveIntegration(integration.name)}
              className={cn(
                'shrink-0 whitespace-nowrap px-[18px] py-2.5 text-[13px] font-medium transition border-b-2',
                activeIntegration === integration.name
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              )}
            >
              {integration.name}
            </button>
          ))}
        </div>
      </section>

      {isStreet ? (
        <StreetIntegrationPanel />
      ) : isReapit ? (
        <ReapitIntegrationPanel />
      ) : isDepositScheme ? (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                {selected.name} Integration
              </h3>
              <p className="mt-1 text-[13px] text-zinc-500">{selected.description}</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Coming soon
            </span>
          </div>

          <div className="mt-5 space-y-2">
            {selected.features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-[13px] text-zinc-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {feature}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[10px] border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-[13px] font-medium text-amber-800">API access pending</p>
            <p className="mt-1 text-[13px] text-amber-700">
              Direct integration with {selected.name} requires API access from the scheme provider.
              Once access is granted, you&apos;ll be able to submit claims, upload evidence, and track
              disputes directly from Renovo.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Feature list for non-Street integrations */}
          <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  {selected.name} Integration
                </h3>
                <p className="mt-1 text-[13px] text-zinc-500">{selected.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                Not configured
              </span>
            </div>

            <div className="mt-5 space-y-2">
              {selected.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-[13px] text-zinc-600">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {feature}
                </div>
              ))}
            </div>

            <div className="mt-6 max-w-md space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  API Key
                </label>
                <input
                  id="api-key"
                  type="text"
                  placeholder="Enter your API key"
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>

              <div>
                <label htmlFor="integration-status" className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Integration status
                </label>
                <select
                  id="integration-status"
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                >
                  <option>Inactive</option>
                  <option>Active</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-zinc-900">Automatically sync properties overnight</p>
                  <p className="text-xs text-zinc-500">Keep property data in sync with your PMS.</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow ring-0 transition-transform" />
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// =====================================================================
// AUTOMATION TAB
// =====================================================================

type AutomationRule = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  trigger_event: string
  conditions: Array<{ type: string; params: Record<string, unknown> }>
  action_type: string
  action_params: Record<string, unknown>
  priority: number
  created_by: string | null
  created_at: string
  updated_at: string
}

type ExecutionLog = {
  id: string
  rule_id: string
  trigger_event: string
  conditions_met: boolean
  action_taken: string | null
  action_result: Record<string, unknown> | null
  executed_at: string
  duration_ms: number | null
}

type RuleTemplate = {
  id: string
  name: string
  description: string
  trigger_event: string
  conditions: Array<{ type: string; params: Record<string, unknown> }>
  action_type: string
  action_params: Record<string, unknown>
}

const TRIGGER_LABELS: Record<string, string> = {
  'tenancy.ending_soon': 'Tenancy ending soon',
  'tenancy.ended': 'Tenancy ended',
  'inspection.received': 'Inspection received',
  'case.status_changed': 'Case status changed',
  'case.document_generated': 'Document generated',
  'connection.sync_completed': 'Sync completed',
  'claim.deadline_approaching': 'Claim deadline approaching',
}

const ACTION_LABELS: Record<string, string> = {
  create_case: 'Create case',
  assign_case: 'Assign case',
  send_notification: 'Send notification',
  change_case_status: 'Change case status',
  start_analysis: 'Start AI analysis',
  log_timeline_event: 'Log timeline event',
}

const CONDITION_LABELS: Record<string, string> = {
  'tenancy.end_date_within_days': 'End date within N days',
  'tenancy.deposit_scheme_is': 'Deposit scheme is',
  'case.status_is': 'Case status is',
  'case.priority_is': 'Case priority is',
  'case.has_no_assignee': 'Case has no assignee',
  'inspection.type_is': 'Inspection type is',
  'property.postcode_starts_with': 'Postcode starts with',
}

const AUTOMATION_SUB_TABS = ['Rules', 'Execution Log'] as const
type AutomationSubTab = (typeof AUTOMATION_SUB_TABS)[number]

function AutomationTab() {
  const [subTab, setSubTab] = useState<AutomationSubTab>('Rules')
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [templates, setTemplates] = useState<RuleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create rule form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTrigger, setFormTrigger] = useState('')
  const [formAction, setFormAction] = useState('')
  const [formConditions, setFormConditions] = useState<
    Array<{ type: string; params: Record<string, string> }>
  >([])
  const [formActionParams, setFormActionParams] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/automation/rules')
      if (!res.ok) throw new Error('Failed to load rules')
      const data = await res.json()
      setRules(data)
    } catch {
      setError('Failed to load automation rules')
    }
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/automation/logs?limit=50')
      if (!res.ok) throw new Error('Failed to load logs')
      const data = await res.json()
      setLogs(data)
    } catch {
      // Silent fail for logs
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations/automation/templates')
      if (!res.ok) throw new Error('Failed to load templates')
      const data = await res.json()
      setTemplates(data)
    } catch {
      // Silent fail for templates
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchRules(), fetchTemplates(), fetchLogs()]).finally(() =>
      setLoading(false)
    )
  }, [fetchRules, fetchTemplates, fetchLogs])

  async function handleToggle(ruleId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/integrations/automation/rules/${ruleId}/toggle`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Failed to toggle rule')
      await fetchRules()
    } catch {
      setError('Failed to toggle rule')
    }
  }

  async function handleDelete(ruleId: string) {
    setError(null)
    try {
      const res = await fetch(`/api/integrations/automation/rules/${ruleId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete rule')
      setSuccess('Rule deleted')
      await fetchRules()
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Failed to delete rule')
    }
  }

  async function handleActivateTemplate(templateId: string) {
    setError(null)
    try {
      const res = await fetch(
        `/api/integrations/automation/templates/${templateId}/activate`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error('Failed to activate template')
      setSuccess('Template activated as inactive rule. Enable it when ready.')
      await fetchRules()
      setTimeout(() => setSuccess(null), 5000)
    } catch {
      setError('Failed to activate template')
    }
  }

  function resetForm() {
    setFormName('')
    setFormDescription('')
    setFormTrigger('')
    setFormAction('')
    setFormConditions([])
    setFormActionParams({})
    setShowCreateForm(false)
    setEditingRuleId(null)
  }

  function startEdit(rule: AutomationRule) {
    setEditingRuleId(rule.id)
    setFormName(rule.name)
    setFormDescription(rule.description || '')
    setFormTrigger(rule.trigger_event)
    setFormAction(rule.action_type)
    setFormConditions(
      (rule.conditions || []).map((c) => ({
        type: c.type,
        params: Object.fromEntries(
          Object.entries(c.params || {}).map(([k, v]) => [k, String(v)])
        ),
      }))
    )
    setFormActionParams(
      Object.fromEntries(
        Object.entries(rule.action_params || {}).map(([k, v]) => [k, String(v)])
      )
    )
    setShowCreateForm(true)
  }

  async function handleSaveRule() {
    if (!formName.trim() || !formTrigger || !formAction) {
      setError('Name, trigger, and action are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        trigger_event: formTrigger,
        conditions: formConditions.map((c) => ({
          type: c.type,
          params: Object.fromEntries(
            Object.entries(c.params).map(([k, v]) => {
              const num = Number(v)
              return [k, !isNaN(num) && v !== '' ? num : v]
            })
          ),
        })),
        action_type: formAction,
        action_params: Object.fromEntries(
          Object.entries(formActionParams).map(([k, v]) => {
            const num = Number(v)
            return [k, !isNaN(num) && v !== '' ? num : v]
          })
        ),
      }

      const isEdit = editingRuleId !== null
      const url = isEdit
        ? `/api/integrations/automation/rules/${editingRuleId}`
        : '/api/integrations/automation/rules'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to save rule')
      }
      setSuccess(isEdit ? 'Rule updated' : 'Rule created')
      resetForm()
      await fetchRules()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule')
    } finally {
      setSaving(false)
    }
  }

  function addCondition() {
    if (formConditions.length >= 3) return
    setFormConditions([...formConditions, { type: '', params: {} }])
  }

  function removeCondition(index: number) {
    setFormConditions(formConditions.filter((_, i) => i !== index))
  }

  function updateCondition(
    index: number,
    field: 'type' | 'params',
    value: string | Record<string, string>
  ) {
    const updated = [...formConditions]
    if (field === 'type') {
      updated[index] = { type: value as string, params: {} }
    } else {
      updated[index] = { ...updated[index], params: value as Record<string, string> }
    }
    setFormConditions(updated)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 skeleton-shimmer rounded-xl bg-zinc-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-zinc-200">
        {AUTOMATION_SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={cn(
              'whitespace-nowrap px-[18px] py-2.5 text-[13px] font-medium transition border-b-2',
              subTab === tab
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
          {success}
        </div>
      )}

      {subTab === 'Rules' && (
        <>
          {/* Rules list */}
          <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Automation Rules</h3>
                <p className="mt-1 text-[13px] text-zinc-500">
                  Rules trigger actions automatically when events occur.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowCreateForm(true)
                }}
                className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
              >
                Create rule
              </button>
            </div>

            {rules.length === 0 && !showCreateForm ? (
              <div className="mt-6 rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-8 text-center">
                <p className="text-[13px] font-medium text-zinc-600">No automation rules yet</p>
                <p className="mt-1 text-[13px] text-zinc-400">
                  Create a rule or activate a template below to get started.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      <th className="pb-2.5 pr-4">Name</th>
                      <th className="pb-2.5 pr-4">Trigger</th>
                      <th className="pb-2.5 pr-4">Action</th>
                      <th className="pb-2.5 pr-4">Status</th>
                      <th className="pb-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-zinc-50 last:border-0">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-zinc-900">{rule.name}</div>
                          {rule.description && (
                            <div className="mt-0.5 text-xs text-zinc-400">{rule.description}</div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-zinc-600">
                          {TRIGGER_LABELS[rule.trigger_event] || rule.trigger_event}
                        </td>
                        <td className="py-3 pr-4 text-zinc-600">
                          {ACTION_LABELS[rule.action_type] || rule.action_type}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => handleToggle(rule.id)}
                            className="group flex items-center gap-2"
                          >
                            <div
                              role="switch"
                              aria-checked={rule.is_active}
                              className={cn(
                                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                rule.is_active ? 'bg-emerald-500' : 'bg-zinc-300'
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                                  rule.is_active ? 'translate-x-4' : 'translate-x-1'
                                )}
                              />
                            </div>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                rule.is_active ? 'text-emerald-700' : 'text-zinc-400'
                              )}
                            >
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(rule)}
                              className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(rule.id)}
                              className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Create/Edit form */}
          {showCreateForm && (
            <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900">
                {editingRuleId ? 'Edit Rule' : 'Create Rule'}
              </h3>

              <div className="mt-5 max-w-lg space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Rule name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Auto-create case on checkout"
                    className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What does this rule do?"
                    className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                  />
                </div>

                {/* Trigger */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">When this happens</label>
                  <select
                    value={formTrigger}
                    onChange={(e) => setFormTrigger(e.target.value)}
                    className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                  >
                    <option value="">Select trigger...</option>
                    {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditions */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Only if (conditions)
                    </label>
                    {formConditions.length < 3 && (
                      <button
                        type="button"
                        onClick={addCondition}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        + Add condition
                      </button>
                    )}
                  </div>
                  {formConditions.length === 0 && (
                    <p className="mt-1 text-xs text-zinc-400">
                      No conditions — rule fires on every matching event.
                    </p>
                  )}
                  {formConditions.map((cond, idx) => (
                    <div key={idx} className="mt-2 flex gap-2">
                      <select
                        value={cond.type}
                        onChange={(e) => updateCondition(idx, 'type', e.target.value)}
                        className="h-10 flex-1 rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700"
                      >
                        <option value="">Select condition...</option>
                        {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {cond.type && cond.type !== 'case.has_no_assignee' && (
                        <input
                          type="text"
                          value={Object.values(cond.params)[0] || ''}
                          onChange={(e) => {
                            const paramKey =
                              cond.type === 'tenancy.end_date_within_days'
                                ? 'days'
                                : cond.type === 'tenancy.deposit_scheme_is'
                                  ? 'scheme'
                                  : cond.type === 'case.status_is'
                                    ? 'status'
                                    : cond.type === 'case.priority_is'
                                      ? 'priority'
                                      : cond.type === 'inspection.type_is'
                                        ? 'type'
                                        : cond.type === 'property.postcode_starts_with'
                                          ? 'prefix'
                                          : 'value'
                            updateCondition(idx, 'params', { [paramKey]: e.target.value })
                          }}
                          placeholder={
                            cond.type === 'tenancy.end_date_within_days'
                              ? '30'
                              : cond.type === 'case.status_is'
                                ? 'review'
                                : 'value'
                          }
                          className="h-10 w-28 rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px] text-zinc-700"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        className="h-9 rounded px-2 text-xs text-rose-500 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {/* Action */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Then do this</label>
                  <select
                    value={formAction}
                    onChange={(e) => {
                      setFormAction(e.target.value)
                      setFormActionParams({})
                    }}
                    className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                  >
                    <option value="">Select action...</option>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action params (dynamic based on action type) */}
                {formAction === 'create_case' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Priority</label>
                    <select
                      value={formActionParams.priority || 'medium'}
                      onChange={(e) =>
                        setFormActionParams({ ...formActionParams, priority: e.target.value })
                      }
                      className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}

                {formAction === 'change_case_status' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Target status</label>
                    <select
                      value={formActionParams.status || ''}
                      onChange={(e) =>
                        setFormActionParams({ ...formActionParams, status: e.target.value })
                      }
                      className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px]"
                    >
                      <option value="">Select status...</option>
                      <option value="draft">Draft</option>
                      <option value="collecting_evidence">Collecting Evidence</option>
                      <option value="analysis">Analysis</option>
                      <option value="review">Review</option>
                    </select>
                  </div>
                )}

                {formAction === 'assign_case' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Assignment method
                    </label>
                    <select
                      value={formActionParams.user_id || 'least_loaded'}
                      onChange={(e) =>
                        setFormActionParams({ ...formActionParams, user_id: e.target.value })
                      }
                      className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px]"
                    >
                      <option value="least_loaded">Least loaded operator</option>
                      <option value="round_robin">Round robin</option>
                    </select>
                  </div>
                )}

                {formAction === 'send_notification' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Channel</label>
                    <select
                      value={formActionParams.channel || 'in_app'}
                      onChange={(e) =>
                        setFormActionParams({ ...formActionParams, channel: e.target.value })
                      }
                      className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px]"
                    >
                      <option value="in_app">In-app</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                )}

                {formAction === 'log_timeline_event' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Description</label>
                    <input
                      type="text"
                      value={formActionParams.description || ''}
                      onChange={(e) =>
                        setFormActionParams({ ...formActionParams, description: e.target.value })
                      }
                      placeholder="Action logged by automation"
                      className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-2 text-[13px]"
                    />
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveRule}
                    disabled={saving}
                    className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingRuleId ? 'Update rule' : 'Create rule'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-[10px] border border-zinc-200 px-5 py-2.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Templates */}
          {templates.length > 0 && (
            <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-zinc-900">Quick Start Templates</h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                Activate a template to create an inactive rule you can customise.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-3"
                  >
                    <p className="text-[13px] font-medium text-zinc-900">{tmpl.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{tmpl.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {TRIGGER_LABELS[tmpl.trigger_event] || tmpl.trigger_event}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {ACTION_LABELS[tmpl.action_type] || tmpl.action_type}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActivateTemplate(tmpl.id)}
                      className="mt-3 rounded-[10px] border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Activate template
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {subTab === 'Execution Log' && (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Execution Log</h3>
              <p className="mt-1 text-[13px] text-zinc-500">
                Recent rule evaluations and their outcomes.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              className="rounded-[10px] border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="mt-6 rounded-[10px] border border-zinc-100/80 bg-zinc-50 px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-zinc-600">No executions yet</p>
              <p className="mt-1 text-[13px] text-zinc-400">
                Logs will appear here when rules are triggered.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    <th className="pb-2.5 pr-4">Trigger</th>
                    <th className="pb-2.5 pr-4">Result</th>
                    <th className="pb-2.5 pr-4">Action</th>
                    <th className="pb-2.5 pr-4">Duration</th>
                    <th className="pb-2.5">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-zinc-50 last:border-0">
                      <td className="py-2.5 pr-4 text-zinc-600">
                        {TRIGGER_LABELS[log.trigger_event] || log.trigger_event}
                      </td>
                      <td className="py-2.5 pr-4">
                        {log.conditions_met ? (
                          log.action_result && 'error' in log.action_result ? (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                              Failed
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Executed
                            </span>
                          )
                        ) : (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                            Skipped
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-600">
                        {log.action_taken
                          ? ACTION_LABELS[log.action_taken] || log.action_taken
                          : '-'}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">
                        {log.duration_ms != null ? `${log.duration_ms}ms` : '-'}
                      </td>
                      <td className="py-2.5 text-zinc-400">
                        {new Date(log.executed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// API Partners tab — manage partner API applications & keys
// ---------------------------------------------------------------------------

type PartnerApp = {
  id: string
  name: string
  client_id: string
  scopes: string[]
  is_sandbox: boolean
  rate_limit_per_minute: number
  status: string
  key_count: number
  webhook_count: number
  created_at: string
  updated_at: string
}

type PartnerAppCreated = PartnerApp & { client_secret: string }

type ApiKeyItem = {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  status: string
  expires_at: string | null
  last_used_at: string | null
  created_at: string
}

type ApiKeyCreated = ApiKeyItem & { raw_key: string }

const ALL_SCOPES = [
  'inventory:write',
  'documents:write',
  'documents:read',
  'cases:read',
  'webhooks:manage',
] as const

const SCOPE_LABELS: Record<string, string> = {
  'inventory:write': 'Push inspections',
  'documents:write': 'Push documents',
  'documents:read': 'Download documents',
  'cases:read': 'Query cases',
  'webhooks:manage': 'Manage webhooks',
}

function SecretRevealBanner({
  label,
  value,
  onDismiss,
}: {
  label: string
  value: string
  onDismiss: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-4 py-4">
      <p className="text-[13px] font-semibold text-amber-800">{label}</p>
      <p className="mt-1 text-xs text-amber-700">
        This will not be shown again. Copy it now and store it securely.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={value}
          className="h-9 flex-1 rounded-md border border-amber-200 bg-white px-3 font-mono text-xs text-zinc-900 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-2 text-xs text-amber-600 underline hover:text-amber-800"
      >
        Dismiss
      </button>
    </div>
  )
}

function ApiPartnersTab() {
  // -- List view state --
  const [apps, setApps] = useState<PartnerApp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // -- Create form state --
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formScopes, setFormScopes] = useState<string[]>([])
  const [formSandbox, setFormSandbox] = useState(false)
  const [formRateLimit, setFormRateLimit] = useState(300)
  const [saving, setSaving] = useState(false)

  // -- Detail view state --
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<PartnerApp | null>(null)
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [keysLoading, setKeysLoading] = useState(false)

  // -- Edit state --
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editScopes, setEditScopes] = useState<string[]>([])
  const [editRateLimit, setEditRateLimit] = useState(300)

  // -- Key creation state --
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [keyScopes, setKeyScopes] = useState<string[]>([])
  const [keyExpiryDays, setKeyExpiryDays] = useState<string>('')

  // -- Secret reveal --
  const [revealedSecret, setRevealedSecret] = useState<{
    label: string
    value: string
  } | null>(null)

  // -- Confirm dialog --
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    description: string
    tone: 'danger' | 'default'
    onConfirm: () => void
  } | null>(null)

  // ---- Data fetching ----

  const fetchApps = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operator/applications')
      if (!res.ok) throw new Error('Failed to load applications')
      const data = (await res.json()) as PartnerApp[]
      setApps(data)
    } catch {
      setError('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchApps()
  }, [fetchApps])

  async function fetchAppDetail(appId: string) {
    try {
      const res = await fetch(`/api/operator/applications/${appId}`)
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || `Failed to load app (${res.status})`)
      }
      const data = (await res.json()) as PartnerApp
      setSelectedApp(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application details.')
    }
  }

  async function fetchKeys(appId: string) {
    setKeysLoading(true)
    try {
      const res = await fetch(`/api/operator/applications/${appId}/keys`)
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || `Failed to load keys (${res.status})`)
      }
      const data = (await res.json()) as ApiKeyItem[]
      setKeys(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys.')
    } finally {
      setKeysLoading(false)
    }
  }

  function openDetail(app: PartnerApp) {
    setSelectedAppId(app.id)
    setSelectedApp(app)
    setEditing(false)
    setShowKeyForm(false)
    setRevealedSecret(null)
    setError(null)
    setSuccess(null)
    void fetchKeys(app.id)
  }

  function closeDetail() {
    setSelectedAppId(null)
    setSelectedApp(null)
    setKeys([])
    setEditing(false)
    setShowKeyForm(false)
    setRevealedSecret(null)
  }

  // ---- Actions ----

  async function handleCreateApp() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/operator/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          scopes: formScopes,
          is_sandbox: formSandbox,
          rate_limit_per_minute: formRateLimit,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Failed to create application')
      }
      const created = (await res.json()) as PartnerAppCreated
      setRevealedSecret({
        label: `Client Secret for "${created.name}"`,
        value: created.client_secret,
      })
      setShowCreateForm(false)
      setFormName('')
      setFormScopes([])
      setFormSandbox(false)
      setFormRateLimit(300)
      setSuccess('Application created.')
      await fetchApps()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create application.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateApp() {
    if (!selectedAppId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/operator/applications/${selectedAppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          scopes: editScopes,
          rate_limit_per_minute: editRateLimit,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Failed to update')
      }
      const updated = (await res.json()) as PartnerApp
      setSelectedApp(updated)
      setEditing(false)
      setSuccess('Application updated.')
      await fetchApps()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application.')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteApp(app: PartnerApp) {
    setConfirmDialog({
      title: 'Delete application',
      description: `This will revoke "${app.name}" and all its API keys. Partners using this application will lose access immediately.`,
      tone: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        setError(null)
        try {
          const res = await fetch(`/api/operator/applications/${app.id}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error('Failed to delete')
          if (selectedAppId === app.id) closeDetail()
          setSuccess('Application deleted.')
          await fetchApps()
        } catch {
          setError('Failed to delete application.')
        }
      },
    })
  }

  async function handleCreateKey() {
    if (!selectedAppId) return
    setSaving(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = { name: keyName.trim() }
      if (keyScopes.length > 0) payload.scopes = keyScopes
      if (keyExpiryDays) payload.expires_in_days = parseInt(keyExpiryDays, 10)

      const res = await fetch(`/api/operator/applications/${selectedAppId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string }
        throw new Error(body.detail || 'Failed to create key')
      }
      const created = (await res.json()) as ApiKeyCreated
      setRevealedSecret({
        label: `API Key "${created.name}"`,
        value: created.raw_key,
      })
      setShowKeyForm(false)
      setKeyName('')
      setKeyScopes([])
      setKeyExpiryDays('')
      await fetchKeys(selectedAppId)
      await fetchAppDetail(selectedAppId)
      await fetchApps()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key.')
    } finally {
      setSaving(false)
    }
  }

  function handleRevokeKey(key: ApiKeyItem) {
    if (!selectedAppId) return
    const appId = selectedAppId
    setConfirmDialog({
      title: 'Revoke API key',
      description: `Revoke key "${key.name}" (${key.key_prefix}...)? Partners using this key will lose access immediately.`,
      tone: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        setError(null)
        try {
          const res = await fetch(
            `/api/operator/applications/${appId}/keys/${key.id}`,
            { method: 'DELETE' }
          )
          if (!res.ok) throw new Error('Failed to revoke')
          setSuccess('Key revoked.')
          await fetchKeys(appId)
          await fetchAppDetail(appId)
          await fetchApps()
        } catch {
          setError('Failed to revoke key.')
        }
      },
    })
  }

  function handleRegenerateSecret() {
    if (!selectedAppId || !selectedApp) return
    const appId = selectedAppId
    setConfirmDialog({
      title: 'Regenerate client secret',
      description: `This will invalidate the current secret for "${selectedApp.name}". All partners using the old secret must update their credentials.`,
      tone: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null)
        setError(null)
        try {
          const res = await fetch(
            `/api/operator/applications/${appId}/regenerate-secret`,
            { method: 'POST' }
          )
          if (!res.ok) throw new Error('Failed to regenerate')
          const data = (await res.json()) as { client_id: string; client_secret: string }
          setRevealedSecret({
            label: 'New Client Secret',
            value: data.client_secret,
          })
          setSuccess('Client secret regenerated.')
        } catch {
          setError('Failed to regenerate secret.')
        }
      },
    })
  }

  // ---- Render helpers ----

  function startEdit() {
    if (!selectedApp) return
    setEditName(selectedApp.name)
    setEditScopes([...selectedApp.scopes])
    setEditRateLimit(selectedApp.rate_limit_per_minute)
    setEditing(true)
  }

  function toggleScope(list: string[], setter: (v: string[]) => void, scope: string) {
    setter(list.includes(scope) ? list.filter((s) => s !== scope) : [...list, scope])
  }

  // ---- Loading state ----

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[13px] text-zinc-400">
        Loading...
      </div>
    )
  }

  // ---- Detail view ----

  if (selectedAppId && selectedApp) {
    return (
      <div className="space-y-6">
        {/* Confirm dialog */}
        {confirmDialog && (
          <ConfirmDialog
            open
            title={confirmDialog.title}
            description={confirmDialog.description}
            tone={confirmDialog.tone}
            confirmLabel={confirmDialog.tone === 'danger' ? 'Yes, proceed' : 'Confirm'}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
          />
        )}

        {/* Back button */}
        <button
          type="button"
          onClick={closeDetail}
          className="text-[13px] text-zinc-500 hover:text-zinc-700"
        >
          &larr; Back to applications
        </button>

        {/* Alerts */}
        {error && (
          <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
            {success}
          </div>
        )}

        {/* Secret reveal */}
        {revealedSecret && (
          <SecretRevealBanner
            label={revealedSecret.label}
            value={revealedSecret.value}
            onDismiss={() => setRevealedSecret(null)}
          />
        )}

        {/* Application details */}
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">
              {editing ? 'Edit Application' : selectedApp.name}
            </h3>
            {!editing && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    selectedApp.status === 'active'
                      ? 'bg-emerald-100/80 text-emerald-700'
                      : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {selectedApp.status}
                </span>
                {selectedApp.is_sandbox && (
                  <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    Sandbox
                  </span>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-5 max-w-md space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Rate limit (requests/min)
                </label>
                <input
                  type="number"
                  value={editRateLimit}
                  onChange={(e) => setEditRateLimit(parseInt(e.target.value, 10) || 300)}
                  min={1}
                  max={10000}
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Scopes</label>
                <div className="mt-2 space-y-2">
                  {ALL_SCOPES.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 text-[13px] text-zinc-700">
                      <input
                        type="checkbox"
                        checked={editScopes.includes(scope)}
                        onChange={() => toggleScope(editScopes, setEditScopes, scope)}
                        className="rounded border-zinc-300"
                      />
                      <span>{SCOPE_LABELS[scope] || scope}</span>
                      <span className="text-xs text-zinc-400">({scope})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleUpdateApp}
                  disabled={saving || !editName.trim()}
                  className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 max-w-md space-y-3">
              <div>
                <span className="text-xs font-medium text-zinc-500">Client ID</span>
                <p className="mt-0.5 font-mono text-[13px] text-zinc-900">{selectedApp.client_id}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-500">Scopes</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selectedApp.scopes.length > 0 ? (
                    selectedApp.scopes.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">No scopes assigned</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-500">Rate limit</span>
                <p className="mt-0.5 text-[13px] text-zinc-900">
                  {selectedApp.rate_limit_per_minute} req/min
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-zinc-500">Created</span>
                <p className="mt-0.5 text-[13px] text-zinc-900">
                  {new Date(selectedApp.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={startEdit}
                  className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateSecret}
                  className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Regenerate Secret
                </button>
              </div>
            </div>
          )}
        </section>

        {/* API Keys section */}
        <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">API Keys</h3>
            {!showKeyForm && (
              <button
                type="button"
                onClick={() => {
                  setShowKeyForm(true)
                  setKeyScopes([...selectedApp.scopes])
                }}
                className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
              >
                Create Key
              </button>
            )}
          </div>

          {/* Key creation form */}
          {showKeyForm && (
            <div className="mt-4 rounded-[10px] border border-zinc-100/80 bg-zinc-50/50 px-4 py-4">
              <div className="max-w-md space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Key name</label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Production key"
                    className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                    Expires in (days, optional)
                  </label>
                  <input
                    type="number"
                    value={keyExpiryDays}
                    onChange={(e) => setKeyExpiryDays(e.target.value)}
                    placeholder="Leave empty for no expiry"
                    min={1}
                    max={365}
                    className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Scopes</label>
                  <div className="mt-2 space-y-2">
                    {selectedApp.scopes.map((scope) => (
                      <label
                        key={scope}
                        className="flex items-center gap-2 text-[13px] text-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={keyScopes.includes(scope)}
                          onChange={() => toggleScope(keyScopes, setKeyScopes, scope)}
                          className="rounded border-zinc-300"
                        />
                        <span>{SCOPE_LABELS[scope] || scope}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateKey}
                    disabled={saving || !keyName.trim()}
                    className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Key'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKeyForm(false)}
                    className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Keys table */}
          {keysLoading ? (
            <p className="mt-4 text-[13px] text-zinc-400">Loading keys...</p>
          ) : keys.length === 0 ? (
            <p className="mt-4 text-[13px] text-zinc-400">No API keys created yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100/80 text-xs text-zinc-500">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Prefix</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Last used</th>
                    <th className="pb-2 pr-4 font-medium">Expires</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr
                      key={key.id}
                      className="border-b border-zinc-50 last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-zinc-900">{key.name}</td>
                      <td className="py-2.5 pr-4 font-mono text-zinc-600">
                        {key.key_prefix}...
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            key.status === 'active'
                              ? 'bg-emerald-100/80 text-emerald-700'
                              : 'bg-zinc-100 text-zinc-600'
                          )}
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-400">
                        {key.expires_at
                          ? new Date(key.expires_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-2.5 text-right">
                        {key.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(key)}
                            className="text-xs font-medium text-rose-600 hover:text-rose-800"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    )
  }

  // ---- List view ----

  return (
    <div className="space-y-6">
      {/* Confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open
          title={confirmDialog.title}
          description={confirmDialog.description}
          tone={confirmDialog.tone}
          confirmLabel={confirmDialog.tone === 'danger' ? 'Yes, proceed' : 'Confirm'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Alerts */}
      {error && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
          {success}
        </div>
      )}

      {/* Secret reveal */}
      {revealedSecret && (
        <SecretRevealBanner
          label={revealedSecret.label}
          value={revealedSecret.value}
          onDismiss={() => setRevealedSecret(null)}
        />
      )}

      {/* Applications section */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">API Applications</h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Manage partner applications that access your data via the public API.
            </p>
          </div>
          {!showCreateForm && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
            >
              Create Application
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mt-5 rounded-[10px] border border-zinc-100/80 bg-zinc-50/50 px-4 py-4">
            <h4 className="text-[13px] font-medium text-zinc-900">New Application</h4>
            <div className="mt-3 max-w-md space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. NLG Integration"
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Scopes</label>
                <div className="mt-2 space-y-2">
                  {ALL_SCOPES.map((scope) => (
                    <label key={scope} className="flex items-center gap-2 text-[13px] text-zinc-700">
                      <input
                        type="checkbox"
                        checked={formScopes.includes(scope)}
                        onChange={() => toggleScope(formScopes, setFormScopes, scope)}
                        className="rounded border-zinc-300"
                      />
                      <span>{SCOPE_LABELS[scope] || scope}</span>
                      <span className="text-xs text-zinc-400">({scope})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-[13px] text-zinc-700">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formSandbox}
                    onClick={() => setFormSandbox(!formSandbox)}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                      formSandbox ? 'bg-emerald-500' : 'bg-zinc-200'
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                        formSandbox ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  Sandbox mode
                </label>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                  Rate limit (requests/min)
                </label>
                <input
                  type="number"
                  value={formRateLimit}
                  onChange={(e) => setFormRateLimit(parseInt(e.target.value, 10) || 300)}
                  min={1}
                  max={10000}
                  className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateApp}
                  disabled={saving || !formName.trim()}
                  className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications table */}
        {apps.length === 0 ? (
          <p className="mt-5 text-[13px] text-zinc-400">
            No applications yet. Create one to generate API credentials for a partner.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-100/80 text-xs text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Client ID</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Keys</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id} className="border-b border-zinc-50 last:border-0">
                    <td className="py-2.5 pr-4 text-zinc-900">{app.name}</td>
                    <td className="py-2.5 pr-4 font-mono text-zinc-600">
                      {app.client_id.slice(0, 8)}...
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          app.status === 'active'
                            ? 'bg-emerald-100/80 text-emerald-700'
                            : 'bg-zinc-100 text-zinc-600'
                        )}
                      >
                        {app.status}
                      </span>
                      {app.is_sandbox && (
                        <span className="ml-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Sandbox
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-600">{app.key_count}</td>
                    <td className="py-2.5 pr-4 text-zinc-400">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(app)}
                        className="mr-3 text-xs font-medium text-emerald-600 hover:text-emerald-800"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteApp(app)}
                        className="text-xs font-medium text-rose-600 hover:text-rose-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Account')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Settings</h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          Configure your workspace
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'whitespace-nowrap px-[18px] py-2.5 text-[13px] font-medium transition border-b-2',
              activeTab === tab
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'Account' ? <AccountTab /> : null}
        {activeTab === 'Team' ? <TeamTab /> : null}
        {activeTab === 'Integrations' ? <IntegrationsTab /> : null}
        {activeTab === 'Email Ingestion' ? <EmailIngestionTab /> : null}
        {activeTab === 'Automation' ? <AutomationTab /> : null}
        {activeTab === 'API Partners' ? <ApiPartnersTab /> : null}
      </div>
    </div>
  )
}
