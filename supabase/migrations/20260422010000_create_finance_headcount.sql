-- Renovo internal finance / headcount plan.
-- One row per person (employee or contractor) with loaded monthly cost.
-- Payroll total for a given month = sum of loaded cost across anyone
-- active in that month. Kept separate from finance_months so the plan
-- can be edited independently of historical actuals.

CREATE TABLE IF NOT EXISTS finance_headcount (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,

  start_date date NOT NULL,
  end_date date,  -- NULL = indefinite

  gross_monthly_gbp numeric(12,2) NOT NULL DEFAULT 0,

  -- UK defaults: 13.8% employer NI, 3% minimum auto-enrolment employer pension
  employer_ni_pct numeric(5,3) NOT NULL DEFAULT 13.800,
  pension_pct numeric(5,3) NOT NULL DEFAULT 3.000,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_finance_headcount_active
  ON finance_headcount (start_date, end_date)
  WHERE deleted_at IS NULL;

ALTER TABLE finance_headcount ENABLE ROW LEVEL SECURITY;

CREATE POLICY finance_headcount_internal_only ON finance_headcount
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

-- Reuse the pinned-search_path updated_at trigger function.
DROP TRIGGER IF EXISTS finance_headcount_touch_updated_at ON finance_headcount;
CREATE TRIGGER finance_headcount_touch_updated_at
  BEFORE UPDATE ON finance_headcount
  FOR EACH ROW EXECUTE FUNCTION finance_touch_updated_at();
