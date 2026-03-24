create table if not exists public.case_communications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  end_of_tenancy_case_id uuid references public.end_of_tenancy_cases(id) on delete set null,
  thread_key text not null default 'primary',
  direction text not null check (direction in ('internal', 'outbound', 'inbound')),
  channel text not null check (
    channel in ('internal_note', 'email', 'portal_message', 'sms', 'manual_log')
  ),
  recipient_role text not null check (recipient_role in ('tenant', 'landlord', 'internal')),
  sender_user_id uuid references public.users_profiles(id) on delete set null,
  sender_contact_id uuid references public.contacts(id) on delete set null,
  recipient_contact_id uuid references public.contacts(id) on delete set null,
  subject text,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (
    status in ('draft', 'queued', 'sent', 'delivered', 'failed', 'received', 'read')
  ),
  unread boolean not null default false,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists case_communications_case_idx
  on public.case_communications (case_id, created_at desc);

create index if not exists case_communications_eot_case_idx
  on public.case_communications (end_of_tenancy_case_id, created_at desc)
  where end_of_tenancy_case_id is not null;

create index if not exists case_communications_unread_idx
  on public.case_communications (unread, created_at desc)
  where unread = true;

drop trigger if exists trg_case_communications_set_updated_at on public.case_communications;
create trigger trg_case_communications_set_updated_at
before update on public.case_communications
for each row
execute function public.set_updated_at();

alter table public.case_communications enable row level security;

create policy case_communications_operator_all
  on public.case_communications
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());
