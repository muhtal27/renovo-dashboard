'use client'

import { useState } from 'react'
import { cn } from '@/lib/ui'

const TABS = ['Account', 'Team', 'Integrations', 'Email Ingestion', 'Automation', 'API Partners', 'Data & Privacy'] as const
type Tab = (typeof TABS)[number]

// ---------------------------------------------------------------------------
// Account Tab
// ---------------------------------------------------------------------------

function AccountTab() {
  const [notificationsOn, setNotificationsOn] = useState(true)

  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5" style={{ maxWidth: 520 }}>
      <h4 className="mb-4 text-sm font-semibold text-zinc-900">Profile</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            First Name
          </label>
          <input
            type="text"
            defaultValue="Jamie"
            className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Last Name
          </label>
          <input
            type="text"
            defaultValue="Mitchell"
            className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Email
          </label>
          <input
            type="email"
            defaultValue="j.mitchell@propertyfirst.co.uk"
            disabled
            className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-600 outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Notifications
          </label>
          <div className="mt-2 flex items-center gap-[10px]">
            <button
              type="button"
              onClick={() => setNotificationsOn(!notificationsOn)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                notificationsOn
                  ? 'bg-emerald-500 focus:ring-emerald-500'
                  : 'bg-zinc-200 focus:ring-zinc-400'
              )}
              role="switch"
              aria-checked={notificationsOn}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                  notificationsOn ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <span className="text-[13px] text-zinc-900">Email notifications enabled</span>
          </div>
        </div>

        <button
          type="button"
          className="rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Team Tab
// ---------------------------------------------------------------------------

function TeamTab() {
  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
      <h4 className="mb-1 text-sm font-semibold text-zinc-900">Team Settings</h4>
      <p className="text-[13px] text-zinc-500">
        Configure default team preferences and workspace policies.
      </p>

      <div className="mt-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Workspace Name
        </label>
        <input
          type="text"
          defaultValue="PropertyFirst Ltd"
          className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      <div className="mt-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Default Region
        </label>
        <select
          defaultValue="Scotland"
          className="mt-1 h-10 w-full appearance-none rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        >
          <option>Scotland</option>
          <option>England</option>
          <option>Wales</option>
          <option>Northern Ireland</option>
        </select>
      </div>

      <button
        type="button"
        className="mt-4 rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
      >
        Save
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

const INTEGRATIONS = [
  { name: 'SME Professional', desc: 'Property management software for lettings agents.', status: 'Connected', connected: true },
  { name: 'Reapit', desc: 'Cloud-based estate agency and property management platform.', status: 'Connected', connected: true },
  { name: 'FixFlo', desc: 'Repair and maintenance reporting platform.', status: 'Not configured', connected: false },
  { name: 'HelloReport', desc: 'Inventory and property inspection software.', status: 'Not configured', connected: false },
  { name: 'No Letting Go', desc: 'Professional inventory and property inspection services.', status: 'Not configured', connected: false },
  { name: 'Inventory Base', desc: 'Digital inventory app for property professionals.', status: 'Not configured', connected: false },
  { name: 'Inventory Hive', desc: 'Cloud-based property reporting and compliance platform.', status: 'Not configured', connected: false },
]

function IntegrationsTab() {
  return (
    <div className="space-y-4">
      {INTEGRATIONS.map((ig) => (
        <div key={ig.name} className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900">{ig.name}</h4>
              <p className="mt-1 text-[13px] text-zinc-500">{ig.desc}</p>
            </div>
            <span className={cn('badge', ig.connected ? 'badge-emerald' : 'badge-zinc')}>
              {ig.status}
            </span>
          </div>

          {ig.connected ? (
            <div className="mt-3">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                API Key
              </label>
              <input
                type="password"
                defaultValue="••••••••••••"
                className="mt-1 h-10 w-full max-w-[300px] rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
              />
            </div>
          ) : (
            <button
              type="button"
              className="mt-3 rounded-[10px] border border-zinc-200 bg-white px-4 py-2 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Configure
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Email Ingestion Tab
// ---------------------------------------------------------------------------

function EmailIngestionTab() {
  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5" style={{ maxWidth: 520 }}>
      <h4 className="mb-1 text-sm font-semibold text-zinc-900">Email Ingestion</h4>
      <p className="mb-4 text-[13px] text-zinc-500">
        Forward emails to ingest case documents automatically.
      </p>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Ingest Email Address
        </label>
        <div
          className="mt-1 flex h-10 items-center rounded-[10px] border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-600"
        >
          ingest@propertyfirst.renovo.ai
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Allowed Domains
        </label>
        <input
          type="text"
          defaultValue="propertyfirst.co.uk"
          placeholder="e.g. propertyfirst.co.uk"
          className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      <button
        type="button"
        className="mt-4 rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
      >
        Save
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Automation Tab
// ---------------------------------------------------------------------------

const AUTOMATION_RULES = [
  { label: 'Auto-assign new cases', description: 'Automatically assign incoming checkouts based on team capacity', defaultOn: true },
  { label: 'Auto-run AI analysis', description: 'Run AI analysis automatically when evidence is complete', defaultOn: true },
  { label: 'Send checkout reminders', description: 'Email tenants 7 days before checkout date', defaultOn: false },
  { label: 'Auto-generate reports', description: 'Generate weekly portfolio summary reports', defaultOn: false },
]

function AutomationTab() {
  const [toggles, setToggles] = useState(() =>
    AUTOMATION_RULES.map((r) => r.defaultOn)
  )

  function handleToggle(index: number) {
    setToggles((prev) => prev.map((v, i) => (i === index ? !v : v)))
  }

  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5" style={{ maxWidth: 520 }}>
      <h4 className="mb-4 text-sm font-semibold text-zinc-900">Automation Rules</h4>

      <div className="space-y-5">
        {AUTOMATION_RULES.map((rule, i) => (
          <div key={rule.label} className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => handleToggle(i)}
              className={cn(
                'relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                toggles[i]
                  ? 'bg-emerald-500 focus:ring-emerald-500'
                  : 'bg-zinc-200 focus:ring-zinc-400'
              )}
              role="switch"
              aria-checked={toggles[i]}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform',
                  toggles[i] ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <div>
              <div className="text-[13px] font-medium text-zinc-900">{rule.label}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{rule.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// API Partners Tab
// ---------------------------------------------------------------------------

function ApiPartnersTab() {
  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5" style={{ maxWidth: 520 }}>
      <h4 className="mb-1 text-sm font-semibold text-zinc-900">API Partners</h4>
      <p className="mb-4 text-[13px] text-zinc-500">
        Manage external API access to your workspace.
      </p>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          API Key
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="password"
            defaultValue="rv_live_a1b2c3d4e5f6"
            className="h-10 flex-1 rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
            title="Copy API key"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          Webhook URL
        </label>
        <input
          type="text"
          placeholder="https://your-server.com/webhook"
          className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      <button
        type="button"
        className="mt-4 rounded-[10px] bg-zinc-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-800"
      >
        Save
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Settings Component
// ---------------------------------------------------------------------------

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Account')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Settings</h2>
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
        {activeTab === 'Data & Privacy' ? <DataPrivacyTab /> : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data & Privacy Tab
// ---------------------------------------------------------------------------

function DataPrivacyTab() {
  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5" style={{ maxWidth: 520 }}>
      <h4 className="mb-4 text-sm font-semibold text-zinc-900">Data Retention</h4>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Case Data Retention
          </label>
          <select
            defaultValue="24"
            className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          >
            <option value="12">12 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="60">60 months</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Document Retention
          </label>
          <select
            defaultValue="36"
            className="mt-1 h-10 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
          >
            <option value="12">12 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="60">60 months</option>
            <option value="84">7 years</option>
          </select>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-5">
        <h4 className="mb-4 text-sm font-semibold text-zinc-900">Data Subject Requests</h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="app-secondary-button"
          >
            Export My Data
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-4 py-2 text-[13px] font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Request Data Deletion
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Data subject requests are processed within 30 days in accordance with UK GDPR requirements.
        </p>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          className="app-primary-button"
        >
          Save
        </button>
      </div>
    </div>
  )
}
