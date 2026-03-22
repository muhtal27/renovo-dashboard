create table if not exists public.move_out_trackers (
  id uuid primary key default gen_random_uuid(),
  tenancy_id uuid not null references public.tenancies(id) on delete cascade,
  case_id uuid not null unique references public.cases(id) on delete cascade,
  end_of_tenancy_case_id uuid not null unique references public.end_of_tenancy_cases(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  tenant_contact_id uuid references public.contacts(id) on delete set null,
  landlord_contact_id uuid references public.contacts(id) on delete set null,
  current_stage text not null default 'notice_received' check (
    current_stage in (
      'notice_received',
      'move_out_date_confirmed',
      'handover_items_in_progress',
      'checkout_review_in_progress',
      'claim_settlement_being_prepared',
      'completed'
    )
  ),
  public_status text not null default 'waiting' check (
    public_status in ('not_started', 'in_progress', 'waiting', 'blocked', 'completed')
  ),
  next_action_title text,
  next_action_detail text,
  started_at timestamp with time zone not null default now(),
  last_event_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists move_out_trackers_tenancy_idx
  on public.move_out_trackers (tenancy_id, updated_at desc);

create index if not exists move_out_trackers_property_idx
  on public.move_out_trackers (property_id, updated_at desc)
  where property_id is not null;

create index if not exists move_out_trackers_stage_idx
  on public.move_out_trackers (current_stage, public_status, updated_at desc);

create index if not exists move_out_trackers_tenant_contact_idx
  on public.move_out_trackers (tenant_contact_id, updated_at desc)
  where tenant_contact_id is not null;

create index if not exists move_out_trackers_landlord_contact_idx
  on public.move_out_trackers (landlord_contact_id, updated_at desc)
  where landlord_contact_id is not null;

create table if not exists public.move_out_checklist_items (
  id uuid primary key default gen_random_uuid(),
  move_out_tracker_id uuid not null references public.move_out_trackers(id) on delete cascade,
  item_key text not null check (
    item_key in (
      'keys',
      'parking_permits',
      'utility_readings',
      'council_tax',
      'forwarding_address',
      'checkout_evidence',
      'ai_review',
      'claim_readiness'
    )
  ),
  audience text not null default 'operator' check (audience in ('operator', 'shared')),
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'waiting', 'blocked', 'complete')
  ),
  is_required boolean not null default true,
  notes text,
  completed_at timestamp with time zone,
  completed_by_user_id uuid references public.users_profiles(id) on delete set null,
  source_table text,
  source_record_id text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (move_out_tracker_id, item_key)
);

create index if not exists move_out_checklist_items_tracker_idx
  on public.move_out_checklist_items (move_out_tracker_id, status, item_key);

create index if not exists move_out_checklist_items_source_idx
  on public.move_out_checklist_items (source_table, source_record_id)
  where source_table is not null and source_record_id is not null;

create table if not exists public.move_out_tracker_events (
  id uuid primary key default gen_random_uuid(),
  move_out_tracker_id uuid not null references public.move_out_trackers(id) on delete cascade,
  actor_user_id uuid references public.users_profiles(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('system', 'user', 'tenant', 'landlord', 'ai')),
  source_table text,
  source_record_id text,
  event_type text not null check (
    event_type in (
      'tracker_created',
      'lifecycle_event_synced',
      'stage_changed',
      'checklist_updated',
      'evidence_attached',
      'extraction_stored',
      'issue_created',
      'issue_updated',
      'recommendation_drafted',
      'ai_draft_generated',
      'review_submitted',
      'recommendation_approved',
      'recommendation_rejected',
      'manual_review_requested',
      'line_items_created',
      'claim_ready',
      'completed',
      'other'
    )
  ),
  title text not null,
  detail text,
  metadata jsonb not null default '{}'::jsonb,
  is_portal_visible boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create index if not exists move_out_tracker_events_tracker_idx
  on public.move_out_tracker_events (move_out_tracker_id, created_at desc);

create index if not exists move_out_tracker_events_portal_idx
  on public.move_out_tracker_events (move_out_tracker_id, created_at desc)
  where is_portal_visible = true;

create unique index if not exists move_out_tracker_events_source_unique_idx
  on public.move_out_tracker_events (source_table, source_record_id, event_type)
  where source_table is not null and source_record_id is not null;

create or replace function public.move_out_stage_rank(p_stage text)
returns integer
language sql
immutable
as $$
  select case p_stage
    when 'notice_received' then 0
    when 'move_out_date_confirmed' then 1
    when 'handover_items_in_progress' then 2
    when 'checkout_review_in_progress' then 3
    when 'claim_settlement_being_prepared' then 4
    when 'completed' then 5
    else 0
  end;
$$;

create or replace function public.sync_move_out_tracker_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  tenancy_record public.tenancies%rowtype;
  end_of_tenancy_record public.end_of_tenancy_cases%rowtype;
begin
  select *
  into tenancy_record
  from public.tenancies
  where id = new.tenancy_id;

  if not found then
    raise exception 'Tenancy % was not found', new.tenancy_id;
  end if;

  select *
  into end_of_tenancy_record
  from public.end_of_tenancy_cases
  where id = new.end_of_tenancy_case_id;

  if not found then
    raise exception 'End-of-tenancy case % was not found', new.end_of_tenancy_case_id;
  end if;

  new.case_id := coalesce(new.case_id, end_of_tenancy_record.case_id);
  new.property_id := coalesce(new.property_id, tenancy_record.property_id);
  new.tenant_contact_id := coalesce(new.tenant_contact_id, tenancy_record.tenant_contact_id);
  new.landlord_contact_id := coalesce(new.landlord_contact_id, tenancy_record.landlord_contact_id);

  if new.current_stage = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.current_stage <> 'completed' then
    new.completed_at := null;
  end if;

  if new.public_status = 'completed' and new.current_stage <> 'completed' then
    new.current_stage := 'completed';
  end if;

  return new;
end;
$$;

create or replace function public.seed_move_out_tracker_checklist_items()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.move_out_checklist_items (
    move_out_tracker_id,
    item_key,
    audience,
    status
  )
  values
    (new.id, 'keys', 'shared', 'not_started'),
    (new.id, 'parking_permits', 'shared', 'not_started'),
    (new.id, 'utility_readings', 'shared', 'not_started'),
    (new.id, 'council_tax', 'shared', 'not_started'),
    (new.id, 'forwarding_address', 'shared', 'not_started'),
    (new.id, 'checkout_evidence', 'operator', 'not_started'),
    (new.id, 'ai_review', 'operator', 'not_started'),
    (new.id, 'claim_readiness', 'operator', 'not_started')
  on conflict (move_out_tracker_id, item_key) do nothing;

  insert into public.move_out_tracker_events (
    move_out_tracker_id,
    actor_type,
    event_type,
    title,
    detail,
    is_portal_visible
  )
  values (
    new.id,
    'system',
    'tracker_created',
    'Move-out journey opened',
    'A shared tracker is now live for the move-out journey.',
    true
  );

  return new;
end;
$$;

create or replace function public.sync_move_out_checklist_item_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'complete' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'complete' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create or replace function public.ensure_move_out_tracker_for_end_of_tenancy_case(
  p_end_of_tenancy_case_id uuid
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_end_of_tenancy_case public.end_of_tenancy_cases%rowtype;
  v_tenancy public.tenancies%rowtype;
  v_tracker_id uuid;
  v_default_stage text;
begin
  select *
  into v_end_of_tenancy_case
  from public.end_of_tenancy_cases
  where id = p_end_of_tenancy_case_id;

  if not found then
    raise exception 'End-of-tenancy case % was not found', p_end_of_tenancy_case_id;
  end if;

  select *
  into v_tenancy
  from public.tenancies
  where id = v_end_of_tenancy_case.tenancy_id;

  if not found then
    raise exception 'Tenancy % was not found', v_end_of_tenancy_case.tenancy_id;
  end if;

  v_default_stage := case
    when v_end_of_tenancy_case.move_out_date is not null then 'move_out_date_confirmed'
    else 'notice_received'
  end;

  insert into public.move_out_trackers (
    tenancy_id,
    case_id,
    end_of_tenancy_case_id,
    property_id,
    tenant_contact_id,
    landlord_contact_id,
    current_stage,
    public_status,
    next_action_title,
    next_action_detail,
    started_at,
    last_event_at
  )
  values (
    v_end_of_tenancy_case.tenancy_id,
    v_end_of_tenancy_case.case_id,
    v_end_of_tenancy_case.id,
    v_tenancy.property_id,
    v_tenancy.tenant_contact_id,
    v_tenancy.landlord_contact_id,
    v_default_stage,
    case when v_end_of_tenancy_case.move_out_date is not null then 'in_progress' else 'waiting' end,
    case
      when v_end_of_tenancy_case.move_out_date is not null then 'Work through handover items'
      else 'Confirm the move-out date'
    end,
    case
      when v_end_of_tenancy_case.move_out_date is not null then 'Keys, permits, utility readings, and forwarding details should be confirmed next.'
      else 'A notice or move-out instruction exists, but the move-out date still needs to be confirmed.'
    end,
    now(),
    now()
  )
  on conflict (end_of_tenancy_case_id) do update
  set
    tenancy_id = excluded.tenancy_id,
    case_id = excluded.case_id,
    property_id = excluded.property_id,
    tenant_contact_id = excluded.tenant_contact_id,
    landlord_contact_id = excluded.landlord_contact_id,
    current_stage = case
      when public.move_out_stage_rank(public.move_out_trackers.current_stage) > public.move_out_stage_rank(excluded.current_stage)
        then public.move_out_trackers.current_stage
      else excluded.current_stage
    end,
    public_status = case
      when public.move_out_trackers.public_status in ('blocked', 'completed')
        then public.move_out_trackers.public_status
      else excluded.public_status
    end,
    next_action_title = coalesce(public.move_out_trackers.next_action_title, excluded.next_action_title),
    next_action_detail = coalesce(public.move_out_trackers.next_action_detail, excluded.next_action_detail),
    updated_at = now(),
    last_event_at = greatest(public.move_out_trackers.last_event_at, now())
  returning id into v_tracker_id;

  return v_tracker_id;
end;
$$;

create or replace function public.ensure_move_out_tracker_after_end_of_tenancy_case()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.ensure_move_out_tracker_for_end_of_tenancy_case(new.id);
  return new;
end;
$$;

create or replace function public.ensure_move_out_tracker_for_lifecycle_event(
  p_lifecycle_event_id uuid
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_event public.lease_lifecycle_events%rowtype;
  v_tenancy public.tenancies%rowtype;
  v_case_id uuid;
  v_end_of_tenancy_case_id uuid;
  v_tracker_id uuid;
  v_target_stage text;
begin
  select *
  into v_event
  from public.lease_lifecycle_events
  where id = p_lifecycle_event_id
    and event_type in ('notice_received', 'notice_served', 'move_out')
    and status <> 'cancelled';

  if not found then
    return null;
  end if;

  select *
  into v_tenancy
  from public.tenancies
  where id = v_event.tenancy_id;

  if not found then
    return null;
  end if;

  v_case_id := v_event.case_id;

  if v_case_id is not null then
    select id
    into v_end_of_tenancy_case_id
    from public.end_of_tenancy_cases
    where case_id = v_case_id
    limit 1;
  end if;

  if v_end_of_tenancy_case_id is null then
    select eot.case_id, eot.id
    into v_case_id, v_end_of_tenancy_case_id
    from public.end_of_tenancy_cases eot
    where eot.tenancy_id = v_event.tenancy_id
    order by eot.created_at desc
    limit 1;
  end if;

  if v_case_id is null then
    insert into public.cases (
      contact_id,
      property_id,
      tenancy_id,
      case_type,
      priority,
      status,
      source_channel,
      summary,
      created_at
    )
    values (
      coalesce(v_tenancy.tenant_contact_id, v_tenancy.landlord_contact_id),
      v_tenancy.property_id,
      v_tenancy.id,
      'tenancy_admin',
      'medium',
      'open',
      'internal',
      case
        when v_event.event_type = 'move_out' then 'Move-out journey opened'
        else 'Move-out notice received'
      end,
      now()
    )
    returning id into v_case_id;
  end if;

  if v_end_of_tenancy_case_id is null then
    insert into public.end_of_tenancy_cases (
      case_id,
      tenancy_id,
      move_out_date,
      workflow_status
    )
    values (
      v_case_id,
      v_tenancy.id,
      case when v_event.event_type = 'move_out' then v_event.scheduled_for else null end,
      'evidence_pending'
    )
    on conflict (case_id) do update
    set
      move_out_date = coalesce(excluded.move_out_date, public.end_of_tenancy_cases.move_out_date),
      updated_at = now()
    returning id into v_end_of_tenancy_case_id;
  end if;

  v_tracker_id := public.ensure_move_out_tracker_for_end_of_tenancy_case(v_end_of_tenancy_case_id);

  v_target_stage := case
    when v_event.event_type = 'move_out' and v_event.scheduled_for is not null then 'move_out_date_confirmed'
    else 'notice_received'
  end;

  update public.move_out_trackers
  set
    current_stage = case
      when public.move_out_stage_rank(current_stage) > public.move_out_stage_rank(v_target_stage)
        then current_stage
      else v_target_stage
    end,
    public_status = case
      when public_status = 'completed' then public_status
      when v_event.event_type = 'move_out' and v_event.scheduled_for is not null then 'in_progress'
      else 'waiting'
    end,
    next_action_title = case
      when v_event.event_type = 'move_out' and v_event.scheduled_for is not null then 'Work through handover items'
      else 'Confirm the move-out date'
    end,
    next_action_detail = coalesce(
      v_event.note,
      case
        when v_event.event_type = 'move_out' and v_event.scheduled_for is not null then
          'Shared handover items should now be confirmed before checkout review starts.'
        else
          'The team has recorded notice. Confirm the move-out date and handover plan next.'
      end
    ),
    last_event_at = now(),
    updated_at = now()
  where id = v_tracker_id;

  insert into public.move_out_tracker_events (
    move_out_tracker_id,
    actor_type,
    source_table,
    source_record_id,
    event_type,
    title,
    detail,
    metadata,
    is_portal_visible
  )
  values (
    v_tracker_id,
    'system',
    'lease_lifecycle_events',
    p_lifecycle_event_id::text,
    'lifecycle_event_synced',
    case
      when v_event.event_type = 'move_out' then 'Move-out date recorded'
      when v_event.event_type = 'notice_served' then 'Move-out instruction recorded'
      else 'Notice received'
    end,
    coalesce(v_event.note, 'The move-out journey was updated from a lifecycle event.'),
    jsonb_build_object(
      'event_type', v_event.event_type,
      'status', v_event.status,
      'scheduled_for', v_event.scheduled_for
    ),
    true
  )
  on conflict (source_table, source_record_id, event_type)
    where source_table is not null and source_record_id is not null
    do nothing;

  return v_tracker_id;
end;
$$;

create or replace function public.ensure_move_out_tracker_after_lifecycle_event()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.ensure_move_out_tracker_for_lifecycle_event(new.id);
  return new;
end;
$$;

drop trigger if exists trg_move_out_trackers_sync_context on public.move_out_trackers;
create trigger trg_move_out_trackers_sync_context
before insert or update on public.move_out_trackers
for each row
execute function public.sync_move_out_tracker_context();

drop trigger if exists trg_move_out_trackers_seed_checklist on public.move_out_trackers;
create trigger trg_move_out_trackers_seed_checklist
after insert on public.move_out_trackers
for each row
execute function public.seed_move_out_tracker_checklist_items();

drop trigger if exists trg_move_out_trackers_set_updated_at on public.move_out_trackers;
create trigger trg_move_out_trackers_set_updated_at
before update on public.move_out_trackers
for each row
execute function public.set_updated_at();

drop trigger if exists trg_move_out_checklist_items_sync_status on public.move_out_checklist_items;
create trigger trg_move_out_checklist_items_sync_status
before insert or update on public.move_out_checklist_items
for each row
execute function public.sync_move_out_checklist_item_status();

drop trigger if exists trg_move_out_checklist_items_set_updated_at on public.move_out_checklist_items;
create trigger trg_move_out_checklist_items_set_updated_at
before update on public.move_out_checklist_items
for each row
execute function public.set_updated_at();

drop trigger if exists trg_end_of_tenancy_cases_ensure_move_out_tracker on public.end_of_tenancy_cases;
create trigger trg_end_of_tenancy_cases_ensure_move_out_tracker
after insert or update on public.end_of_tenancy_cases
for each row
execute function public.ensure_move_out_tracker_after_end_of_tenancy_case();

drop trigger if exists trg_lease_lifecycle_events_ensure_move_out_tracker on public.lease_lifecycle_events;
create trigger trg_lease_lifecycle_events_ensure_move_out_tracker
after insert or update on public.lease_lifecycle_events
for each row
when (new.event_type in ('notice_received', 'notice_served', 'move_out') and new.status <> 'cancelled')
execute function public.ensure_move_out_tracker_after_lifecycle_event();

insert into public.move_out_trackers (
  tenancy_id,
  case_id,
  end_of_tenancy_case_id,
  property_id,
  tenant_contact_id,
  landlord_contact_id,
  current_stage,
  public_status,
  next_action_title,
  next_action_detail
)
select
  eot.tenancy_id,
  eot.case_id,
  eot.id,
  t.property_id,
  t.tenant_contact_id,
  t.landlord_contact_id,
  case
    when eot.move_out_date is not null then 'move_out_date_confirmed'
    else 'notice_received'
  end,
  case
    when eot.move_out_date is not null then 'in_progress'
    else 'waiting'
  end,
  case
    when eot.move_out_date is not null then 'Work through handover items'
    else 'Confirm the move-out date'
  end,
  case
    when eot.move_out_date is not null then 'Shared handover items should now be confirmed before checkout review starts.'
    else 'A notice or move-out instruction exists, but the move-out date still needs to be confirmed.'
  end
from public.end_of_tenancy_cases eot
join public.tenancies t
  on t.id = eot.tenancy_id
on conflict (end_of_tenancy_case_id) do nothing;

alter table public.move_out_trackers enable row level security;
alter table public.move_out_checklist_items enable row level security;
alter table public.move_out_tracker_events enable row level security;

drop policy if exists move_out_trackers_operator_all on public.move_out_trackers;
create policy move_out_trackers_operator_all
  on public.move_out_trackers
  for all
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists move_out_trackers_portal_select on public.move_out_trackers;
create policy move_out_trackers_portal_select
  on public.move_out_trackers
  for select
  to authenticated
  using (
    tenant_contact_id = public.current_portal_contact_id('tenant')
    or (property_id is not null and public.portal_can_read_property(property_id))
    or (case_id is not null and public.portal_can_read_case(case_id))
  );

drop policy if exists move_out_checklist_items_operator_all on public.move_out_checklist_items;
create policy move_out_checklist_items_operator_all
  on public.move_out_checklist_items
  for all
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists move_out_tracker_events_operator_all on public.move_out_tracker_events;
create policy move_out_tracker_events_operator_all
  on public.move_out_tracker_events
  for all
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists move_out_tracker_events_portal_select on public.move_out_tracker_events;
create policy move_out_tracker_events_portal_select
  on public.move_out_tracker_events
  for select
  to authenticated
  using (
    is_portal_visible = true
    and move_out_tracker_id in (
      select mot.id
      from public.move_out_trackers mot
      where
        mot.tenant_contact_id = public.current_portal_contact_id('tenant')
        or (mot.property_id is not null and public.portal_can_read_property(mot.property_id))
        or (mot.case_id is not null and public.portal_can_read_case(mot.case_id))
    )
  );
