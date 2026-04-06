'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/ui'

const TABS = ['Account', 'Team', 'Integrations', 'Email Ingestion'] as const
type Tab = (typeof TABS)[number]

function AccountTab() {
  return (
    <div className="space-y-6">
      {/* Basic information */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Basic information</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Your personal details used across the workspace.
        </p>

        <div className="mt-5 max-w-md space-y-4">
          <div>
            <label htmlFor="first-name" className="block text-xs font-medium text-zinc-500">
              First name
            </label>
            <input
              id="first-name"
              type="text"
              placeholder="First name"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>
          <div>
            <label htmlFor="last-name" className="block text-xs font-medium text-zinc-500">
              Last name
            </label>
            <input
              id="last-name"
              type="text"
              placeholder="Last name"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-500">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.co.uk"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 placeholder:text-zinc-400"
              disabled
            />
            <p className="mt-1 text-xs text-zinc-400">
              Email is managed by your identity provider and cannot be changed here.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-950">Receive email notifications</p>
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
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Update profile
          </button>
        </div>
      </section>

      {/* Change password */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Change password</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Update your workspace password. You'll need to confirm your current password first.
        </p>

        <div className="mt-5 max-w-md space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-xs font-medium text-zinc-500">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              placeholder="Enter current password"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs font-medium text-zinc-500">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-medium text-zinc-500">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>

          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Update password
          </button>
        </div>
      </section>

      {/* Two-factor authentication */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Two-factor authentication</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Add an extra layer of security to your account.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            Not enabled
          </span>
        </div>

        <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
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
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Your team</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Manage workspace members, roles, and permissions.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Invite user
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search for users"
            className="h-10 w-64 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
          />
        </div>

        <div className="mt-5 flex gap-6 border-b border-zinc-200">
          {TEAM_SUB_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveSubTab(tab)}
              className={cn(
                'pb-2.5 text-sm font-medium transition',
                activeSubTab === tab
                  ? 'border-b-2 border-zinc-900 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          {members.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500">
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
                    <td className="py-3 pr-4 font-medium text-zinc-950">{member.name}</td>
                    <td className="py-3 pr-4 text-zinc-600">{member.email}</td>
                    <td className="py-3 pr-4 text-zinc-600">{member.joined}</td>
                    <td className="py-3 pr-4 text-zinc-600">{member.role}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
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
    name: 'SME Professional',
    description: 'Pull properties and push report URLs to SME Professional.',
    features: ['Pull properties from SME', 'Push report URLs to SME'],
  },
  {
    name: 'Reapit',
    description: 'Sync property and tenancy data with Reapit Foundations.',
    features: ['Pull properties from Reapit', 'Sync tenancy records'],
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
]

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
      <div className="py-8 text-center text-sm text-zinc-400">
        Loading email ingestion settings...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Config section */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Email Ingestion</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Receive inventory reports and documents via email. Inventory providers
              send reports to your dedicated address and they are automatically
              matched to properties.
            </p>
          </div>
          {config ? (
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                config.is_active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-zinc-100 text-zinc-600'
              )}
            >
              {config.is_active ? 'Active' : 'Inactive'}
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              Not configured
            </span>
          )}
        </div>

        {error ? (
          <div className="mt-4 border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="mt-5 max-w-lg space-y-4">
          <div>
            <label htmlFor="email-prefix" className="block text-xs font-medium text-zinc-500">
              Email address prefix
            </label>
            <div className="mt-1 flex items-center gap-0">
              <input
                id="email-prefix"
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="reports"
                className="h-10 w-48 rounded-l-lg border border-r-0 border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
              />
              <span className="flex h-10 items-center rounded-r-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500">
                @in.renovoai.co.uk
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Inventory providers will send reports to this address.
            </p>
          </div>

          <div>
            <label htmlFor="allowed-domains" className="block text-xs font-medium text-zinc-500">
              Allowed sender domains (optional)
            </label>
            <input
              id="allowed-domains"
              type="text"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder="helloreport.co.uk, nolettinggo.co.uk"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Comma-separated. Leave empty to accept from any sender.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-950">Enable email ingestion</p>
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
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : config ? 'Update configuration' : 'Enable email ingestion'}
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">How it works</h3>
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
                <p className="text-sm font-medium text-zinc-950">{item.title}</p>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Unmatched queue count */}
      {unmatchedCount > 0 ? (
        <section className="border border-amber-200 bg-amber-50 px-6 py-4 md:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {unmatchedCount} unmatched {unmatchedCount === 1 ? 'email' : 'emails'} pending review
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                These emails could not be automatically matched to a property.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Recent activity */}
      {logs.length > 0 ? (
        <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
          <h3 className="text-sm font-semibold text-zinc-950">Recent activity</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs font-medium text-zinc-500">
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
                          'rounded-full px-2 py-0.5 text-xs font-medium',
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
        <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
          <p className="text-center text-sm text-zinc-400">
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
// Integrations Tab
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const [activeIntegration, setActiveIntegration] = useState('SME Professional')
  const selected = INTEGRATION_LIST.find((i) => i.name === activeIntegration) ?? INTEGRATION_LIST[0]

  return (
    <div className="space-y-6">
      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Integrations</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Connect your property management tools and inventory software.
        </p>

        <div className="mt-5 flex gap-6 overflow-x-auto border-b border-zinc-200">
          {INTEGRATION_LIST.map((integration) => (
            <button
              key={integration.name}
              type="button"
              onClick={() => setActiveIntegration(integration.name)}
              className={cn(
                'shrink-0 whitespace-nowrap pb-2.5 text-sm font-medium transition',
                activeIntegration === integration.name
                  ? 'border-b-2 border-zinc-900 text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              {integration.name}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-zinc-200/80 bg-white px-6 py-6 md:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">
              {selected.name} Integration
            </h3>
            <p className="mt-1 text-sm text-zinc-500">{selected.description}</p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            Not configured
          </span>
        </div>

        <div className="mt-5 space-y-2">
          {selected.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
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
            <label htmlFor="api-key" className="block text-xs font-medium text-zinc-500">
              API Key
            </label>
            <input
              id="api-key"
              type="text"
              placeholder="Enter your API key"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            />
          </div>

          <div>
            <label htmlFor="integration-status" className="block text-xs font-medium text-zinc-500">
              Integration status
            </label>
            <select
              id="integration-status"
              className="mt-1 h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
            >
              <option>Inactive</option>
              <option>Active</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-950">Automatically sync properties overnight</p>
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
    </div>
  )
}

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Account')

  return (
    <div>
      {/* Main tabs */}
      <div className="flex gap-6 border-b border-zinc-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'pb-3 text-sm font-medium transition',
              activeTab === tab
                ? 'border-b-2 border-zinc-900 text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'Account' ? <AccountTab /> : null}
        {activeTab === 'Team' ? <TeamTab /> : null}
        {activeTab === 'Integrations' ? <IntegrationsTab /> : null}
        {activeTab === 'Email Ingestion' ? <EmailIngestionTab /> : null}
      </div>
    </div>
  )
}
