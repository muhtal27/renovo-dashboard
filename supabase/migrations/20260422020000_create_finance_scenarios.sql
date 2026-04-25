-- Renovo internal finance / planning scenarios.
-- Each scenario is a set of forward-looking assumptions (revenue growth,
-- churn, expense growth, fundraise). Exactly one can be active at a time;
-- the dashboard projects runway for the active scenario from the latest
-- actual month forward.

CREATE TABLE IF NOT EXISTS finance_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,

  -- Monthly revenue assumptions
  new_mrr_monthly numeric(12,2) NOT NULL DEFAULT 0,
  gross_churn_pct numeric(5,3) NOT NULL DEFAULT 0,

  -- Monthly expense growth rate (applied to prior-month expenses)
  expense_growth_pct numeric(5,3) NOT NULL DEFAULT 0,

  -- Optional lump-sum inflow
  fundraise_amount numeric(12,2),
  fundraise_close_date date,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz
);

-- At most one active scenario at a time (partial unique index trick).
CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_scenarios_one_active
  ON finance_scenarios ((1))
  WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_finance_scenarios_name
  ON finance_scenarios (name)
  WHERE deleted_at IS NULL;

ALTER TABLE finance_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY finance_scenarios_internal_only ON finance_scenarios
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

DROP TRIGGER IF EXISTS finance_scenarios_touch_updated_at ON finance_scenarios;
CREATE TRIGGER finance_scenarios_touch_updated_at
  BEFORE UPDATE ON finance_scenarios
  FOR EACH ROW EXECUTE FUNCTION finance_touch_updated_at();

-- Seed a single Base scenario if the table is empty, so the dashboard
-- has an active scenario out of the box. Zero assumptions = flat projection.
INSERT INTO finance_scenarios (name, is_active, notes)
SELECT 'Base', true, 'Conservative baseline — no growth, no churn, no fundraise. Edit to reflect your actual plan.'
WHERE NOT EXISTS (SELECT 1 FROM finance_scenarios WHERE deleted_at IS NULL);
