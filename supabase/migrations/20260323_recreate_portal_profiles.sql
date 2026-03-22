-- Emergency recreation of portal_profiles after accidental CASCADE drop.
-- This table is referenced by is_active_operator(), current_portal_contact_id(),
-- current_portal_contractor_id(), and every portal/operator RLS policy.

create table if not exists public.portal_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  portal_role text not null,
  contractor_id uuid references public.contractors(id) on delete set null,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'portal_profiles_portal_role_check'
  ) then
    alter table public.portal_profiles
      add constraint portal_profiles_portal_role_check
      check (portal_role in ('tenant', 'landlord', 'contractor'));
  end if;
end $$;

create index if not exists portal_profiles_contact_id_idx
  on public.portal_profiles (contact_id);

create index if not exists portal_profiles_portal_role_idx
  on public.portal_profiles (portal_role);

create index if not exists portal_profiles_contractor_id_idx
  on public.portal_profiles (contractor_id)
  where contractor_id is not null;

-- Re-enable RLS
alter table public.portal_profiles enable row level security;

-- Recreate operator full-access policy
drop policy if exists portal_profiles_operator_all on public.portal_profiles;
create policy portal_profiles_operator_all
  on public.portal_profiles
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

-- Recreate self-select policy for portal users
drop policy if exists portal_profiles_self_select on public.portal_profiles;
create policy portal_profiles_self_select
  on public.portal_profiles
  for select
  to authenticated
  using ((select auth.uid()) = auth_user_id and coalesce(is_active, true) = true);

-- Recreate the set_updated_at trigger
drop trigger if exists trg_portal_profiles_set_updated_at on public.portal_profiles;
create trigger trg_portal_profiles_set_updated_at
  before update on public.portal_profiles
  for each row
  execute function public.set_updated_at();
