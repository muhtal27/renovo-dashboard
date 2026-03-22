-- Stage A: remove only the object proven unused by the live EOT product.
-- Safe scope in this pass:
--   1. legacy operator view `public.v_cases_list`
--
-- Notes:
-- - No tables are dropped in Stage A.
-- - No functions are dropped in Stage A.
-- - No portal, message, call, rent, or lease-lifecycle objects are touched here.
-- - `public.log_case_status_change()` was explicitly excluded after live verification
--   found trigger `trg_cases_log_status_change` on `public.cases`.

begin;

drop view if exists public.v_cases_list;

commit;
