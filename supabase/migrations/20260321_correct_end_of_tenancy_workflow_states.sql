do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'end_of_tenancy_cases_workflow_status_check'
  ) then
    alter table public.end_of_tenancy_cases
      drop constraint end_of_tenancy_cases_workflow_status_check;
  end if;
end $$;

alter table public.end_of_tenancy_cases
  add constraint end_of_tenancy_cases_workflow_status_check
  check (
    workflow_status in (
      'evidence_pending',
      'evidence_ready',
      'review_pending',
      'recommendation_drafted',
      'recommendation_approved',
      'ready_for_claim',
      'needs_manual_review',
      'closed'
    )
  );
