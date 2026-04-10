-- Indexes for query paths identified in the application code.
-- All use CREATE INDEX IF NOT EXISTS so this migration is safe to re-run.

-- tenant_memberships: filtered by (tenant_id, user_id) with soft-delete check
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant_user_deleted
  ON tenant_memberships (tenant_id, user_id, deleted_at);

-- inbound_email_configs: webhook handler looks up by (address_prefix, is_active)
CREATE INDEX IF NOT EXISTS idx_inbound_email_configs_prefix_active
  ON inbound_email_configs (address_prefix, is_active);

-- inbound_unmatched_queue: operator UI filters by (tenant_id, resolved)
CREATE INDEX IF NOT EXISTS idx_inbound_unmatched_queue_tenant_resolved
  ON inbound_unmatched_queue (tenant_id, resolved);

-- cases: most case queries filter by (tenant_id) with soft-delete
CREATE INDEX IF NOT EXISTS idx_cases_tenant_deleted
  ON cases (tenant_id, deleted_at);

-- checkout_defects: batch updates filter by (case_id, tenant_id)
CREATE INDEX IF NOT EXISTS idx_checkout_defects_case_tenant
  ON checkout_defects (case_id, tenant_id);
