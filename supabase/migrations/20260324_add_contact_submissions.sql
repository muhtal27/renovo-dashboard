create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  work_email text not null,
  company_name text,
  enquiry_type text not null check (
    enquiry_type in ('Early access', 'Partnerships', 'Investor enquiry', 'General enquiry')
  ),
  portfolio_size text check (
    portfolio_size is null
    or portfolio_size in (
      'Solo / independent',
      '1-100 properties',
      '100-500 properties',
      '500+ properties'
    )
  ),
  message text not null,
  source_page text not null default '/contact',
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_work_email_idx
  on public.contact_submissions (lower(work_email));

alter table public.contact_submissions enable row level security;

create policy contact_submissions_operator_all
  on public.contact_submissions
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());
