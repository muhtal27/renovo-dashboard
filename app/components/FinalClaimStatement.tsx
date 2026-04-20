'use client'

import { useEffect } from 'react'
import { Check, Printer, X } from 'lucide-react'

// Prototype ref: public/demo.html:1610-1682

export type FinalClaimDeductionStatus = 'accepted' | 'disputed' | 'countered' | 'approved' | 'rejected' | 'queried'

export type FinalClaimDeduction = {
  id: string
  title: string
  room: string
  amount: number
  tenantStatus?: FinalClaimDeductionStatus | null
  tenantCounterAmount?: number | null
  landlordStatus?: FinalClaimDeductionStatus | null
}

export type FinalClaimStatementProps = {
  open: boolean
  caseRef: string
  generatedAtLabel: string
  property: string
  depositScheme: string
  tenancyPeriodLabel: string
  depositType: 'custodial' | 'insurance'
  tenant: string
  landlord: string
  managingAgent: string
  depositAmount: number
  totalClaim: number
  agreedAmount: number
  disputedAmount: number
  counteredAmount: number
  deductions: FinalClaimDeduction[]
  onClose: () => void
}

const CURRENCY = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

function fmt(amount: number) {
  return CURRENCY.format(amount)
}

function statusLabel(status: FinalClaimDeductionStatus | null | undefined, counterAmount?: number | null) {
  if (!status) return '—'
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  if (status === 'countered' && counterAmount != null) {
    return `${label} (${fmt(counterAmount)})`
  }
  return label
}

function statusColor(status: FinalClaimDeductionStatus | null | undefined, side: 'tenant' | 'landlord') {
  if (!status) return 'var(--zinc-400)'
  if (side === 'tenant') {
    if (status === 'accepted') return 'var(--emerald-700)'
    if (status === 'disputed' || status === 'rejected') return 'var(--rose-700)'
    return 'var(--amber-700)'
  }
  // landlord side
  if (status === 'approved') return 'var(--emerald-700)'
  if (status === 'rejected') return 'var(--rose-700)'
  return 'var(--amber-700)'
}

export function FinalClaimStatement({
  open,
  caseRef,
  generatedAtLabel,
  property,
  depositScheme,
  tenancyPeriodLabel,
  depositType,
  tenant,
  landlord,
  managingAgent,
  depositAmount,
  totalClaim,
  agreedAmount,
  disputedAmount,
  counteredAmount,
  deductions,
  onClose,
}: FinalClaimStatementProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const returnAmount = Math.max(0, depositAmount - totalClaim)
  const claimPct = depositAmount > 0 ? Math.round((totalClaim / depositAmount) * 100) : 0
  const unresolved = Math.max(0, totalClaim - agreedAmount - disputedAmount - counteredAmount)

  return (
    <div
      className="final-stmt-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-stmt-title"
    >
      <div className="final-stmt" onClick={(event) => event.stopPropagation()}>
        <div className="final-stmt-header">
          <div>
            <div id="final-stmt-title" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
              Final Deposit Claim Statement
            </div>
            <div className="text-sm text-muted" style={{ marginTop: 4 }}>
              {caseRef} • Generated {generatedAtLabel}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
            style={{ marginTop: 4 }}
          >
            <X width={18} height={18} />
          </button>
        </div>

        <div className="final-stmt-body">
          {/* Property & Tenancy */}
          <div className="final-stmt-section">
            <h4>Property &amp; Tenancy</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px 24px',
                fontSize: 13,
              }}
            >
              <div>
                <span className="text-muted">Property</span>
                <div className="font-medium" style={{ marginTop: 4 }}>{property}</div>
              </div>
              <div>
                <span className="text-muted">Deposit Scheme</span>
                <div className="font-medium" style={{ marginTop: 4 }}>{depositScheme}</div>
              </div>
              <div>
                <span className="text-muted">Tenancy Period</span>
                <div className="font-medium" style={{ marginTop: 4 }}>{tenancyPeriodLabel}</div>
              </div>
              <div>
                <span className="text-muted">Deposit Type</span>
                <div className="font-medium" style={{ marginTop: 4 }}>
                  {depositType === 'custodial' ? 'Custodial' : 'Insurance-backed'}
                </div>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="final-stmt-section">
            <h4>Parties</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                fontSize: 13,
              }}
            >
              {[
                { label: 'Tenant', value: tenant },
                { label: 'Landlord', value: landlord },
                { label: 'Managing Agent', value: managingAgent },
              ].map((p) => (
                <div
                  key={p.label}
                  style={{
                    padding: 12,
                    background: 'var(--zinc-50)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div
                    className="text-muted"
                    style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {p.label}
                  </div>
                  <div className="font-medium" style={{ marginTop: 4 }}>{p.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule of Deductions */}
          <div className="final-stmt-section">
            <h4>Schedule of Deductions</h4>
            <table className="final-stmt-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }}>#</th>
                  <th>Item</th>
                  <th>Room</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Tenant</th>
                  <th>Landlord</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map((d, i) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td>{d.title}</td>
                    <td>{d.room}</td>
                    <td className="tabnum" style={{ textAlign: 'right' }}>{fmt(d.amount)}</td>
                    <td style={{ color: statusColor(d.tenantStatus, 'tenant') }}>
                      {statusLabel(d.tenantStatus, d.tenantCounterAmount)}
                    </td>
                    <td style={{ color: statusColor(d.landlordStatus, 'landlord') }}>
                      {statusLabel(d.landlordStatus)}
                    </td>
                  </tr>
                ))}
                <tr className="final-stmt-total">
                  <td colSpan={3} style={{ textAlign: 'right' }}>Total Claim</td>
                  <td className="tabnum" style={{ textAlign: 'right' }}>{fmt(totalClaim)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Negotiation Summary */}
          <div className="final-stmt-section">
            <h4>Negotiation Summary</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 10,
                fontSize: 13,
              }}
            >
              {[
                { label: 'Agreed',     value: agreedAmount,    bg: 'var(--emerald-50)', color: 'var(--emerald-700)' },
                { label: 'Disputed',   value: disputedAmount,  bg: 'var(--rose-50)',    color: 'var(--rose-700)' },
                { label: 'Countered',  value: counteredAmount, bg: 'var(--amber-50)',   color: 'var(--amber-700)' },
                { label: 'Unresolved', value: unresolved,      bg: 'var(--zinc-50)',    color: undefined },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    padding: 10,
                    background: row.bg,
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center',
                  }}
                >
                  <div className="text-muted" style={{ fontSize: 11 }}>{row.label}</div>
                  <div
                    className="font-semibold tabnum"
                    style={{ marginTop: 4, color: row.color }}
                  >
                    {fmt(row.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deposit Allocation */}
          <div className="final-stmt-section">
            <h4>Deposit Allocation</h4>
            <div className="final-stmt-split">
              <div
                className="final-stmt-split-box"
                style={{ background: 'var(--emerald-50)', border: '1px solid var(--emerald-200)' }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--emerald-700)',
                  }}
                >
                  To Landlord (Deductions)
                </div>
                <div
                  className="tabnum"
                  style={{ fontSize: 24, fontWeight: 700, color: 'var(--emerald-700)', marginTop: 6 }}
                >
                  {fmt(totalClaim)}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>{claimPct}% of deposit</div>
              </div>
              <div
                className="final-stmt-split-box"
                style={{ background: 'var(--sky-50)', border: '1px solid var(--sky-200)' }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--sky-700)',
                  }}
                >
                  Returned to Tenant
                </div>
                <div
                  className="tabnum"
                  style={{ fontSize: 24, fontWeight: 700, color: 'var(--sky-700)', marginTop: 6 }}
                >
                  {fmt(returnAmount)}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: 4 }}>{100 - claimPct}% of deposit</div>
              </div>
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 12,
                padding: 10,
                background: 'var(--zinc-50)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span className="text-sm text-muted">Total Deposit Held: </span>
              <span className="text-sm font-bold tabnum">{fmt(depositAmount)}</span>
            </div>
          </div>
        </div>

        <div className="final-stmt-footer">
          <div className="text-xs text-muted">
            {depositScheme} • Ref: {caseRef}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
            >
              <Printer width={14} height={14} />
              <span>Print</span>
            </button>
            <button type="button" className="btn btn-accent btn-sm" onClick={onClose}>
              <Check width={14} height={14} />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
