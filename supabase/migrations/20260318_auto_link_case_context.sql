create or replace function public.normalize_case_type(value text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  normalized text;
begin
  normalized := lower(trim(coalesce(value, '')));

  if normalized = '' then
    return null;
  end if;

  normalized := replace(normalized, '-', '_');
  normalized := regexp_replace(normalized, '\s+', '_', 'g');

  if normalized in (
    'maintenance',
    'deposit',
    'viewing',
    'complaint',
    'compliance',
    'rent',
    'general_enquiry',
    'tenancy_admin'
  ) then
    return normalized;
  end if;

  if normalized in ('general', 'general_inquiry', 'general_enquiry', 'unknown', 'other') then
    return 'general_enquiry';
  end if;

  if normalized in ('repair', 'boiler', 'heating', 'electrical', 'plumbing', 'leak') then
    return 'maintenance';
  end if;

  if normalized in ('deposit_dispute', 'deposit_claim') then
    return 'deposit';
  end if;

  if normalized in ('tenancy', 'admin', 'tenancy_management') then
    return 'tenancy_admin';
  end if;

  return null;
end;
$$;

create or replace function public.resolve_contact_case_context(
  p_contact_id uuid,
  p_case_type text default null,
  p_property_id uuid default null,
  p_tenancy_id uuid default null,
  p_existing_case_id uuid default null
)
returns table(
  contact_id uuid,
  property_id uuid,
  tenancy_id uuid,
  contractor_id uuid,
  case_id uuid,
  maintenance_request_id bigint,
  viewing_request_id bigint,
  deposit_claim_id uuid
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_contact_id uuid := p_contact_id;
  v_property_id uuid := p_property_id;
  v_tenancy_id uuid := p_tenancy_id;
  v_case_id uuid := p_existing_case_id;
  v_contractor_id uuid;
  v_case_type text := public.normalize_case_type(p_case_type);
  v_top_score integer;
  v_second_score integer;
begin
  if v_contact_id is null and v_case_id is null then
    return;
  end if;

  if v_contact_id is not null then
    select c.id
    into v_contractor_id
    from public.contractors c
    where c.contact_id = v_contact_id
      and coalesce(c.is_active, true)
    order by coalesce(c.updated_at, c.created_at) desc
    limit 1;
  end if;

  if v_case_id is not null then
    select
      coalesce(v_contact_id, c.contact_id),
      coalesce(v_property_id, c.property_id),
      coalesce(v_tenancy_id, c.tenancy_id),
      coalesce(v_case_type, public.normalize_case_type(c.case_type))
    into
      v_contact_id,
      v_property_id,
      v_tenancy_id,
      v_case_type
    from public.cases c
    where c.id = v_case_id;
  end if;

  if v_tenancy_id is not null and v_property_id is null then
    select t.property_id
    into v_property_id
    from public.tenancies t
    where t.id = v_tenancy_id;
  end if;

  if (v_tenancy_id is null or v_property_id is null) and v_contact_id is not null then
    select t.id, t.property_id
    into v_tenancy_id, v_property_id
    from public.tenancies t
    where (t.tenant_contact_id = v_contact_id or t.landlord_contact_id = v_contact_id)
      and coalesce(t.tenancy_status, t.status, 'active') not in ('ended', 'terminated', 'cancelled', 'archived')
    order by
      case when coalesce(t.tenancy_status, t.status, '') = 'active' then 0 else 1 end,
      coalesce(t.updated_at, t.created_at) desc,
      t.start_date desc nulls last
    limit 1;
  end if;

  if v_property_id is null and v_contact_id is not null then
    select p.id
    into v_property_id
    from public.properties p
    where p.landlord_contact_id = v_contact_id
      and coalesce(p.is_active, true)
    order by coalesce(p.updated_at, p.created_at) desc
    limit 1;
  end if;

  if v_case_id is null then
    with candidate_cases as (
      select
        c.id,
        (
          case when v_contact_id is not null and c.contact_id = v_contact_id then 40 else 0 end +
          case when v_tenancy_id is not null and c.tenancy_id = v_tenancy_id then 30 else 0 end +
          case when v_property_id is not null and c.property_id = v_property_id then 20 else 0 end +
          case when v_case_type is not null and public.normalize_case_type(c.case_type) = v_case_type then 15 else 0 end
        ) as score,
        coalesce(c.last_activity_at, c.updated_at, c.created_at) as activity_at
      from public.cases c
      where coalesce(c.status, 'open') not in ('resolved', 'closed', 'cancelled')
        and (
          (v_contact_id is not null and c.contact_id = v_contact_id)
          or (v_tenancy_id is not null and c.tenancy_id = v_tenancy_id)
          or (v_property_id is not null and c.property_id = v_property_id)
        )
        and (v_case_type is null or public.normalize_case_type(c.case_type) = v_case_type)
    ),
    ranked_cases as (
      select
        candidate_cases.id,
        candidate_cases.score,
        row_number() over (order by candidate_cases.score desc, candidate_cases.activity_at desc) as rn
      from candidate_cases
      where candidate_cases.score > 0
    )
    select
      max(case when rn = 1 then id::text end)::uuid,
      max(case when rn = 1 then score end),
      max(case when rn = 2 then score end)
    into
      v_case_id,
      v_top_score,
      v_second_score
    from ranked_cases;

    if v_case_id is not null and v_second_score is not null and v_top_score <= v_second_score then
      v_case_id := null;
    end if;
  end if;

  if v_case_id is null and (v_contact_id is not null or v_property_id is not null or v_tenancy_id is not null or v_contractor_id is not null) then
    with candidate_requests as (
      select
        mr.id,
        mr.case_id,
        (
          case when v_contact_id is not null and mr.reported_by_contact_id = v_contact_id then 40 else 0 end +
          case when v_contractor_id is not null and mr.contractor_id = v_contractor_id then 35 else 0 end +
          case when v_tenancy_id is not null and mr.tenancy_id = v_tenancy_id then 30 else 0 end +
          case when v_property_id is not null and mr.property_id = v_property_id then 20 else 0 end
        ) as score,
        coalesce(mr.updated_at, mr.created_at) as activity_at
      from public.maintenance_requests mr
      where coalesce(mr.status, 'reported') not in ('completed', 'cancelled')
        and (
          (v_contact_id is not null and mr.reported_by_contact_id = v_contact_id)
          or (v_contractor_id is not null and mr.contractor_id = v_contractor_id)
          or (v_tenancy_id is not null and mr.tenancy_id = v_tenancy_id)
          or (v_property_id is not null and mr.property_id = v_property_id)
        )
        and (v_case_type is null or v_case_type = 'maintenance')
    ),
    ranked_requests as (
      select
        candidate_requests.id,
        candidate_requests.case_id,
        candidate_requests.score,
        row_number() over (order by candidate_requests.score desc, candidate_requests.activity_at desc) as rn
      from candidate_requests
      where candidate_requests.score > 0
    )
    select
      max(case when ranked_requests.rn = 1 then ranked_requests.id end),
      max(case when ranked_requests.rn = 1 then ranked_requests.case_id::text end)::uuid,
      max(case when ranked_requests.rn = 1 then ranked_requests.score end),
      max(case when ranked_requests.rn = 2 then ranked_requests.score end)
    into
      maintenance_request_id,
      v_case_id,
      v_top_score,
      v_second_score
    from ranked_requests;

    if maintenance_request_id is not null and v_second_score is not null and v_top_score <= v_second_score then
      maintenance_request_id := null;
      v_case_id := null;
    end if;
  end if;

  if v_case_id is null and (v_contact_id is not null or v_property_id is not null) then
    with candidate_viewings as (
      select
        vr.id,
        vr.case_id,
        (
          case when v_contact_id is not null and vr.applicant_contact_id = v_contact_id then 40 else 0 end +
          case when v_property_id is not null and vr.property_id = v_property_id then 20 else 0 end
        ) as score,
        coalesce(vr.updated_at, vr.created_at) as activity_at
      from public.viewing_requests vr
      where coalesce(vr.status, 'requested') <> 'cancelled'
        and (
          (v_contact_id is not null and vr.applicant_contact_id = v_contact_id)
          or (v_property_id is not null and vr.property_id = v_property_id)
        )
        and (v_case_type is null or v_case_type = 'viewing')
    ),
    ranked_viewings as (
      select
        candidate_viewings.id,
        candidate_viewings.case_id,
        candidate_viewings.score,
        row_number() over (order by candidate_viewings.score desc, candidate_viewings.activity_at desc) as rn
      from candidate_viewings
      where candidate_viewings.score > 0
    )
    select
      max(case when ranked_viewings.rn = 1 then ranked_viewings.id end),
      max(case when ranked_viewings.rn = 1 then ranked_viewings.case_id::text end)::uuid,
      max(case when ranked_viewings.rn = 1 then ranked_viewings.score end),
      max(case when ranked_viewings.rn = 2 then ranked_viewings.score end)
    into
      viewing_request_id,
      v_case_id,
      v_top_score,
      v_second_score
    from ranked_viewings;

    if viewing_request_id is not null and v_second_score is not null and v_top_score <= v_second_score then
      viewing_request_id := null;
      v_case_id := null;
    end if;
  end if;

  if v_case_id is null and (v_tenancy_id is not null or v_property_id is not null) then
    with candidate_claims as (
      select
        dc.id,
        dc.case_id,
        (
          case when v_tenancy_id is not null and dc.tenancy_id = v_tenancy_id then 40 else 0 end +
          case when v_property_id is not null and dc.property_id = v_property_id then 20 else 0 end
        ) as score,
        coalesce(dc.updated_at, dc.created_at) as activity_at
      from public.deposit_claims dc
      where coalesce(dc.claim_status, 'draft') not in ('resolved', 'cancelled')
        and (
          (v_tenancy_id is not null and dc.tenancy_id = v_tenancy_id)
          or (v_property_id is not null and dc.property_id = v_property_id)
        )
        and (v_case_type is null or v_case_type = 'deposit')
    ),
    ranked_claims as (
      select
        candidate_claims.id,
        candidate_claims.case_id,
        candidate_claims.score,
        row_number() over (order by candidate_claims.score desc, candidate_claims.activity_at desc) as rn
      from candidate_claims
      where candidate_claims.score > 0
    )
    select
      max(case when ranked_claims.rn = 1 then ranked_claims.id::text end)::uuid,
      max(case when ranked_claims.rn = 1 then ranked_claims.case_id::text end)::uuid,
      max(case when ranked_claims.rn = 1 then ranked_claims.score end),
      max(case when ranked_claims.rn = 2 then ranked_claims.score end)
    into
      deposit_claim_id,
      v_case_id,
      v_top_score,
      v_second_score
    from ranked_claims;

    if deposit_claim_id is not null and v_second_score is not null and v_top_score <= v_second_score then
      deposit_claim_id := null;
      v_case_id := null;
    end if;
  end if;

  if v_case_id is not null then
    select
      coalesce(v_contact_id, c.contact_id),
      coalesce(v_property_id, c.property_id),
      coalesce(v_tenancy_id, c.tenancy_id),
      coalesce(v_case_type, public.normalize_case_type(c.case_type))
    into
      v_contact_id,
      v_property_id,
      v_tenancy_id,
      v_case_type
    from public.cases c
    where c.id = v_case_id;
  end if;

  if maintenance_request_id is null and v_case_id is not null and (v_case_type is null or v_case_type = 'maintenance') then
    select mr.id
    into maintenance_request_id
    from public.maintenance_requests mr
    where mr.case_id = v_case_id
    order by coalesce(mr.updated_at, mr.created_at) desc
    limit 1;
  end if;

  if viewing_request_id is null and v_case_id is not null and (v_case_type is null or v_case_type = 'viewing') then
    select vr.id
    into viewing_request_id
    from public.viewing_requests vr
    where vr.case_id = v_case_id
    order by coalesce(vr.updated_at, vr.created_at) desc
    limit 1;
  end if;

  if deposit_claim_id is null and v_case_id is not null and (v_case_type is null or v_case_type = 'deposit') then
    select dc.id
    into deposit_claim_id
    from public.deposit_claims dc
    where dc.case_id = v_case_id
    order by coalesce(dc.updated_at, dc.created_at) desc
    limit 1;
  end if;

  if v_tenancy_id is not null and v_property_id is null then
    select t.property_id
    into v_property_id
    from public.tenancies t
    where t.id = v_tenancy_id;
  end if;

  contact_id := v_contact_id;
  property_id := v_property_id;
  tenancy_id := v_tenancy_id;
  contractor_id := v_contractor_id;
  case_id := v_case_id;

  return next;
end;
$$;

create or replace function public.enrich_case_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_property_id uuid;
  v_tenancy_id uuid;
begin
  if new.contact_id is null and new.opened_by_contact_id is not null then
    new.contact_id := new.opened_by_contact_id;
  end if;

  if new.call_session_id is not null then
    select cs.contact_id, cs.property_id
    into v_contact_id, v_property_id
    from public.call_sessions cs
    where cs.id = new.call_session_id;

    new.contact_id := coalesce(new.contact_id, v_contact_id);
    new.property_id := coalesce(new.property_id, v_property_id);
  end if;

  if new.contact_id is not null and (new.property_id is null or new.tenancy_id is null) then
    select ctx.property_id, ctx.tenancy_id
    into v_property_id, v_tenancy_id
    from public.resolve_contact_case_context(
      new.contact_id,
      new.case_type,
      new.property_id,
      new.tenancy_id,
      new.id
    ) ctx;

    new.property_id := coalesce(new.property_id, v_property_id);
    new.tenancy_id := coalesce(new.tenancy_id, v_tenancy_id);
  end if;

  new.case_type := coalesce(public.normalize_case_type(new.case_type), new.case_type);
  new.updated_at := coalesce(new.updated_at, now());
  new.last_activity_at := coalesce(new.last_activity_at, now());

  return new;
end;
$$;

create or replace function public.enrich_call_session_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_property_id uuid;
  v_case_id uuid;
begin
  if new.contact_id is null and nullif(btrim(coalesce(new.caller_phone, '')), '') is not null then
    select c.id
    into new.contact_id
    from public.contacts c
    where public.normalize_uk_phone(c.phone) = public.normalize_uk_phone(new.caller_phone)
    order by coalesce(c.updated_at, c.created_at) desc
    limit 1;
  end if;

  if new.contact_id is not null and (new.property_id is null or new.case_id is null) then
    select ctx.property_id, ctx.case_id
    into v_property_id, v_case_id
    from public.resolve_contact_case_context(
      new.contact_id,
      new.intent,
      new.property_id,
      null,
      new.case_id
    ) ctx;

    new.property_id := coalesce(new.property_id, v_property_id);
    new.case_id := coalesce(new.case_id, v_case_id);
  end if;

  new.intent := coalesce(public.normalize_case_type(new.intent), new.intent);

  return new;
end;
$$;

create or replace function public.sync_case_context_from_call_session()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_tenancy_id uuid;
begin
  if new.case_id is null then
    return new;
  end if;

  if new.contact_id is not null then
    select ctx.tenancy_id
    into v_tenancy_id
    from public.resolve_contact_case_context(
      new.contact_id,
      new.intent,
      new.property_id,
      null,
      new.case_id
    ) ctx;
  end if;

  update public.cases c
  set
    property_id = coalesce(c.property_id, new.property_id),
    tenancy_id = coalesce(c.tenancy_id, v_tenancy_id),
    call_session_id = coalesce(c.call_session_id, new.id),
    last_activity_at = greatest(coalesce(c.last_activity_at, '-infinity'::timestamptz), coalesce(new.last_event_at, new.created_at, now())),
    updated_at = now()
  where c.id = new.case_id;

  return new;
end;
$$;

create or replace function public.enrich_message_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_case_id uuid;
  v_call_session_id uuid;
  v_sender_contact_id uuid;
begin
  if new.case_id is null and new.call_session_id is not null then
    select cs.case_id, cs.contact_id
    into v_case_id, v_sender_contact_id
    from public.call_sessions cs
    where cs.id = new.call_session_id;

    new.case_id := coalesce(new.case_id, v_case_id);
    new.sender_contact_id := coalesce(new.sender_contact_id, v_sender_contact_id);
  end if;

  if new.case_id is null and new.sender_contact_id is not null then
    select ctx.case_id
    into v_case_id
    from public.resolve_contact_case_context(
      new.sender_contact_id,
      null,
      null,
      null,
      null
    ) ctx;

    new.case_id := coalesce(new.case_id, v_case_id);
  end if;

  if new.call_session_id is null and new.case_id is not null then
    select c.call_session_id
    into v_call_session_id
    from public.cases c
    where c.id = new.case_id;

    new.call_session_id := coalesce(new.call_session_id, v_call_session_id);
  end if;

  return new;
end;
$$;

create or replace function public.ensure_case_work_item_for_case(target_case_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  target_case public.cases%rowtype;
  v_property_id uuid;
  v_description text;
  v_issue_type text;
  v_maintenance_status text;
  v_viewing_status text;
  v_deposit_status text;
begin
  if target_case_id is null then
    return;
  end if;

  select *
  into target_case
  from public.cases
  where id = target_case_id;

  if not found then
    return;
  end if;

  v_property_id := coalesce(
    target_case.property_id,
    (
      select t.property_id
      from public.tenancies t
      where t.id = target_case.tenancy_id
    )
  );

  v_description := coalesce(
    nullif(btrim(target_case.description), ''),
    nullif(btrim(target_case.summary), ''),
    'Auto-linked from case activity.'
  );

  v_issue_type := coalesce(nullif(btrim(target_case.category), ''), 'general');

  v_maintenance_status := case
    when target_case.status = 'scheduled' then 'scheduled'
    when target_case.status = 'in_progress' then 'in_progress'
    when target_case.status in ('resolved', 'closed') then 'completed'
    when target_case.status = 'cancelled' then 'cancelled'
    else 'reported'
  end;

  v_viewing_status := case
    when target_case.status = 'cancelled' then 'cancelled'
    else 'requested'
  end;

  v_deposit_status := case
    when target_case.status = 'cancelled' then 'cancelled'
    when target_case.status in ('resolved', 'closed') then 'resolved'
    else 'draft'
  end;

  if public.normalize_case_type(target_case.case_type) = 'maintenance' then
    update public.maintenance_requests mr
    set
      property_id = coalesce(mr.property_id, v_property_id),
      tenancy_id = coalesce(mr.tenancy_id, target_case.tenancy_id),
      reported_by_contact_id = coalesce(mr.reported_by_contact_id, target_case.contact_id),
      issue_type = coalesce(nullif(btrim(mr.issue_type), ''), v_issue_type),
      description = case
        when nullif(btrim(coalesce(mr.description, '')), '') is null then v_description
        else mr.description
      end,
      priority = coalesce(mr.priority, target_case.priority, 'medium'),
      status = coalesce(mr.status, v_maintenance_status),
      updated_at = now()
    where mr.case_id = target_case.id;

    if not found and (v_property_id is not null or target_case.tenancy_id is not null or target_case.contact_id is not null) then
      insert into public.maintenance_requests (
        case_id,
        property_id,
        tenancy_id,
        reported_by_contact_id,
        issue_type,
        description,
        priority,
        status,
        created_at,
        updated_at
      )
      values (
        target_case.id,
        v_property_id,
        target_case.tenancy_id,
        target_case.contact_id,
        v_issue_type,
        v_description,
        coalesce(target_case.priority, 'medium'),
        v_maintenance_status,
        coalesce(target_case.created_at, now()),
        now()
      );
    end if;
  elsif public.normalize_case_type(target_case.case_type) = 'viewing' then
    update public.viewing_requests vr
    set
      property_id = coalesce(vr.property_id, v_property_id),
      applicant_contact_id = coalesce(vr.applicant_contact_id, target_case.contact_id),
      notes = case
        when nullif(btrim(coalesce(vr.notes, '')), '') is null then v_description
        else vr.notes
      end,
      status = coalesce(vr.status, v_viewing_status),
      updated_at = now()
    where vr.case_id = target_case.id;

    if not found and v_property_id is not null then
      insert into public.viewing_requests (
        case_id,
        property_id,
        applicant_contact_id,
        status,
        notes,
        created_at,
        updated_at
      )
      values (
        target_case.id,
        v_property_id,
        target_case.contact_id,
        v_viewing_status,
        v_description,
        coalesce(target_case.created_at, now()),
        now()
      );
    end if;
  elsif public.normalize_case_type(target_case.case_type) = 'deposit' then
    update public.deposit_claims dc
    set
      property_id = coalesce(dc.property_id, v_property_id),
      tenancy_id = coalesce(dc.tenancy_id, target_case.tenancy_id),
      evidence_notes = case
        when nullif(btrim(coalesce(dc.evidence_notes, '')), '') is null then v_description
        else dc.evidence_notes
      end,
      claim_status = coalesce(dc.claim_status, v_deposit_status),
      updated_at = now()
    where dc.case_id = target_case.id;

    if not found and v_property_id is not null and target_case.tenancy_id is not null then
      insert into public.deposit_claims (
        case_id,
        tenancy_id,
        property_id,
        claim_status,
        evidence_notes,
        created_at,
        updated_at
      )
      values (
        target_case.id,
        target_case.tenancy_id,
        v_property_id,
        v_deposit_status,
        v_description,
        coalesce(target_case.created_at, now()),
        now()
      );
    end if;
  end if;
end;
$$;

create or replace function public.ensure_case_work_item()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.ensure_case_work_item_for_case(new.id);
  return new;
end;
$$;

drop trigger if exists trg_cases_enrich_context on public.cases;
create trigger trg_cases_enrich_context
  before insert or update on public.cases
  for each row
  execute function public.enrich_case_context();

drop trigger if exists trg_cases_ensure_work_item on public.cases;
create trigger trg_cases_ensure_work_item
  after insert or update on public.cases
  for each row
  execute function public.ensure_case_work_item();

drop trigger if exists trg_call_sessions_enrich_context on public.call_sessions;
create trigger trg_call_sessions_enrich_context
  before insert or update on public.call_sessions
  for each row
  execute function public.enrich_call_session_context();

drop trigger if exists trg_call_sessions_sync_case_context on public.call_sessions;
create trigger trg_call_sessions_sync_case_context
  after insert or update on public.call_sessions
  for each row
  execute function public.sync_case_context_from_call_session();

drop trigger if exists trg_messages_enrich_context on public.messages;
create trigger trg_messages_enrich_context
  before insert on public.messages
  for each row
  execute function public.enrich_message_context();

create or replace function public.ingest_inbound_call(
  p_external_call_id text,
  p_caller_phone text,
  p_source_channel text default 'phone',
  p_intent text default null,
  p_summary text default null,
  p_property_id uuid default null,
  p_tenancy_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact_id uuid;
  v_call_session_id uuid;
  v_case_id uuid;
  v_phone text;
  v_case_type text;
  v_property_id uuid;
  v_tenancy_id uuid;
  v_summary text;
begin
  v_phone := trim(coalesce(p_caller_phone, ''));

  if v_phone = '' then
    raise exception 'caller_phone is required';
  end if;

  insert into public.contacts (
    full_name,
    phone,
    role,
    created_at
  )
  values (
    'Unknown Caller',
    v_phone,
    'unknown',
    now()
  )
  on conflict (phone)
  do update set
    phone = excluded.phone
  returning id into v_contact_id;

  v_case_type := public.normalize_case_type(p_intent);

  select ctx.property_id, ctx.tenancy_id, ctx.case_id
  into v_property_id, v_tenancy_id, v_case_id
  from public.resolve_contact_case_context(
    v_contact_id,
    v_case_type,
    p_property_id,
    p_tenancy_id,
    null
  ) ctx;

  insert into public.call_sessions (
    external_call_id,
    caller_phone,
    contact_id,
    property_id,
    case_id,
    status,
    intent,
    ai_summary,
    created_at
  )
  values (
    p_external_call_id,
    v_phone,
    v_contact_id,
    coalesce(p_property_id, v_property_id),
    v_case_id,
    'started',
    coalesce(v_case_type, p_intent),
    null,
    now()
  )
  returning id into v_call_session_id;

  if v_case_id is null then
    v_summary := coalesce(nullif(btrim(p_summary), ''), 'New inbound call');

    insert into public.cases (
      contact_id,
      property_id,
      tenancy_id,
      call_session_id,
      case_type,
      priority,
      status,
      source_channel,
      summary,
      created_at
    )
    values (
      v_contact_id,
      coalesce(p_property_id, v_property_id),
      coalesce(p_tenancy_id, v_tenancy_id),
      v_call_session_id,
      coalesce(v_case_type, 'general_enquiry'),
      'medium',
      'open',
      coalesce(p_source_channel, 'phone'),
      v_summary,
      now()
    )
    returning id into v_case_id;

    update public.call_sessions
    set case_id = v_case_id
    where id = v_call_session_id;
  else
    update public.cases
    set
      property_id = coalesce(property_id, coalesce(p_property_id, v_property_id)),
      tenancy_id = coalesce(tenancy_id, coalesce(p_tenancy_id, v_tenancy_id)),
      call_session_id = coalesce(call_session_id, v_call_session_id),
      last_activity_at = now(),
      updated_at = now()
    where id = v_case_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'contact_id', v_contact_id,
    'call_session_id', v_call_session_id,
    'case_id', v_case_id,
    'property_id', coalesce(p_property_id, v_property_id),
    'tenancy_id', coalesce(p_tenancy_id, v_tenancy_id),
    'external_call_id', p_external_call_id,
    'caller_phone', v_phone,
    'source_channel', coalesce(p_source_channel, 'phone')
  );
end;
$$;

update public.cases c
set
  property_id = coalesce(c.property_id, backfill.property_id),
  tenancy_id = coalesce(c.tenancy_id, backfill.tenancy_id),
  updated_at = now()
from (
  select
    c2.id,
    ctx.property_id,
    ctx.tenancy_id
  from public.cases c2
  cross join lateral public.resolve_contact_case_context(
    c2.contact_id,
    c2.case_type,
    c2.property_id,
    c2.tenancy_id,
    c2.id
  ) ctx
  where c2.contact_id is not null
    and (c2.property_id is null or c2.tenancy_id is null)
    and (ctx.property_id is not null or ctx.tenancy_id is not null)
) backfill
where c.id = backfill.id;

update public.call_sessions cs
set
  property_id = coalesce(cs.property_id, backfill.property_id),
  case_id = coalesce(cs.case_id, backfill.case_id),
  updated_at = now()
from (
  select
    cs2.id,
    ctx.property_id,
    ctx.case_id
  from public.call_sessions cs2
  cross join lateral public.resolve_contact_case_context(
    cs2.contact_id,
    cs2.intent,
    cs2.property_id,
    null,
    cs2.case_id
  ) ctx
  where cs2.contact_id is not null
    and (cs2.property_id is null or cs2.case_id is null)
    and (ctx.property_id is not null or ctx.case_id is not null)
) backfill
where cs.id = backfill.id;

update public.cases c
set
  property_id = coalesce(c.property_id, cs.property_id),
  call_session_id = coalesce(c.call_session_id, cs.id),
  updated_at = now()
from public.call_sessions cs
where cs.case_id = c.id
  and (c.property_id is null or c.call_session_id is null);

update public.messages m
set
  case_id = coalesce(m.case_id, backfill.case_id),
  call_session_id = coalesce(m.call_session_id, backfill.call_session_id)
from (
  select
    m2.id,
    ctx.case_id,
    c.call_session_id
  from public.messages m2
  cross join lateral public.resolve_contact_case_context(
    m2.sender_contact_id,
    null,
    null,
    null,
    m2.case_id
  ) ctx
  left join public.cases c on c.id = coalesce(m2.case_id, ctx.case_id)
  where m2.case_id is null
    and m2.sender_contact_id is not null
    and ctx.case_id is not null
) backfill
where m.id = backfill.id;

do $$
declare
  case_row record;
begin
  for case_row in
    select c.id
    from public.cases c
    where public.normalize_case_type(c.case_type) in ('maintenance', 'viewing', 'deposit')
  loop
    perform public.ensure_case_work_item_for_case(case_row.id);
  end loop;
end $$;
