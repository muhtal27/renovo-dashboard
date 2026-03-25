-- Production cutover prep for Supabase project xutrbzlojglfydolnfof.
--
-- Applies only the targeted pre-cutover fixes:
-- 1. create missing marketing tables used by the live frontend
-- 2. create the inspection-files storage bucket
-- 3. enable the vector extension expected by Alembic revision 20260324_0001
-- 4. stamp alembic_version at 20260324_0002 after verifying the expected app tables exist

begin;

create extension if not exists vector with schema extensions;

create table if not exists public.waitlist_signups (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    agency_name text not null,
    status text not null default 'new',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists waitlist_signups_email_key
    on public.waitlist_signups (email);

alter table public.waitlist_signups enable row level security;

create table if not exists public.contact_submissions (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    work_email text not null,
    company_name text,
    enquiry_type text not null,
    portfolio_size text,
    message text not null,
    source_page text not null default '/contact',
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.contact_submissions enable row level security;

insert into storage.buckets (id, name, public)
values ('inspection-files', 'inspection-files', false)
on conflict (id) do nothing;

create table if not exists public.alembic_version (
    version_num varchar(32) primary key
);

do $$
declare
    required_table text;
    required_tables text[] := array[
        'tenants',
        'properties',
        'inspections',
        'tenancies',
        'cases',
        'claims',
        'documents',
        'evidence',
        'issues',
        'messages',
        'recommendations',
        'issue_evidence_links'
    ];
begin
    foreach required_table in array required_tables loop
        if not exists (
            select 1
            from information_schema.tables
            where table_schema = 'public'
              and table_name = required_table
        ) then
            raise exception
                'Refusing to stamp alembic_version: required table public.% is missing.',
                required_table;
        end if;
    end loop;

    if exists (
        select 1
        from public.alembic_version
        where version_num <> '20260324_0002'
    ) then
        raise exception
            'Refusing to overwrite unexpected alembic_version row. Expected only 20260324_0002.';
    end if;

    if not exists (
        select 1
        from public.alembic_version
        where version_num = '20260324_0002'
    ) then
        delete from public.alembic_version;

        insert into public.alembic_version (version_num)
        values ('20260324_0002');
    end if;
end $$;

commit;
