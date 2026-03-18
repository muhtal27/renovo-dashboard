create table if not exists public.rent_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  entry_type text not null check (entry_type in ('charge', 'payment', 'credit', 'adjustment')),
  category text not null default 'rent' check (
    category in ('rent', 'deposit', 'fee', 'maintenance_recharge', 'deposit_claim', 'other')
  ),
  status text not null default 'open' check (status in ('open', 'cleared', 'void')),
  amount numeric(12, 2) not null check (amount >= 0),
  due_date date,
  period_start date,
  period_end date,
  posted_at timestamp with time zone not null default now(),
  reference text,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists rent_ledger_entries_tenancy_idx
  on public.rent_ledger_entries (tenancy_id, posted_at desc);

create index if not exists rent_ledger_entries_property_idx
  on public.rent_ledger_entries (property_id, posted_at desc);

create index if not exists rent_ledger_entries_status_due_idx
  on public.rent_ledger_entries (status, due_date);

create table if not exists public.lease_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  event_type text not null check (
    event_type in (
      'start',
      'renewal_review',
      'rent_review',
      'inspection',
      'notice_received',
      'notice_served',
      'move_out',
      'ended',
      'deposit_follow_up',
      'other'
    )
  ),
  status text not null default 'planned' check (status in ('planned', 'due', 'completed', 'cancelled')),
  scheduled_for date,
  completed_at timestamp with time zone,
  source text not null default 'manual' check (source in ('manual', 'system')),
  note text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists lease_lifecycle_events_tenancy_idx
  on public.lease_lifecycle_events (tenancy_id, scheduled_for desc, created_at desc);

create index if not exists lease_lifecycle_events_status_idx
  on public.lease_lifecycle_events (status, scheduled_for);

create or replace function public.sync_rent_ledger_entry_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  tenancy_record public.tenancies%rowtype;
begin
  select *
  into tenancy_record
  from public.tenancies
  where id = new.tenancy_id;

  if not found then
    raise exception 'Tenancy % was not found', new.tenancy_id;
  end if;

  if new.property_id is null then
    new.property_id := tenancy_record.property_id;
  end if;

  if new.contact_id is null then
    new.contact_id := tenancy_record.tenant_contact_id;
  end if;

  if new.entry_type in ('payment', 'credit') and new.status = 'open' then
    new.status := 'cleared';
  end if;

  return new;
end;
$$;

create or replace function public.sync_lease_lifecycle_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  tenancy_record public.tenancies%rowtype;
begin
  select *
  into tenancy_record
  from public.tenancies
  where id = new.tenancy_id;

  if not found then
    raise exception 'Tenancy % was not found', new.tenancy_id;
  end if;

  if new.property_id is null then
    new.property_id := tenancy_record.property_id;
  end if;

  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  if new.status = 'planned' and new.scheduled_for is not null and new.scheduled_for <= current_date then
    new.status := 'due';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rent_ledger_entries_sync_context on public.rent_ledger_entries;
create trigger trg_rent_ledger_entries_sync_context
before insert or update on public.rent_ledger_entries
for each row
execute function public.sync_rent_ledger_entry_context();

drop trigger if exists trg_rent_ledger_entries_set_updated_at on public.rent_ledger_entries;
create trigger trg_rent_ledger_entries_set_updated_at
before update on public.rent_ledger_entries
for each row
execute function public.set_updated_at();

drop trigger if exists trg_lease_lifecycle_events_sync_context on public.lease_lifecycle_events;
create trigger trg_lease_lifecycle_events_sync_context
before insert or update on public.lease_lifecycle_events
for each row
execute function public.sync_lease_lifecycle_context();

drop trigger if exists trg_lease_lifecycle_events_set_updated_at on public.lease_lifecycle_events;
create trigger trg_lease_lifecycle_events_set_updated_at
before update on public.lease_lifecycle_events
for each row
execute function public.set_updated_at();

alter table public.rent_ledger_entries enable row level security;
alter table public.lease_lifecycle_events enable row level security;

drop policy if exists rent_ledger_entries_operator_all on public.rent_ledger_entries;
create policy rent_ledger_entries_operator_all
  on public.rent_ledger_entries
  for all
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists lease_lifecycle_events_operator_all on public.lease_lifecycle_events;
create policy lease_lifecycle_events_operator_all
  on public.lease_lifecycle_events
  for all
  using (public.is_active_operator())
  with check (public.is_active_operator());

insert into public.lease_lifecycle_events (
  tenancy_id,
  property_id,
  event_type,
  status,
  scheduled_for,
  completed_at,
  source,
  note
)
select
  t.id,
  t.property_id,
  'start',
  'completed',
  t.start_date,
  coalesce(t.created_at, now()),
  'system',
  'Backfilled from tenancy start date'
from public.tenancies t
where t.start_date is not null
  and not exists (
    select 1
    from public.lease_lifecycle_events event_item
    where event_item.tenancy_id = t.id
      and event_item.event_type = 'start'
  );

insert into public.lease_lifecycle_events (
  tenancy_id,
  property_id,
  event_type,
  status,
  scheduled_for,
  source,
  note
)
select
  t.id,
  t.property_id,
  'renewal_review',
  case
    when (t.end_date - 60) <= current_date then 'due'
    else 'planned'
  end,
  (t.end_date - 60),
  'system',
  'Review renewal, notice, or move-out plan before tenancy end date'
from public.tenancies t
where t.end_date is not null
  and coalesce(t.tenancy_status, t.status, 'active') not in ('ended', 'terminated', 'cancelled', 'archived')
  and not exists (
    select 1
    from public.lease_lifecycle_events event_item
    where event_item.tenancy_id = t.id
      and event_item.event_type = 'renewal_review'
  );

insert into public.lease_lifecycle_events (
  tenancy_id,
  property_id,
  event_type,
  status,
  scheduled_for,
  completed_at,
  source,
  note
)
select
  t.id,
  t.property_id,
  'ended',
  'completed',
  t.end_date,
  now(),
  'system',
  'Backfilled from tenancy end date'
from public.tenancies t
where t.end_date is not null
  and coalesce(t.tenancy_status, t.status, '') in ('ended', 'terminated')
  and not exists (
    select 1
    from public.lease_lifecycle_events event_item
    where event_item.tenancy_id = t.id
      and event_item.event_type = 'ended'
  );
