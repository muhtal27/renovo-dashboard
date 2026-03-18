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
