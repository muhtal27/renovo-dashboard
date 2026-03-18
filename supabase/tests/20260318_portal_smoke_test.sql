-- Renovo portal smoke test
-- Run this in the Supabase SQL Editor after migrations are applied.
-- This script is read-only: it performs assertions and status queries only.

do $$
begin
  if to_regclass('public.portal_profiles') is null then
    raise exception 'Missing table public.portal_profiles';
  end if;

  if to_regclass('public.maintenance_quotes') is null then
    raise exception 'Missing table public.maintenance_quotes';
  end if;

  if to_regclass('public.maintenance_requests') is null then
    raise exception 'Missing table public.maintenance_requests';
  end if;

  if to_regclass('public.messages') is null then
    raise exception 'Missing table public.messages';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'current_portal_contact_id'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing function public.current_portal_contact_id';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'portal_can_read_case'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing function public.portal_can_read_case';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'tenant_add_case_update'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing function public.tenant_add_case_update';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'tenant_case_signal'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing function public.tenant_case_signal';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'landlord_approve_quote'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing function public.landlord_approve_quote';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'landlord_case_signal'
      and pronamespace = 'public'::regnamespace
  ) then
    raise exception 'Missing function public.landlord_case_signal';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'public.portal_profiles'::regclass
      and relrowsecurity = true
  ) then
    raise exception 'RLS is not enabled on public.portal_profiles';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'public.cases'::regclass
      and relrowsecurity = true
  ) then
    raise exception 'RLS is not enabled on public.cases';
  end if;

  if not exists (
    select 1
    from pg_class
    where oid = 'public.messages'::regclass
      and relrowsecurity = true
  ) then
    raise exception 'RLS is not enabled on public.messages';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'portal_profiles'
      and policyname = 'portal_profiles_self_select'
  ) then
    raise exception 'Missing policy portal_profiles_self_select';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cases'
      and policyname = 'cases_portal_select'
  ) then
    raise exception 'Missing policy cases_portal_select';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'messages'
      and policyname = 'messages_portal_select'
  ) then
    raise exception 'Missing policy messages_portal_select';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'maintenance_quotes'
      and policyname = 'maintenance_quotes_portal_select'
  ) then
    raise exception 'Missing policy maintenance_quotes_portal_select';
  end if;
end $$;

select 'core_schema_checks_passed' as status;

with expected_objects as (
  select *
  from (
    values
      ('table', 'public.portal_profiles'),
      ('table', 'public.cases'),
      ('table', 'public.messages'),
      ('table', 'public.maintenance_requests'),
      ('table', 'public.maintenance_quotes'),
      ('function', 'public.current_portal_contact_id'),
      ('function', 'public.portal_can_read_case'),
      ('function', 'public.tenant_add_case_update'),
      ('function', 'public.tenant_case_signal'),
      ('function', 'public.landlord_approve_quote'),
      ('function', 'public.landlord_case_signal')
  ) as t(object_type, object_name)
)
select *
from expected_objects
order by object_type, object_name;

select
  portal_role,
  count(*) as profile_count,
  count(*) filter (where coalesce(is_active, true)) as active_profile_count
from public.portal_profiles
group by portal_role
order by portal_role;

select
  count(*) as portal_profiles_without_auth_user
from public.portal_profiles pp
left join auth.users au
  on au.id = pp.auth_user_id
where au.id is null;

select
  count(*) as active_portal_profiles_without_contact
from public.portal_profiles pp
left join public.contacts c
  on c.id = pp.contact_id
where coalesce(pp.is_active, true)
  and c.id is null;

select
  tablename,
  policyname,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in (
    'portal_profiles',
    'contacts',
    'properties',
    'tenancies',
    'cases',
    'messages',
    'maintenance_requests',
    'maintenance_quotes',
    'compliance_records',
    'viewing_requests',
    'contractors',
    'contractor_trades',
    'deposit_claims'
  )
order by tablename, policyname;

select
  tablename,
  policyname,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in (
    'portal_profiles',
    'contacts',
    'properties',
    'tenancies',
    'cases',
    'messages',
    'maintenance_requests',
    'maintenance_quotes',
    'compliance_records',
    'viewing_requests',
    'contractors',
    'contractor_trades',
    'deposit_claims'
  )
  and coalesce(qual, '') = 'true';

with fixture_ids as (
  select
    'b162dcfd-5762-442b-966b-1f3dc7742bd0'::uuid as tenant_contact_id,
    '0a09dec0-569f-4969-9560-134579323eb5'::uuid as landlord_contact_id,
    '0278dea6-6ee8-4ae5-92bf-3a943d8f6389'::uuid as contractor_contact_id,
    '43f59096-bd88-4873-a5f5-941814513ea6'::uuid as contractor_id
)
select
  exists (
    select 1
    from public.contacts c, fixture_ids f
    where c.id = f.tenant_contact_id
  ) as tenant_contact_exists,
  exists (
    select 1
    from public.contacts c, fixture_ids f
    where c.id = f.landlord_contact_id
  ) as landlord_contact_exists,
  exists (
    select 1
    from public.contacts c, fixture_ids f
    where c.id = f.contractor_contact_id
  ) as contractor_contact_exists,
  exists (
    select 1
    from public.contractors c, fixture_ids f
    where c.id = f.contractor_id
  ) as contractor_record_exists;

with fixture_ids as (
  select
    'b162dcfd-5762-442b-966b-1f3dc7742bd0'::uuid as tenant_contact_id,
    '0a09dec0-569f-4969-9560-134579323eb5'::uuid as landlord_contact_id,
    '43f59096-bd88-4873-a5f5-941814513ea6'::uuid as contractor_id
)
select
  (
    select count(*)
    from public.cases c, fixture_ids f
    where c.contact_id = f.tenant_contact_id
      and coalesce(c.status, 'open') not in ('resolved', 'closed', 'cancelled')
  ) as open_tenant_cases,
  (
    select count(*)
    from public.properties p, fixture_ids f
    where p.landlord_contact_id = f.landlord_contact_id
  ) as landlord_properties,
  (
    select count(*)
    from public.maintenance_requests mr, fixture_ids f
    where mr.contractor_id = f.contractor_id
      and coalesce(mr.status, 'reported') not in ('completed', 'cancelled')
  ) as active_contractor_jobs;

with fixture_ids as (
  select
    'b162dcfd-5762-442b-966b-1f3dc7742bd0'::uuid as tenant_contact_id,
    '0a09dec0-569f-4969-9560-134579323eb5'::uuid as landlord_contact_id
)
select
  (
    select c.id
    from public.cases c, fixture_ids f
    where c.contact_id = f.tenant_contact_id
      and coalesce(c.status, 'open') not in ('resolved', 'closed', 'cancelled')
    order by coalesce(c.last_activity_at, c.updated_at, c.created_at) desc nulls last
    limit 1
  ) as suggested_tenant_case_id,
  (
    select mq.id
    from public.maintenance_quotes mq
    join public.maintenance_requests mr
      on mr.id = mq.maintenance_request_id
    join public.properties p
      on p.id = mr.property_id
    join fixture_ids f
      on p.landlord_contact_id = f.landlord_contact_id
    where coalesce(mr.status, 'reported') not in ('completed', 'cancelled')
      and (
        coalesce(mr.landlord_approval_required, false)
        or mr.status in ('awaiting_approval', 'quote_requested')
      )
    order by mq.submitted_at desc nulls last
    limit 1
  ) as suggested_landlord_quote_id;
