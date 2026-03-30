'use client'

import { WorkspaceBadge } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import {
  formatDate,
  formatEnumLabel,
} from '@/app/eot/_components/eot-ui'
import type {
  CaseWorkspaceParty,
  OperatorCaseWorkspaceData,
} from '@/lib/operator-case-workspace-types'

function formatCurrencyAmount(value: number | null | undefined) {
  if (value == null) {
    return 'Not provided'
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatTextValue(value: string | null | undefined, fallback = 'Not provided') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function formatContactValue(party: CaseWorkspaceParty | null) {
  if (!party) {
    return 'Not provided'
  }

  const contactParts = [party.email, party.phone].filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  )

  return contactParts.length > 0 ? contactParts.join(' · ') : 'Not provided'
}

function getDisplayName(party: CaseWorkspaceParty, fallbackLabel: string) {
  return party.fullName || party.email || party.phone || fallbackLabel
}

function mergeParties(
  parties: CaseWorkspaceParty[],
  fallbackEmail: string | null | undefined,
  prefix: 'tenant' | 'landlord'
) {
  if (parties.length === 0) {
    return fallbackEmail
      ? [
          {
            id: `${prefix}-fallback-${fallbackEmail}`,
            fullName: null,
            email: fallbackEmail,
            phone: null,
            isLead: false,
            ownershipLabel: null,
          } satisfies CaseWorkspaceParty,
        ]
      : []
  }

  if (!fallbackEmail || parties.some((party) => party.email === fallbackEmail)) {
    return parties
  }

  const firstPartyWithoutEmail = parties.findIndex((party) => !party.email)

  if (firstPartyWithoutEmail === -1) {
    return parties
  }

  return parties.map((party, index) =>
    index === firstPartyWithoutEmail ? { ...party, email: fallbackEmail } : party
  )
}

function PartyList({
  emptyMessage,
  fallbackLabel,
  parties,
  role,
}: {
  emptyMessage: string
  fallbackLabel: string
  parties: CaseWorkspaceParty[]
  role: 'tenant' | 'landlord'
}) {
  if (parties.length === 0) {
    return <p className="text-sm leading-6 text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className="divide-y divide-slate-200 border-t border-slate-200">
      {parties.map((party, index) => (
        <div key={party.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">
              {getDisplayName(party, `${fallbackLabel} ${index + 1}`)}
            </p>
            {party.isLead ? <WorkspaceBadge label="Lead tenant" tone="tenant" /> : null}
            {party.ownershipLabel ? (
              <WorkspaceBadge label={party.ownershipLabel} tone={role === 'landlord' ? 'landlord' : 'neutral'} />
            ) : null}
          </div>
          <p className="text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {formatContactValue(party)}
          </p>
        </div>
      ))}
    </div>
  )
}

export function CaseWorkspaceOverviewDetails({
  workspace,
  fallbackLandlordEmail,
  fallbackTenantEmail,
}: {
  workspace: OperatorCaseWorkspaceData
  fallbackLandlordEmail?: string | null
  fallbackTenantEmail?: string | null
}) {
  const tenants = mergeParties(workspace.overview.tenants, fallbackTenantEmail, 'tenant')
  const landlords = mergeParties(workspace.overview.landlords, fallbackLandlordEmail, 'landlord')
  const leadTenant = tenants.find((party) => party.isLead) ?? tenants[0] ?? null

  const overviewItems = [
    {
      label: 'Monthly rent',
      value: formatCurrencyAmount(workspace.overview.monthlyRent),
    },
    {
      label: 'Rent arrears',
      value: formatCurrencyAmount(workspace.overview.rentArrears),
    },
    {
      label: 'Status',
      value: formatEnumLabel(workspace.case.status),
    },
    {
      label: 'Tenancy dates',
      value: `${formatDate(workspace.tenancy.start_date)} to ${formatDate(workspace.tenancy.end_date)}`,
    },
    {
      label: 'Lead tenant',
      value: leadTenant ? getDisplayName(leadTenant, 'Tenant') : 'Not provided',
    },
    {
      label: 'Lead tenant contact',
      value: formatContactValue(leadTenant),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        {overviewItems.map((item) => (
          <div key={item.label} className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {item.label}
            </p>
            <p className="text-sm leading-6 text-slate-950 [overflow-wrap:anywhere]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Tenants</h3>
            <p className="text-sm leading-6 text-slate-600">
              All tenant contacts attached to this tenancy, with the lead tenant highlighted when known.
            </p>
          </div>
          <PartyList
            emptyMessage="No tenant contacts have been provided."
            fallbackLabel="Tenant"
            parties={tenants}
            role="tenant"
          />
        </section>

        <section className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Landlords</h3>
            <p className="text-sm leading-6 text-slate-600">
              Ownership contacts linked to this property or case, including joint ownership when metadata is available.
            </p>
          </div>
          <PartyList
            emptyMessage="No landlord contacts have been provided."
            fallbackLabel="Landlord"
            parties={landlords}
            role="landlord"
          />
        </section>
      </div>

      {workspace.tenancy.notes ? (
        <section className="space-y-2 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Tenancy notes</h3>
          <p className="text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {formatTextValue(workspace.tenancy.notes)}
          </p>
        </section>
      ) : null}
    </div>
  )
}
