-- AI recommendation records for EOT defect/issue analysis.
-- Stores model output with confidence, reasoning, and operator override tracking.

CREATE TABLE IF NOT EXISTS eot_ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  defect_id uuid REFERENCES checkout_defects(id) ON DELETE SET NULL,
  issue_id uuid REFERENCES issues(id) ON DELETE SET NULL,
  recommendation_type text NOT NULL CHECK (recommendation_type IN (
    'liability', 'charge', 'no_charge', 'partial'
  )),
  confidence numeric(5,2) NOT NULL DEFAULT 0,
  reasoning text NOT NULL DEFAULT '',
  model_id text NOT NULL DEFAULT 'gpt-4o',
  model_version text NOT NULL DEFAULT '2024-08-06',
  generated_at timestamptz NOT NULL DEFAULT now(),

  -- Operator override tracking
  operator_override text CHECK (operator_override IN ('tenant', 'landlord', 'shared') OR operator_override IS NULL),
  operator_override_reason text,
  operator_override_at timestamptz,
  operator_override_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Final outcome after review
  final_outcome text CHECK (final_outcome IN ('tenant', 'landlord', 'shared') OR final_outcome IS NULL),
  final_outcome_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_eot_ai_recs_case
  ON eot_ai_recommendations (case_id, tenant_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eot_ai_recs_defect
  ON eot_ai_recommendations (defect_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eot_ai_recs_issue
  ON eot_ai_recommendations (issue_id)
  WHERE deleted_at IS NULL;

ALTER TABLE eot_ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY eot_ai_recs_tenant_isolation ON eot_ai_recommendations
  USING (tenant_id = auth.uid()::uuid OR tenant_id IN (
    SELECT tenant_id FROM tenant_memberships
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  ));


-- Workflow step state for the 7-step EOT workspace.
-- Tracks which step is active and which steps have been completed.

CREATE TABLE IF NOT EXISTS eot_workflow_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  active_step text NOT NULL DEFAULT 'inventory' CHECK (active_step IN (
    'inventory', 'readings', 'analysis', 'review',
    'deductions', 'negotiation', 'refund'
  )),
  completed_steps jsonb NOT NULL DEFAULT '[]',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- One active workflow row per case
CREATE UNIQUE INDEX IF NOT EXISTS uq_eot_workflow_case_active
  ON eot_workflow_status (case_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_eot_workflow_tenant_case
  ON eot_workflow_status (tenant_id, case_id);

ALTER TABLE eot_workflow_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY eot_workflow_tenant_isolation ON eot_workflow_status
  USING (tenant_id = auth.uid()::uuid OR tenant_id IN (
    SELECT tenant_id FROM tenant_memberships
    WHERE user_id = auth.uid() AND deleted_at IS NULL
  ));

-- Add excluded column to checkout_defects if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkout_defects' AND column_name = 'excluded'
  ) THEN
    ALTER TABLE checkout_defects ADD COLUMN excluded boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add evidence_quality column to checkout_defects if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkout_defects' AND column_name = 'evidence_quality'
  ) THEN
    ALTER TABLE checkout_defects ADD COLUMN evidence_quality text CHECK (
      evidence_quality IN ('good', 'fair', 'poor') OR evidence_quality IS NULL
    );
  END IF;
END $$;

-- Add expected_lifespan / age_at_checkout to checkout_defects if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkout_defects' AND column_name = 'expected_lifespan'
  ) THEN
    ALTER TABLE checkout_defects ADD COLUMN expected_lifespan numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checkout_defects' AND column_name = 'age_at_checkout'
  ) THEN
    ALTER TABLE checkout_defects ADD COLUMN age_at_checkout numeric;
  END IF;
END $$;

-- Add negotiation items table for line-item tracking
CREATE TABLE IF NOT EXISTS checkout_negotiation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES checkout_cases(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  proposed_amount numeric(10,2) NOT NULL DEFAULT 0,
  responded_amount numeric(10,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'disputed', 'agreed')),
  tenant_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_checkout_neg_items_case
  ON checkout_negotiation_items (case_id)
  WHERE deleted_at IS NULL;
