alter table public.cases
  add column if not exists next_action_at timestamptz,
  add column if not exists waiting_on text not null default 'none',
  add column if not exists waiting_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cases_waiting_on_check'
  ) then
    alter table public.cases
      add constraint cases_waiting_on_check
      check (waiting_on in ('none', 'tenant', 'landlord', 'contractor', 'internal'));
  end if;
end $$;

create index if not exists cases_next_action_at_idx
  on public.cases (next_action_at)
  where next_action_at is not null;

create index if not exists cases_waiting_on_idx
  on public.cases (waiting_on);
