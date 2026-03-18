create or replace function public.is_active_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users_profiles up
    where up.auth_user_id = auth.uid()
      and coalesce(up.is_active, true) = true
  );
$$;

create or replace function public.current_portal_contact_id(expected_role text default null)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pp.contact_id
  from public.portal_profiles pp
  where pp.auth_user_id = auth.uid()
    and coalesce(pp.is_active, true) = true
    and (expected_role is null or pp.portal_role = expected_role)
  limit 1;
$$;

create or replace function public.current_portal_contractor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pp.contractor_id
  from public.portal_profiles pp
  where pp.auth_user_id = auth.uid()
    and pp.portal_role = 'contractor'
    and coalesce(pp.is_active, true) = true
  limit 1;
$$;

create or replace function public.portal_can_read_property(target_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.properties p
    where p.id = target_property_id
      and (
        p.landlord_contact_id = public.current_portal_contact_id('landlord')
        or p.id in (
          select t.property_id
          from public.tenancies t
          where t.tenant_contact_id = public.current_portal_contact_id('tenant')
            and t.property_id is not null
        )
        or p.id in (
          select mr.property_id
          from public.maintenance_requests mr
          where mr.contractor_id = public.current_portal_contractor_id()
            and mr.property_id is not null
        )
      )
  );
$$;

create or replace function public.portal_can_read_case(target_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cases c
    where c.id = target_case_id
      and (
        c.contact_id = public.current_portal_contact_id('tenant')
        or c.tenancy_id in (
          select t.id
          from public.tenancies t
          where t.tenant_contact_id = public.current_portal_contact_id('tenant')
        )
        or c.property_id in (
          select p.id
          from public.properties p
          where p.landlord_contact_id = public.current_portal_contact_id('landlord')
        )
        or c.id in (
          select mr.case_id
          from public.maintenance_requests mr
          where mr.contractor_id = public.current_portal_contractor_id()
            and mr.case_id is not null
        )
      )
  );
$$;

alter table public.portal_profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.properties enable row level security;
alter table public.tenancies enable row level security;
alter table public.cases enable row level security;
alter table public.messages enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.compliance_records enable row level security;
alter table public.viewing_requests enable row level security;
alter table public.contractors enable row level security;
alter table public.contractor_trades enable row level security;
alter table public.maintenance_quotes enable row level security;
alter table public.deposit_claims enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portal_profiles' and policyname = 'portal_profiles_operator_all'
  ) then
    create policy portal_profiles_operator_all
      on public.portal_profiles
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'portal_profiles' and policyname = 'portal_profiles_self_select'
  ) then
    create policy portal_profiles_self_select
      on public.portal_profiles
      for select
      to authenticated
      using (auth.uid() = auth_user_id and coalesce(is_active, true) = true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contacts' and policyname = 'contacts_operator_all'
  ) then
    create policy contacts_operator_all
      on public.contacts
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contacts' and policyname = 'contacts_portal_select'
  ) then
    create policy contacts_portal_select
      on public.contacts
      for select
      to authenticated
      using (id = public.current_portal_contact_id(null));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'properties' and policyname = 'properties_operator_all'
  ) then
    create policy properties_operator_all
      on public.properties
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'properties' and policyname = 'properties_portal_select'
  ) then
    create policy properties_portal_select
      on public.properties
      for select
      to authenticated
      using (public.portal_can_read_property(id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tenancies' and policyname = 'tenancies_operator_all'
  ) then
    create policy tenancies_operator_all
      on public.tenancies
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tenancies' and policyname = 'tenancies_portal_select'
  ) then
    create policy tenancies_portal_select
      on public.tenancies
      for select
      to authenticated
      using (
        tenant_contact_id = public.current_portal_contact_id('tenant')
        or landlord_contact_id = public.current_portal_contact_id('landlord')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cases' and policyname = 'cases_operator_all'
  ) then
    create policy cases_operator_all
      on public.cases
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cases' and policyname = 'cases_portal_select'
  ) then
    create policy cases_portal_select
      on public.cases
      for select
      to authenticated
      using (public.portal_can_read_case(id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_operator_all'
  ) then
    create policy messages_operator_all
      on public.messages
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'messages' and policyname = 'messages_portal_select'
  ) then
    create policy messages_portal_select
      on public.messages
      for select
      to authenticated
      using (
        case_id is not null
        and public.portal_can_read_case(case_id)
        and coalesce(direction, 'inbound') <> 'internal'
        and coalesce(message_type, 'text') not in ('note', 'system')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'maintenance_requests' and policyname = 'maintenance_requests_operator_all'
  ) then
    create policy maintenance_requests_operator_all
      on public.maintenance_requests
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'maintenance_requests' and policyname = 'maintenance_requests_portal_select'
  ) then
    create policy maintenance_requests_portal_select
      on public.maintenance_requests
      for select
      to authenticated
      using (
        contractor_id = public.current_portal_contractor_id()
        or reported_by_contact_id = public.current_portal_contact_id('tenant')
        or (property_id is not null and public.portal_can_read_property(property_id))
        or (case_id is not null and public.portal_can_read_case(case_id))
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'compliance_records' and policyname = 'compliance_records_operator_all'
  ) then
    create policy compliance_records_operator_all
      on public.compliance_records
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'compliance_records' and policyname = 'compliance_records_portal_select'
  ) then
    create policy compliance_records_portal_select
      on public.compliance_records
      for select
      to authenticated
      using (property_id is not null and public.portal_can_read_property(property_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'viewing_requests' and policyname = 'viewing_requests_operator_all'
  ) then
    create policy viewing_requests_operator_all
      on public.viewing_requests
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'viewing_requests' and policyname = 'viewing_requests_portal_select'
  ) then
    create policy viewing_requests_portal_select
      on public.viewing_requests
      for select
      to authenticated
      using (
        applicant_contact_id = public.current_portal_contact_id('tenant')
        or (property_id is not null and public.portal_can_read_property(property_id))
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contractors' and policyname = 'contractors_operator_all'
  ) then
    create policy contractors_operator_all
      on public.contractors
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contractors' and policyname = 'contractors_portal_select'
  ) then
    create policy contractors_portal_select
      on public.contractors
      for select
      to authenticated
      using (id = public.current_portal_contractor_id());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contractor_trades' and policyname = 'contractor_trades_operator_all'
  ) then
    create policy contractor_trades_operator_all
      on public.contractor_trades
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'contractor_trades' and policyname = 'contractor_trades_portal_select'
  ) then
    create policy contractor_trades_portal_select
      on public.contractor_trades
      for select
      to authenticated
      using (contractor_id = public.current_portal_contractor_id());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'maintenance_quotes' and policyname = 'maintenance_quotes_operator_all'
  ) then
    create policy maintenance_quotes_operator_all
      on public.maintenance_quotes
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'maintenance_quotes' and policyname = 'maintenance_quotes_portal_select'
  ) then
    create policy maintenance_quotes_portal_select
      on public.maintenance_quotes
      for select
      to authenticated
      using (contractor_id = public.current_portal_contractor_id());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'deposit_claims' and policyname = 'deposit_claims_operator_all'
  ) then
    create policy deposit_claims_operator_all
      on public.deposit_claims
      for all
      to authenticated
      using (public.is_active_operator())
      with check (public.is_active_operator());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'deposit_claims' and policyname = 'deposit_claims_portal_select'
  ) then
    create policy deposit_claims_portal_select
      on public.deposit_claims
      for select
      to authenticated
      using (
        tenancy_id in (
          select t.id
          from public.tenancies t
          where t.tenant_contact_id = public.current_portal_contact_id('tenant')
        )
        or property_id in (
          select p.id
          from public.properties p
          where p.landlord_contact_id = public.current_portal_contact_id('landlord')
        )
      );
  end if;
end $$;
