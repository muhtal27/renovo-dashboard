-- Renovo internal finance / runway tracking.
-- Internal-only: these tables track Renovo's own company finances
-- (cash, burn, revenue, runway) for founder + finance team.
-- Not linked to customer tenants — scoped by an email allowlist.

-- ─── Allowlist ────────────────────────────────────────────────────────────
-- Single source of truth for who can read / write the finance tables.
-- Application-layer guards read this; RLS policies reference it.

CREATE TABLE IF NOT EXISTS finance_allowed_emails (
  email text PRIMARY KEY,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO finance_allowed_emails (email, note) VALUES
  ('muhammad@renovoai.co.uk', 'Founder'),
  ('rabeea@renovoai.co.uk', 'Team')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE finance_allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only service_role can read the allowlist directly. App reads it via
-- service-role client inside the guard helper.
CREATE POLICY finance_allowed_emails_service_only ON finance_allowed_emails
  USING (false);


-- ─── Monthly ledger ───────────────────────────────────────────────────────
-- One row per month. Historical rows are actuals (is_actual = true),
-- future rows are forecasts (is_actual = false).
-- All amounts in GBP, stored as numeric(12,2).

CREATE TABLE IF NOT EXISTS finance_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- First day of the month the row represents, e.g. 2026-04-01
  month date NOT NULL,
  is_actual boolean NOT NULL DEFAULT false,

  -- Cash
  opening_cash numeric(12,2) NOT NULL DEFAULT 0,

  -- Inflows
  mrr_collected numeric(12,2) NOT NULL DEFAULT 0,
  one_off_revenue numeric(12,2) NOT NULL DEFAULT 0,
  rd_credit numeric(12,2) NOT NULL DEFAULT 0,

  -- Outflows
  payroll numeric(12,2) NOT NULL DEFAULT 0,
  contractors numeric(12,2) NOT NULL DEFAULT 0,
  saas_tools numeric(12,2) NOT NULL DEFAULT 0,
  rent_ops numeric(12,2) NOT NULL DEFAULT 0,
  legal_accounting numeric(12,2) NOT NULL DEFAULT 0,
  marketing numeric(12,2) NOT NULL DEFAULT 0,
  other numeric(12,2) NOT NULL DEFAULT 0,

  -- Signed: positive = VAT refund / net received, negative = paid to HMRC
  vat_net numeric(12,2) NOT NULL DEFAULT 0,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_months_month
  ON finance_months (month)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_finance_months_month
  ON finance_months (month DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE finance_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY finance_months_internal_only ON finance_months
  USING (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM finance_allowed_emails
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      SELECT email FROM finance_allowed_emails
    )
  );


-- ─── updated_at trigger ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION finance_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

DROP TRIGGER IF EXISTS finance_months_touch_updated_at ON finance_months;
CREATE TRIGGER finance_months_touch_updated_at
  BEFORE UPDATE ON finance_months
  FOR EACH ROW EXECUTE FUNCTION finance_touch_updated_at();
