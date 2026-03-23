-- Archive micro-stage for public.tags and public.case_tags.
-- DO NOT APPLY until manual review confirms the legacy tagging surface is unused.
--
-- This is intentionally non-destructive:
--   1. rename both tables to archived names
--   2. rename related constraints and indexes for clarity and future name reuse
--   3. revoke anon/authenticated access from the archived tables
--
-- Rollback:
--   rename archived tables back to tags / case_tags
--   restore original constraint/index names
--   restore grants to anon/authenticated if needed

begin;

alter table public.tags
  rename to _deprecated_20260324_tags;

alter table public._deprecated_20260324_tags
  rename constraint tags_pkey to _deprecated_20260324_tags_pkey;

alter table public._deprecated_20260324_tags
  rename constraint tags_name_key to _deprecated_20260324_tags_name_key;

alter table public.case_tags
  rename to _deprecated_20260324_case_tags;

alter table public._deprecated_20260324_case_tags
  rename constraint case_tags_pkey to _deprecated_20260324_case_tags_pkey;

alter table public._deprecated_20260324_case_tags
  rename constraint case_tags_case_id_tag_id_key to _deprecated_20260324_case_tags_case_id_tag_id_key;

alter table public._deprecated_20260324_case_tags
  rename constraint case_tags_case_id_fkey to _deprecated_20260324_case_tags_case_id_fkey;

alter table public._deprecated_20260324_case_tags
  rename constraint case_tags_tag_id_fkey to _deprecated_20260324_case_tags_tag_id_fkey;

alter index public.idx_case_tags_case_id
  rename to _deprecated_20260324_idx_case_tags_case_id;

alter index public.idx_case_tags_tag_id
  rename to _deprecated_20260324_idx_case_tags_tag_id;

revoke all on table public._deprecated_20260324_tags from anon, authenticated;
revoke all on table public._deprecated_20260324_case_tags from anon, authenticated;

commit;
