alter table public.knowledge_articles
  add column if not exists source_url text,
  add column if not exists source_authority text not null default 'internal',
  add column if not exists jurisdiction text not null default 'scotland',
  add column if not exists audience text[] not null default '{}'::text[],
  add column if not exists article_kind text not null default 'guidance',
  add column if not exists review_status text not null default 'draft',
  add column if not exists reviewed_at timestamptz,
  add column if not exists effective_from date,
  add column if not exists source_updated_at date,
  add column if not exists keywords text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'knowledge_articles_source_authority_check'
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_source_authority_check
      check (source_authority in ('official', 'operator', 'internal'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'knowledge_articles_jurisdiction_check'
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_jurisdiction_check
      check (jurisdiction in ('scotland', 'uk', 'england', 'wales', 'mixed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'knowledge_articles_article_kind_check'
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_article_kind_check
      check (article_kind in ('guidance', 'faq', 'process', 'legal_summary', 'template', 'policy'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'knowledge_articles_review_status_check'
  ) then
    alter table public.knowledge_articles
      add constraint knowledge_articles_review_status_check
      check (review_status in ('draft', 'approved', 'archived'));
  end if;
end $$;

create unique index if not exists knowledge_articles_source_url_unique
  on public.knowledge_articles (source_url)
  where source_url is not null;

create index if not exists knowledge_articles_active_review_idx
  on public.knowledge_articles (jurisdiction, review_status, is_active);

create index if not exists knowledge_articles_content_tsv_idx
  on public.knowledge_articles
  using gin (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(content, '') || ' ' || array_to_string(keywords, ' ')
    )
  );

create table if not exists public.knowledge_article_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.knowledge_articles(id) on delete cascade,
  chunk_index integer not null,
  heading text,
  content text not null,
  source_url text,
  jurisdiction text not null default 'scotland',
  review_status text not null default 'draft',
  keywords text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, chunk_index)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'knowledge_article_chunks_jurisdiction_check'
  ) then
    alter table public.knowledge_article_chunks
      add constraint knowledge_article_chunks_jurisdiction_check
      check (jurisdiction in ('scotland', 'uk', 'england', 'wales', 'mixed'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'knowledge_article_chunks_review_status_check'
  ) then
    alter table public.knowledge_article_chunks
      add constraint knowledge_article_chunks_review_status_check
      check (review_status in ('draft', 'approved', 'archived'));
  end if;
end $$;

create index if not exists knowledge_article_chunks_article_id_idx
  on public.knowledge_article_chunks (article_id, chunk_index);

create index if not exists knowledge_article_chunks_content_tsv_idx
  on public.knowledge_article_chunks
  using gin (
    to_tsvector(
      'english',
      coalesce(heading, '') || ' ' || coalesce(content, '') || ' ' || array_to_string(keywords, ' ')
    )
  );

insert into public.knowledge_articles (
  title,
  category,
  content,
  is_active,
  source_url,
  source_authority,
  jurisdiction,
  audience,
  article_kind,
  review_status,
  reviewed_at,
  effective_from,
  source_updated_at,
  keywords,
  updated_at
)
values
  (
    'Scotland private residential tenancy overview for tenants',
    'private_residential_tenancy',
    'Scotland private residential tenancies apply to most new private tenancies that started on or after 1 December 2017. The tenancy is open-ended, the tenant must get written terms and supporting notes, and the landlord cannot avoid PRT protections by calling the agreement something else. Annabelle should use this as the baseline when a tenant asks what kind of tenancy they have, what written documents they should receive, or whether a tenancy automatically ends at a fixed date.',
    true,
    'https://www.gov.scot/publications/private-residential-tenancies-tenants-guide/',
    'official',
    'scotland',
    array['tenant', 'operator'],
    'legal_summary',
    'approved',
    now(),
    '2017-12-01',
    '2025-06-19',
    array['scotland', 'prt', 'private residential tenancy', 'tenant rights', 'written terms']
  ),
  (
    'Scotland private residential tenancy overview for landlords',
    'private_residential_tenancy',
    'For most new Scottish private lets from 1 December 2017 onward, the landlord is dealing with a private residential tenancy. The landlord must provide written tenancy terms and the correct notes, and any attempt to use a different tenancy label does not remove the tenant''s statutory protections. Annabelle should use this source for landlord-side explanations of written terms, the model tenancy, and the basic structure of PRT obligations.',
    true,
    'https://www.gov.scot/publications/private-residential-tenancies-landlords-guide/',
    'official',
    'scotland',
    array['landlord', 'operator'],
    'legal_summary',
    'approved',
    now(),
    '2017-12-01',
    '2024-04-09',
    array['scotland', 'prt', 'landlord duties', 'written tenancy terms', 'model tenancy']
  ),
  (
    'Scotland landlord registration essentials',
    'landlord_registration',
    'A private landlord in Scotland normally must register before letting property, unless a specific exemption applies. Registration must be renewed every 3 years, adverts need a landlord registration number or pending wording, and letting without registration can be a criminal offence with significant fines. Annabelle should use this source when explaining whether a landlord can lawfully market or let a property and what proof should appear on listings.',
    true,
    'https://www.mygov.scot/renting-your-property-out/registration',
    'official',
    'scotland',
    array['landlord', 'operator'],
    'guidance',
    'approved',
    now(),
    null,
    '2025-04-01',
    array['scotland', 'landlord registration', 'advertising', 'landlord register', 'renewal']
  ),
  (
    'Scotland tenancy deposit protection requirements',
    'deposit',
    'In Scotland a landlord normally must protect a tenancy deposit in an approved scheme within 30 working days of the tenancy starting. The approved schemes are Letting Protection Service Scotland, mydeposits Scotland, and SafeDeposits Scotland. If the deposit is not protected, the tenant can apply to the First-tier Tribunal and may seek an order for protection, return, or compensation. Annabelle should use this source for deposit timing, approved schemes, and escalation to tribunal routes.',
    true,
    'https://www.mygov.scot/landlord-deposit/protection',
    'official',
    'scotland',
    array['tenant', 'landlord', 'operator'],
    'guidance',
    'approved',
    now(),
    null,
    '2025-04-01',
    array['scotland', 'deposit', 'tenancy deposit scheme', '30 working days', 'tribunal']
  ),
  (
    'Scotland repairing standard for private landlords',
    'repairs',
    'Scottish private landlords must meet the repairing standard. The guidance covers the structure and exterior, installations for water, gas, electricity, sanitation, heating and hot water, fire and carbon monoxide safety, and newer expectations around safe access to common parts, safe common doors, residual current devices, and lead pipes. Annabelle should use this for repair obligations and for deciding when a maintenance issue is a legal compliance concern rather than just routine wear and tear.',
    true,
    'https://www.gov.scot/publications/repairing-standard-statutory-guidance-private-landlords/',
    'official',
    'scotland',
    array['tenant', 'landlord', 'operator'],
    'guidance',
    'approved',
    now(),
    '2024-03-01',
    '2024-01-31',
    array['scotland', 'repairing standard', 'repairs', 'safety', 'heating', 'hot water']
  ),
  (
    'Scotland private residential tenancy rent increases',
    'rent_increase',
    'For a Scottish private residential tenancy, rent can normally only be increased once in a 12-month period and the landlord must usually give at least 3 months'' written notice using the correct form. There are currently no Rent Pressure Zones in Scotland. Annabelle should use this when tenants or landlords ask whether a proposed increase is valid, whether the right form is needed, and whether rent caps currently apply in Scotland.',
    true,
    'https://www.mygov.scot/landlord-rent-increases/private-residential-tenancy',
    'official',
    'scotland',
    array['tenant', 'landlord', 'operator'],
    'guidance',
    'approved',
    now(),
    null,
    '2025-10-10',
    array['scotland', 'rent increase', 'prt', '3 months notice', 'once per 12 months']
  ),
  (
    'Scotland notice to leave and eviction process for private residential tenancy',
    'eviction',
    'To end a Scottish private residential tenancy, the landlord must serve a valid notice to leave that states the eviction ground and notice period. If the tenant does not leave, the landlord generally must apply to the First-tier Tribunal for Scotland (Housing and Property Chamber) for an eviction order. Annabelle should use this for high-level process explanations but hand off if the caller needs case-specific legal advice or wants to challenge an eviction.',
    true,
    'https://www.mygov.scot/tenant-eviction/private-residential-tenancy',
    'official',
    'scotland',
    array['tenant', 'landlord', 'operator'],
    'guidance',
    'approved',
    now(),
    null,
    '2025-09-10',
    array['scotland', 'notice to leave', 'eviction', 'tribunal', 'prt']
  )
on conflict (source_url) do update
set
  title = excluded.title,
  category = excluded.category,
  content = excluded.content,
  is_active = excluded.is_active,
  source_authority = excluded.source_authority,
  jurisdiction = excluded.jurisdiction,
  audience = excluded.audience,
  article_kind = excluded.article_kind,
  review_status = excluded.review_status,
  reviewed_at = excluded.reviewed_at,
  effective_from = excluded.effective_from,
  source_updated_at = excluded.source_updated_at,
  keywords = excluded.keywords,
  updated_at = now();

insert into public.knowledge_article_chunks (
  article_id,
  chunk_index,
  heading,
  content,
  source_url,
  jurisdiction,
  review_status,
  keywords,
  updated_at
)
select
  ka.id,
  0,
  ka.title,
  ka.content,
  ka.source_url,
  ka.jurisdiction,
  ka.review_status,
  ka.keywords,
  now()
from public.knowledge_articles ka
where ka.source_authority = 'official'
  and ka.review_status = 'approved'
  and ka.jurisdiction = 'scotland'
on conflict (article_id, chunk_index) do update
set
  heading = excluded.heading,
  content = excluded.content,
  source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction,
  review_status = excluded.review_status,
  keywords = excluded.keywords,
  updated_at = now();

create or replace function public.search_scotland_knowledge(search_query text, match_limit integer default 8)
returns table (
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
  score real
)
language sql
stable
as $$
  with ranked_chunks as (
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
      ts_rank(
        to_tsvector(
          'english',
          coalesce(kac.heading, '') || ' ' || coalesce(kac.content, '') || ' ' || array_to_string(kac.keywords, ' ')
        ),
        plainto_tsquery('english', search_query)
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
        or to_tsvector(
          'english',
          coalesce(kac.heading, '') || ' ' || coalesce(kac.content, '') || ' ' || array_to_string(kac.keywords, ' ')
        ) @@ plainto_tsquery('english', search_query)
      )
  ),
  ranked_articles as (
    select
      ka.id as article_id,
      null::uuid as chunk_id,
      ka.title,
      ka.category,
      left(ka.content, 400) as snippet,
      ka.source_url,
      ka.source_authority,
      ka.jurisdiction,
      ka.review_status,
      ka.source_updated_at,
      ts_rank(
        to_tsvector(
          'english',
          coalesce(ka.title, '') || ' ' || coalesce(ka.category, '') || ' ' || coalesce(ka.content, '') || ' ' || array_to_string(ka.keywords, ' ')
        ),
        plainto_tsquery('english', search_query)
      ) as score
    from public.knowledge_articles ka
    where ka.is_active = true
      and ka.review_status = 'approved'
      and ka.source_authority = 'official'
      and ka.jurisdiction = 'scotland'
      and (
        search_query is null
        or btrim(search_query) = ''
        or to_tsvector(
          'english',
          coalesce(ka.title, '') || ' ' || coalesce(ka.category, '') || ' ' || coalesce(ka.content, '') || ' ' || array_to_string(ka.keywords, ' ')
        ) @@ plainto_tsquery('english', search_query)
      )
  )
  select *
  from (
    select * from ranked_chunks
    union all
    select * from ranked_articles
  ) combined
  order by score desc nulls last, source_updated_at desc nulls last, title asc
  limit greatest(coalesce(match_limit, 8), 1);
$$;
