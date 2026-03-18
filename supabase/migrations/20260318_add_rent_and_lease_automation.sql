alter table public.rent_ledger_entries
  add column if not exists automation_source text,
  add column if not exists automation_key text;

alter table public.lease_lifecycle_events
  add column if not exists automation_source text,
  add column if not exists automation_key text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rent_ledger_entries_automation_key_key'
      and conrelid = 'public.rent_ledger_entries'::regclass
  ) then
    alter table public.rent_ledger_entries
      add constraint rent_ledger_entries_automation_key_key unique (automation_key);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lease_lifecycle_events_automation_key_key'
      and conrelid = 'public.lease_lifecycle_events'::regclass
  ) then
    alter table public.lease_lifecycle_events
      add constraint lease_lifecycle_events_automation_key_key unique (automation_key);
  end if;
end;
$$;

update public.lease_lifecycle_events event_item
set
  automation_source = 'lease_lifecycle',
  automation_key = 'lease:' || event_item.event_type || ':' || event_item.tenancy_id::text
where event_item.source = 'system'
  and event_item.event_type in ('start', 'renewal_review', 'ended')
  and event_item.automation_key is null;

create or replace function public.rent_due_date_for_month(
  p_month_start date,
  p_reference_date date default null
)
returns date
language sql
immutable
as $$
  select make_date(
    extract(year from p_month_start)::int,
    extract(month from p_month_start)::int,
    least(
      coalesce(extract(day from p_reference_date)::int, 1),
      extract(day from ((date_trunc('month', p_month_start) + interval '1 month - 1 day')::date))::int
    )
  );
$$;

create or replace function public.ensure_monthly_rent_charges(
  p_target_month date default (date_trunc('month', current_date)::date)
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_month_start date := date_trunc('month', coalesce(p_target_month, current_date))::date;
  v_month_end date := (date_trunc('month', coalesce(p_target_month, current_date)) + interval '1 month - 1 day')::date;
  v_inserted integer := 0;
begin
  insert into public.rent_ledger_entries (
    tenancy_id,
    property_id,
    contact_id,
    entry_type,
    category,
    status,
    amount,
    due_date,
    period_start,
    period_end,
    reference,
    notes,
    posted_at,
    automation_source,
    automation_key
  )
  select
    t.id,
    t.property_id,
    t.tenant_contact_id,
    'charge',
    'rent',
    'open',
    t.rent_amount,
    public.rent_due_date_for_month(v_month_start, t.start_date),
    greatest(v_month_start, coalesce(t.start_date, v_month_start)),
    least(v_month_end, coalesce(t.end_date, v_month_end)),
    'RENT-' || to_char(v_month_start, 'YYYY-MM'),
    case
      when greatest(v_month_start, coalesce(t.start_date, v_month_start)) = v_month_start
       and least(v_month_end, coalesce(t.end_date, v_month_end)) = v_month_end
        then 'Automated monthly rent charge'
      else 'Automated rent charge for tenancy overlap period'
    end,
    now(),
    'rent_schedule',
    'rent:monthly:' || t.id::text || ':' || to_char(v_month_start, 'YYYY-MM')
  from public.tenancies t
  where coalesce(t.tenancy_status, t.status, 'active') not in ('ended', 'terminated', 'cancelled', 'archived')
    and coalesce(t.rent_amount, 0) > 0
    and coalesce(t.start_date, v_month_start) <= v_month_end
    and coalesce(t.end_date, v_month_end) >= v_month_start
  on conflict (automation_key) do nothing;

  get diagnostics v_inserted = row_count;

  return v_inserted;
end;
$$;

create or replace function public.refresh_lease_lifecycle_events(
  p_target_date date default current_date
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_target_date date := coalesce(p_target_date, current_date);
  v_touched integer := 0;
  v_step_count integer := 0;
begin
  insert into public.lease_lifecycle_events (
    tenancy_id,
    property_id,
    event_type,
    status,
    scheduled_for,
    completed_at,
    source,
    note,
    automation_source,
    automation_key
  )
  select
    t.id,
    t.property_id,
    'start',
    'completed',
    t.start_date,
    coalesce(t.start_date::timestamp with time zone, now()),
    'system',
    'Automated from tenancy start date',
    'lease_lifecycle',
    'lease:start:' || t.id::text
  from public.tenancies t
  where t.start_date is not null
  on conflict (automation_key) do update
  set
    property_id = excluded.property_id,
    status = excluded.status,
    scheduled_for = excluded.scheduled_for,
    completed_at = excluded.completed_at,
    source = excluded.source,
    note = excluded.note,
    automation_source = excluded.automation_source,
    updated_at = now();

  get diagnostics v_step_count = row_count;
  v_touched := v_touched + v_step_count;

  insert into public.lease_lifecycle_events (
    tenancy_id,
    property_id,
    event_type,
    status,
    scheduled_for,
    completed_at,
    source,
    note,
    automation_source,
    automation_key
  )
  select
    t.id,
    t.property_id,
    'renewal_review',
    'planned',
    (t.end_date - 60),
    null,
    'system',
    'Review renewal, notice, or move-out plan before tenancy end date',
    'lease_lifecycle',
    'lease:renewal_review:' || t.id::text
  from public.tenancies t
  where t.end_date is not null
    and coalesce(t.tenancy_status, t.status, 'active') not in ('ended', 'terminated', 'cancelled', 'archived')
  on conflict (automation_key) do update
  set
    property_id = excluded.property_id,
    status = excluded.status,
    scheduled_for = excluded.scheduled_for,
    completed_at = null,
    source = excluded.source,
    note = excluded.note,
    automation_source = excluded.automation_source,
    updated_at = now();

  get diagnostics v_step_count = row_count;
  v_touched := v_touched + v_step_count;

  insert into public.lease_lifecycle_events (
    tenancy_id,
    property_id,
    event_type,
    status,
    scheduled_for,
    completed_at,
    source,
    note,
    automation_source,
    automation_key
  )
  select
    t.id,
    t.property_id,
    'move_out',
    case
      when coalesce(t.tenancy_status, t.status, 'active') in ('ended', 'terminated') then 'completed'
      else 'planned'
    end,
    t.end_date,
    case
      when coalesce(t.tenancy_status, t.status, 'active') in ('ended', 'terminated') then coalesce(t.end_date::timestamp with time zone, now())
      else null
    end,
    'system',
    'Coordinate move-out, checkout, keys, and final meter readings',
    'lease_lifecycle',
    'lease:move_out:' || t.id::text
  from public.tenancies t
  where t.end_date is not null
  on conflict (automation_key) do update
  set
    property_id = excluded.property_id,
    status = excluded.status,
    scheduled_for = excluded.scheduled_for,
    completed_at = excluded.completed_at,
    source = excluded.source,
    note = excluded.note,
    automation_source = excluded.automation_source,
    updated_at = now();

  get diagnostics v_step_count = row_count;
  v_touched := v_touched + v_step_count;

  insert into public.lease_lifecycle_events (
    tenancy_id,
    property_id,
    event_type,
    status,
    scheduled_for,
    completed_at,
    source,
    note,
    automation_source,
    automation_key
  )
  select
    t.id,
    t.property_id,
    'ended',
    'completed',
    t.end_date,
    coalesce(t.end_date::timestamp with time zone, now()),
    'system',
    'Automated from ended tenancy status',
    'lease_lifecycle',
    'lease:ended:' || t.id::text
  from public.tenancies t
  where t.end_date is not null
    and coalesce(t.tenancy_status, t.status, '') in ('ended', 'terminated')
  on conflict (automation_key) do update
  set
    property_id = excluded.property_id,
    status = excluded.status,
    scheduled_for = excluded.scheduled_for,
    completed_at = excluded.completed_at,
    source = excluded.source,
    note = excluded.note,
    automation_source = excluded.automation_source,
    updated_at = now();

  get diagnostics v_step_count = row_count;
  v_touched := v_touched + v_step_count;

  insert into public.lease_lifecycle_events (
    tenancy_id,
    property_id,
    event_type,
    status,
    scheduled_for,
    completed_at,
    source,
    note,
    automation_source,
    automation_key
  )
  select
    t.id,
    t.property_id,
    'deposit_follow_up',
    'planned',
    (t.end_date + 14),
    null,
    'system',
    'Chase deposit release, deductions, and dispute evidence after tenancy end',
    'lease_lifecycle',
    'lease:deposit_follow_up:' || t.id::text
  from public.tenancies t
  where t.end_date is not null
    and coalesce(t.deposit_amount, 0) > 0
    and coalesce(t.tenancy_status, t.status, '') in ('ended', 'terminated')
  on conflict (automation_key) do update
  set
    property_id = excluded.property_id,
    status = excluded.status,
    scheduled_for = excluded.scheduled_for,
    completed_at = null,
    source = excluded.source,
    note = excluded.note,
    automation_source = excluded.automation_source,
    updated_at = now();

  get diagnostics v_step_count = row_count;
  v_touched := v_touched + v_step_count;

  update public.lease_lifecycle_events event_item
  set
    status = case
      when event_item.status = 'completed' then 'completed'
      when event_item.scheduled_for is not null and event_item.scheduled_for <= v_target_date then 'due'
      else 'planned'
    end,
    completed_at = case
      when event_item.status = 'completed' then coalesce(event_item.completed_at, now())
      else null
    end,
    updated_at = now()
  where event_item.automation_source = 'lease_lifecycle'
    and event_item.event_type in ('renewal_review', 'move_out', 'deposit_follow_up')
    and event_item.status <> case
      when event_item.status = 'completed' then 'completed'
      when event_item.scheduled_for is not null and event_item.scheduled_for <= v_target_date then 'due'
      else 'planned'
    end;

  get diagnostics v_step_count = row_count;
  v_touched := v_touched + v_step_count;

  return v_touched;
end;
$$;

create or replace function public.ensure_rent_arrears_cases(
  p_target_date date default current_date
)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_target_date date := coalesce(p_target_date, current_date);
  v_created integer := 0;
begin
  with overdue_balances as (
    select
      t.id as tenancy_id,
      t.property_id,
      t.tenant_contact_id as contact_id,
      coalesce(t.rent_amount, 0) as monthly_rent,
      min(rle.due_date) filter (
        where rle.entry_type = 'charge'
          and rle.status = 'open'
          and coalesce(rle.due_date, v_target_date) < v_target_date
      ) as oldest_due_date,
      greatest(
        sum(case
          when rle.entry_type = 'charge'
            and rle.status = 'open'
            and coalesce(rle.due_date, v_target_date) < v_target_date
            then rle.amount
          else 0
        end)
        -
        sum(case
          when rle.entry_type in ('payment', 'credit')
            and rle.status = 'cleared'
            then rle.amount
          else 0
        end),
        0
      ) as overdue_balance
    from public.tenancies t
    join public.rent_ledger_entries rle
      on rle.tenancy_id = t.id
    where coalesce(t.tenancy_status, t.status, 'active') not in ('ended', 'terminated', 'cancelled', 'archived')
    group by t.id, t.property_id, t.tenant_contact_id, t.rent_amount
  ), inserted_cases as (
    insert into public.cases (
      contact_id,
      property_id,
      tenancy_id,
      case_type,
      category,
      priority,
      status,
      source_channel,
      subject,
      summary,
      description,
      next_action_at,
      waiting_on,
      waiting_reason,
      created_at,
      updated_at,
      last_activity_at
    )
    select
      overdue.contact_id,
      overdue.property_id,
      overdue.tenancy_id,
      'rent',
      'rent_arrears',
      case
        when overdue.overdue_balance >= greatest(overdue.monthly_rent * 2, overdue.monthly_rent + 1)
          or overdue.oldest_due_date <= (v_target_date - 30) then 'urgent'
        when overdue.overdue_balance >= greatest(overdue.monthly_rent, 1)
          or overdue.oldest_due_date <= (v_target_date - 14) then 'high'
        else 'medium'
      end,
      'open',
      'internal',
      'Rent arrears follow-up',
      'Outstanding rent balance of GBP ' || to_char(overdue.overdue_balance, 'FM999999990.00'),
      'Automated arrears case created for overdue rent ledger entries due on or before ' || v_target_date::text,
      now() + interval '1 day',
      'tenant',
      'Outstanding rent balance requires follow-up',
      now(),
      now(),
      now()
    from overdue_balances overdue
    where overdue.overdue_balance > 0
      and not exists (
        select 1
        from public.cases c
        where c.tenancy_id = overdue.tenancy_id
          and public.normalize_case_type(c.case_type) = 'rent'
          and c.status not in ('resolved', 'closed', 'cancelled')
      )
    returning id, tenancy_id
  )
  select count(*)::int
  into v_created
  from inserted_cases;

  update public.rent_ledger_entries rle
  set case_id = linked_case.id
  from public.cases linked_case
  where rle.tenancy_id = linked_case.tenancy_id
    and rle.case_id is null
    and rle.entry_type = 'charge'
    and rle.status = 'open'
    and coalesce(rle.due_date, v_target_date) < v_target_date
    and public.normalize_case_type(linked_case.case_type) = 'rent'
    and linked_case.status not in ('resolved', 'closed', 'cancelled');

  return v_created;
end;
$$;

create or replace function public.run_rent_and_lease_automation(
  p_target_date date default current_date
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_target_date date := coalesce(p_target_date, current_date);
  v_charge_count integer := 0;
  v_lifecycle_count integer := 0;
  v_case_count integer := 0;
begin
  v_charge_count := public.ensure_monthly_rent_charges(date_trunc('month', v_target_date)::date);
  v_lifecycle_count := public.refresh_lease_lifecycle_events(v_target_date);
  v_case_count := public.ensure_rent_arrears_cases(v_target_date);

  return jsonb_build_object(
    'target_date', v_target_date,
    'charges_created', v_charge_count,
    'lifecycle_events_touched', v_lifecycle_count,
    'arrears_cases_created', v_case_count
  );
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
  'renovo-rent-lease-automation',
  '5 6 * * *',
  $$select public.run_rent_and_lease_automation(current_date);$$
);

select public.run_rent_and_lease_automation(current_date);
