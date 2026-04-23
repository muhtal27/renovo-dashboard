-- Lead capture for the gated interactive demo at /demo.
-- One row per submission (a single lead may return multiple times).
-- Writes only via service-role client inside /api/demo-access; RLS blocks
-- anon and authenticated access entirely.

CREATE TABLE IF NOT EXISTS demo_access_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company text,
  first_name text,
  source_page text NOT NULL DEFAULT '/demo',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  -- SHA-256 of IP + server secret. Lets us spot repeat abuse without
  -- storing raw IPs alongside email (GDPR data-minimisation).
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_access_submissions_email
  ON demo_access_submissions (email);

CREATE INDEX IF NOT EXISTS idx_demo_access_submissions_created_at
  ON demo_access_submissions (created_at DESC);

ALTER TABLE demo_access_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY demo_access_submissions_service_only ON demo_access_submissions
  USING (false);
