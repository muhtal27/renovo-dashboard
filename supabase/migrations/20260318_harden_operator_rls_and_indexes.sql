create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_case_message_activity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.case_id is not null then
    if new.direction = 'inbound' and new.sender_type = 'contact' then
      update public.cases
      set last_customer_message_at = new.created_at,
          last_internal_action_at = now()
      where id = new.case_id;
    else
      update public.cases
      set last_internal_action_at = now()
      where id = new.case_id;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.log_case_status_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.case_events (
      case_id,
      event_type,
      actor_type,
      old_value,
      new_value,
      note,
      created_at
    )
    values (
      new.id,
      'status_changed',
      'system',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status),
      'Case status updated automatically',
      now()
    );
  end if;

  return new;
end;
$$;

create or replace function public.normalize_uk_phone(value text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  raw text;
begin
  if value is null then
    return null;
  end if;

  raw := trim(value);

  if raw = '' or lower(raw) in ('null', 'undefined', 'none', 'n/a') then
    return null;
  end if;

  raw := regexp_replace(raw, '[^0-9+]+', '', 'g');

  if raw = '' then
    return null;
  end if;

  if left(raw, 2) = '00' then
    raw := '+' || substring(raw from 3);
  end if;

  if left(raw, 3) = '+44' then
    return '+44' || regexp_replace(substring(raw from 4), '^0+', '');
  end if;

  if raw ~ '^44[0-9]+$' then
    return '+' || raw;
  end if;

  if raw ~ '^0[0-9]+$' then
    return '+44' || substring(raw from 2);
  end if;

  return raw;
end;
$$;

create or replace function public.ingest_inbound_call(
  p_external_call_id text,
  p_caller_phone text,
  p_source_channel text default 'phone'
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

  insert into public.call_sessions (
    external_call_id,
    caller_phone,
    contact_id,
    status,
    intent,
    ai_summary,
    created_at
  )
  values (
    p_external_call_id,
    v_phone,
    v_contact_id,
    'started',
    null,
    null,
    now()
  )
  returning id into v_call_session_id;

  insert into public.cases (
    contact_id,
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
    v_call_session_id,
    'unknown',
    'medium',
    'new',
    coalesce(p_source_channel, 'phone'),
    'New inbound call',
    now()
  )
  returning id into v_case_id;

  return jsonb_build_object(
    'success', true,
    'contact_id', v_contact_id,
    'call_session_id', v_call_session_id,
    'case_id', v_case_id,
    'external_call_id', p_external_call_id,
    'caller_phone', v_phone,
    'source_channel', coalesce(p_source_channel, 'phone')
  );
end;
$$;

create or replace function public.search_scotland_knowledge(
  search_query text,
  match_limit integer default 8
)
returns table(
  article_id uuid,
  chunk_id uuid,
  title text,
  category text,
  snippet text,
  source_url text,
  source_authority text,
  jurisdiction text,
  review_status text,
  source_updated_at date,
  score integer
)
language sql
stable
set search_path = public
as $$
  select
    ka.id as article_id,
    kac.id as chunk_id,
    ka.title,
    ka.category,
    left(kac.content, 400) as snippet,
    coalesce(kac.source_url, ka.source_url) as source_url,
    ka.source_authority,
    ka.jurisdiction,
    kac.review_status,
    ka.source_updated_at,
    (
      case when search_query is not null and btrim(search_query) <> '' and ka.title ilike '%' || search_query || '%' then 4 else 0 end +
      case when search_query is not null and btrim(search_query) <> '' and ka.category ilike '%' || search_query || '%' then 3 else 0 end +
      case when search_query is not null and btrim(search_query) <> '' and coalesce(kac.heading, '') ilike '%' || search_query || '%' then 3 else 0 end +
      case when search_query is not null and btrim(search_query) <> '' and kac.content ilike '%' || search_query || '%' then 2 else 0 end +
      case when search_query is not null and btrim(search_query) <> '' and exists (
        select 1
        from unnest(coalesce(kac.keywords, '{}'::text[])) keyword
        where keyword ilike '%' || search_query || '%'
      ) then 2 else 0 end
    ) as score
  from public.knowledge_article_chunks kac
  join public.knowledge_articles ka on ka.id = kac.article_id
  where ka.is_active = true
    and ka.review_status = 'approved'
    and ka.source_authority = 'official'
    and ka.jurisdiction = 'scotland'
    and kac.review_status = 'approved'
    and (
      search_query is null
      or btrim(search_query) = ''
      or ka.title ilike '%' || search_query || '%'
      or ka.category ilike '%' || search_query || '%'
      or coalesce(kac.heading, '') ilike '%' || search_query || '%'
      or kac.content ilike '%' || search_query || '%'
      or exists (
        select 1
        from unnest(coalesce(kac.keywords, '{}'::text[])) keyword
        where keyword ilike '%' || search_query || '%'
      )
    )
  order by score desc, ka.source_updated_at desc nulls last, ka.title asc
  limit greatest(coalesce(match_limit, 8), 1);
$$;

create or replace view public.v_cases_list
with (security_invoker = on)
as
select
  c.id,
  c.case_number,
  c.case_type,
  c.priority,
  c.status,
  c.summary,
  c.needs_human_handoff,
  c.handoff_reason,
  c.created_at,
  c.last_customer_message_at,
  c.last_activity_at,
  c.assigned_user_id,
  ct.full_name as contact_name,
  ct.phone as contact_phone,
  p.address_line_1,
  p.postcode,
  up.full_name as assigned_user_name
from public.cases c
left join public.contacts ct on ct.id = c.contact_id
left join public.properties p on p.id = c.property_id
left join public.users_profiles up on up.id = c.assigned_user_id;

alter table public.users_profiles enable row level security;
alter table public.resolved_messages enable row level security;
alter table public.contact_methods enable row level security;
alter table public.case_events enable row level security;
alter table public.message_attachments enable row level security;
alter table public.ai_runs enable row level security;
alter table public.case_assignments enable row level security;
alter table public.tags enable row level security;
alter table public.case_tags enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.knowledge_article_chunks enable row level security;

drop policy if exists portal_profiles_self_select on public.portal_profiles;
create policy portal_profiles_self_select
  on public.portal_profiles
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id and coalesce(is_active, true) = true);

drop policy if exists users_profiles_operator_select on public.users_profiles;
create policy users_profiles_operator_select
  on public.users_profiles
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists users_profiles_self_select on public.users_profiles;
create policy users_profiles_self_select
  on public.users_profiles
  for select
  to authenticated
  using ((select auth.uid()) in (id, auth_user_id));

drop policy if exists call_sessions_select_authenticated on public.call_sessions;
drop policy if exists call_sessions_update_authenticated on public.call_sessions;
drop policy if exists call_sessions_operator_select on public.call_sessions;
drop policy if exists call_sessions_operator_update on public.call_sessions;
create policy call_sessions_operator_select
  on public.call_sessions
  for select
  to authenticated
  using (public.is_active_operator());
create policy call_sessions_operator_update
  on public.call_sessions
  for update
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists call_events_select_authenticated on public.call_events;
drop policy if exists call_events_operator_select on public.call_events;
create policy call_events_operator_select
  on public.call_events
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists resolved_messages_operator_select on public.resolved_messages;
create policy resolved_messages_operator_select
  on public.resolved_messages
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists contact_methods_operator_select on public.contact_methods;
create policy contact_methods_operator_select
  on public.contact_methods
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists case_events_operator_select on public.case_events;
create policy case_events_operator_select
  on public.case_events
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists message_attachments_operator_select on public.message_attachments;
create policy message_attachments_operator_select
  on public.message_attachments
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists ai_runs_operator_select on public.ai_runs;
create policy ai_runs_operator_select
  on public.ai_runs
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists case_assignments_operator_select on public.case_assignments;
create policy case_assignments_operator_select
  on public.case_assignments
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists tags_operator_select on public.tags;
create policy tags_operator_select
  on public.tags
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists case_tags_operator_select on public.case_tags;
create policy case_tags_operator_select
  on public.case_tags
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists knowledge_articles_operator_select on public.knowledge_articles;
create policy knowledge_articles_operator_select
  on public.knowledge_articles
  for select
  to authenticated
  using (public.is_active_operator());

drop policy if exists knowledge_article_chunks_operator_select on public.knowledge_article_chunks;
create policy knowledge_article_chunks_operator_select
  on public.knowledge_article_chunks
  for select
  to authenticated
  using (public.is_active_operator());

create index if not exists idx_case_assignments_assigned_by
  on public.case_assignments (assigned_by)
  where assigned_by is not null;

create index if not exists idx_case_events_actor_contact_id
  on public.case_events (actor_contact_id)
  where actor_contact_id is not null;

create index if not exists idx_case_events_actor_user_id
  on public.case_events (actor_user_id)
  where actor_user_id is not null;

create index if not exists idx_cases_opened_by_contact_id
  on public.cases (opened_by_contact_id)
  where opened_by_contact_id is not null;

create index if not exists portal_profiles_contractor_id_idx
  on public.portal_profiles (contractor_id)
  where contractor_id is not null;

drop index if exists public.idx_deposit_claims_status;
