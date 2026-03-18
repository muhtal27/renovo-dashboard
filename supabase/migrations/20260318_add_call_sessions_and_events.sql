alter table public.call_sessions
  add column if not exists assigned_user_id uuid references public.users_profiles(id),
  add column if not exists needs_operator_review boolean not null default false,
  add column if not exists review_reason text,
  add column if not exists urgency text not null default 'medium',
  add column if not exists last_event_at timestamptz not null default now(),
  add column if not exists direction text not null default 'inbound',
  add column if not exists intent_confidence numeric,
  add column if not exists outcome text,
  add column if not exists vapi_assistant_id text;

update public.call_sessions
set last_event_at = coalesce(updated_at, ended_at, started_at, created_at, now())
where last_event_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'call_sessions_urgency_check'
  ) then
    alter table public.call_sessions
      add constraint call_sessions_urgency_check
      check (urgency in ('low', 'medium', 'high', 'urgent'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'call_sessions_direction_check'
  ) then
    alter table public.call_sessions
      add constraint call_sessions_direction_check
      check (direction in ('inbound', 'outbound'));
  end if;
end $$;

create index if not exists call_sessions_last_event_at_idx
  on public.call_sessions (last_event_at desc);

create index if not exists call_sessions_needs_operator_review_idx
  on public.call_sessions (needs_operator_review)
  where needs_operator_review = true;

create index if not exists call_sessions_case_id_idx
  on public.call_sessions (case_id)
  where case_id is not null;

create index if not exists call_sessions_assigned_user_id_idx
  on public.call_sessions (assigned_user_id)
  where assigned_user_id is not null;

create table if not exists public.call_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  event_type text not null,
  message_text text,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists call_events_call_session_id_created_at_idx
  on public.call_events (call_session_id, created_at asc);
