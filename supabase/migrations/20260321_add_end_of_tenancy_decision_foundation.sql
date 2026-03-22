alter table public.cases
  add column if not exists is_end_of_tenancy boolean not null default false;

create index if not exists cases_end_of_tenancy_idx
  on public.cases (status, updated_at desc)
  where is_end_of_tenancy = true;

create table if not exists public.end_of_tenancy_cases (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  tenancy_id uuid not null references public.tenancies(id) on delete restrict,
  deposit_claim_id uuid references public.deposit_claims(id) on delete set null,
  workflow_status text not null default 'evidence_pending' check (
    workflow_status in (
      'evidence_pending',
      'evidence_ready',
      'recommendation_ready',
      'under_review',
      'closed'
    )
  ),
  inspection_status text not null default 'not_started' check (
    inspection_status in ('not_started', 'scheduled', 'completed', 'waived')
  ),
  move_out_date date,
  inspection_date date,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists end_of_tenancy_cases_tenancy_status_idx
  on public.end_of_tenancy_cases (tenancy_id, workflow_status, updated_at desc);

create index if not exists end_of_tenancy_cases_deposit_claim_idx
  on public.end_of_tenancy_cases (deposit_claim_id)
  where deposit_claim_id is not null;

create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  tenancy_document_id uuid references public.tenancy_documents(id) on delete set null,
  message_attachment_id uuid references public.message_attachments(id) on delete set null,
  uploaded_by_user_id uuid references public.users_profiles(id) on delete set null,
  document_role text not null default 'supporting_evidence' check (
    document_role in (
      'check_in',
      'check_out',
      'invoice',
      'receipt',
      'photo',
      'video',
      'email',
      'message_attachment',
      'tenancy_agreement',
      'deposit_scheme',
      'supporting_evidence',
      'other'
    )
  ),
  source_type text not null default 'manual_upload' check (
    source_type in ('tenancy_document', 'message_attachment', 'manual_upload', 'generated', 'external')
  ),
  file_name text,
  file_url text,
  storage_path text,
  mime_type text,
  checksum text,
  captured_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    tenancy_document_id is not null
    or message_attachment_id is not null
    or file_url is not null
    or storage_path is not null
  )
);

create index if not exists case_documents_case_role_idx
  on public.case_documents (case_id, document_role, created_at desc);

create index if not exists case_documents_tenancy_document_idx
  on public.case_documents (tenancy_document_id)
  where tenancy_document_id is not null;

create index if not exists case_documents_message_attachment_idx
  on public.case_documents (message_attachment_id)
  where message_attachment_id is not null;

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  case_document_id uuid not null references public.case_documents(id) on delete cascade,
  ai_run_id uuid references public.ai_runs(id) on delete set null,
  extraction_kind text not null default 'structured' check (
    extraction_kind in ('ocr', 'classification', 'structured', 'summary')
  ),
  status text not null default 'completed' check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  extracted_text text,
  extracted_data jsonb not null default '{}'::jsonb,
  confidence numeric(5, 4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_extractions_document_idx
  on public.document_extractions (case_document_id, created_at desc);

create index if not exists document_extractions_ai_run_idx
  on public.document_extractions (ai_run_id)
  where ai_run_id is not null;

create table if not exists public.end_of_tenancy_issues (
  id uuid primary key default gen_random_uuid(),
  end_of_tenancy_case_id uuid not null references public.end_of_tenancy_cases(id) on delete cascade,
  identified_by_ai_run_id uuid references public.ai_runs(id) on delete set null,
  created_by_user_id uuid references public.users_profiles(id) on delete set null,
  issue_type text not null check (
    issue_type in (
      'cleaning',
      'damage',
      'missing_item',
      'repair',
      'redecoration',
      'gardening',
      'rubbish_removal',
      'rent_arrears',
      'utilities',
      'other'
    )
  ),
  title text not null,
  description text,
  room_area text,
  status text not null default 'open' check (
    status in ('open', 'under_review', 'accepted', 'rejected', 'resolved')
  ),
  responsibility text not null default 'undetermined' check (
    responsibility in ('tenant', 'landlord', 'shared', 'undetermined')
  ),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  proposed_amount numeric(12, 2) check (proposed_amount is null or proposed_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists end_of_tenancy_issues_case_status_idx
  on public.end_of_tenancy_issues (end_of_tenancy_case_id, status, created_at desc);

create index if not exists end_of_tenancy_issues_ai_run_idx
  on public.end_of_tenancy_issues (identified_by_ai_run_id)
  where identified_by_ai_run_id is not null;

create table if not exists public.issue_evidence_links (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.end_of_tenancy_issues(id) on delete cascade,
  case_document_id uuid not null references public.case_documents(id) on delete cascade,
  document_extraction_id uuid references public.document_extractions(id) on delete set null,
  link_type text not null default 'supports' check (
    link_type in ('supports', 'contradicts', 'context')
  ),
  excerpt text,
  page_number integer check (page_number is null or page_number > 0),
  locator jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists issue_evidence_links_issue_idx
  on public.issue_evidence_links (issue_id, created_at desc);

create index if not exists issue_evidence_links_document_idx
  on public.issue_evidence_links (case_document_id, page_number);

create index if not exists issue_evidence_links_extraction_idx
  on public.issue_evidence_links (document_extraction_id)
  where document_extraction_id is not null;

create table if not exists public.decision_recommendations (
  id uuid primary key default gen_random_uuid(),
  end_of_tenancy_case_id uuid not null references public.end_of_tenancy_cases(id) on delete cascade,
  ai_run_id uuid references public.ai_runs(id) on delete set null,
  reviewed_by_user_id uuid references public.users_profiles(id) on delete set null,
  recommendation_status text not null default 'draft' check (
    recommendation_status in (
      'draft',
      'pending_review',
      'reviewed',
      'accepted',
      'rejected',
      'superseded'
    )
  ),
  recommended_outcome text not null default 'no_decision' check (
    recommended_outcome in (
      'no_action',
      'partial_claim',
      'full_claim',
      'insufficient_evidence',
      'refer_to_human',
      'no_decision'
    )
  ),
  decision_summary text,
  rationale text,
  total_recommended_amount numeric(12, 2) check (
    total_recommended_amount is null or total_recommended_amount >= 0
  ),
  human_review_required boolean not null default true,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decision_recommendations_case_idx
  on public.decision_recommendations (end_of_tenancy_case_id, created_at desc);

create index if not exists decision_recommendations_status_idx
  on public.decision_recommendations (recommendation_status, created_at desc);

create index if not exists decision_recommendations_ai_run_idx
  on public.decision_recommendations (ai_run_id)
  where ai_run_id is not null;

create table if not exists public.decision_recommendation_sources (
  id uuid primary key default gen_random_uuid(),
  decision_recommendation_id uuid not null references public.decision_recommendations(id) on delete cascade,
  source_type text not null check (
    source_type in (
      'issue',
      'issue_evidence_link',
      'case_document',
      'document_extraction',
      'knowledge_article',
      'knowledge_article_chunk',
      'deposit_claim'
    )
  ),
  issue_id uuid references public.end_of_tenancy_issues(id) on delete set null,
  issue_evidence_link_id uuid references public.issue_evidence_links(id) on delete set null,
  case_document_id uuid references public.case_documents(id) on delete set null,
  document_extraction_id uuid references public.document_extractions(id) on delete set null,
  knowledge_article_id uuid references public.knowledge_articles(id) on delete set null,
  knowledge_article_chunk_id uuid references public.knowledge_article_chunks(id) on delete set null,
  deposit_claim_id uuid references public.deposit_claims(id) on delete set null,
  source_note text,
  created_at timestamptz not null default now(),
  check (
    num_nonnulls(
      issue_id,
      issue_evidence_link_id,
      case_document_id,
      document_extraction_id,
      knowledge_article_id,
      knowledge_article_chunk_id,
      deposit_claim_id
    ) = 1
  )
);

create index if not exists decision_recommendation_sources_recommendation_idx
  on public.decision_recommendation_sources (decision_recommendation_id, source_type);

create table if not exists public.deposit_claim_line_items (
  id uuid primary key default gen_random_uuid(),
  deposit_claim_id uuid not null references public.deposit_claims(id) on delete cascade,
  end_of_tenancy_issue_id uuid references public.end_of_tenancy_issues(id) on delete set null,
  decision_recommendation_id uuid references public.decision_recommendations(id) on delete set null,
  line_item_status text not null default 'draft' check (
    line_item_status in ('draft', 'proposed', 'submitted', 'agreed', 'disputed', 'withdrawn', 'resolved')
  ),
  category text not null check (
    category in (
      'cleaning',
      'damage',
      'missing_item',
      'repair',
      'redecoration',
      'gardening',
      'rubbish_removal',
      'rent_arrears',
      'utilities',
      'fees',
      'other'
    )
  ),
  description text not null,
  amount_claimed numeric(12, 2) not null check (amount_claimed >= 0),
  amount_agreed numeric(12, 2) check (amount_agreed is null or amount_agreed >= 0),
  amount_awarded numeric(12, 2) check (amount_awarded is null or amount_awarded >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deposit_claim_line_items_claim_idx
  on public.deposit_claim_line_items (deposit_claim_id, line_item_status, created_at desc);

create index if not exists deposit_claim_line_items_issue_idx
  on public.deposit_claim_line_items (end_of_tenancy_issue_id)
  where end_of_tenancy_issue_id is not null;

create index if not exists deposit_claim_line_items_recommendation_idx
  on public.deposit_claim_line_items (decision_recommendation_id)
  where decision_recommendation_id is not null;

create table if not exists public.decision_review_actions (
  id uuid primary key default gen_random_uuid(),
  decision_recommendation_id uuid not null references public.decision_recommendations(id) on delete cascade,
  actor_user_id uuid references public.users_profiles(id) on delete set null,
  ai_run_id uuid references public.ai_runs(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user', 'system', 'ai')),
  action_type text not null check (
    action_type in (
      'submitted_for_review',
      'commented',
      'approved',
      'rejected',
      'edited',
      'sent_back',
      'superseded'
    )
  ),
  action_notes text,
  created_at timestamptz not null default now()
);

create index if not exists decision_review_actions_recommendation_idx
  on public.decision_review_actions (decision_recommendation_id, created_at desc);

create index if not exists decision_review_actions_actor_idx
  on public.decision_review_actions (actor_user_id, created_at desc)
  where actor_user_id is not null;

create or replace function public.sync_end_of_tenancy_case_context()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  case_record public.cases%rowtype;
begin
  select *
  into case_record
  from public.cases
  where id = new.case_id;

  if not found then
    raise exception 'Case % was not found', new.case_id;
  end if;

  if new.tenancy_id is null then
    new.tenancy_id := case_record.tenancy_id;
  end if;

  if new.tenancy_id is null then
    raise exception 'End-of-tenancy case % requires a tenancy_id', new.case_id;
  end if;

  if new.workflow_status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  elsif new.workflow_status <> 'closed' then
    new.closed_at := null;
  end if;

  return new;
end;
$$;

create or replace function public.mark_case_as_end_of_tenancy()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.cases
  set is_end_of_tenancy = true,
      updated_at = now()
  where id = new.case_id
    and is_end_of_tenancy is distinct from true;

  return new;
end;
$$;

drop trigger if exists trg_end_of_tenancy_cases_sync_context on public.end_of_tenancy_cases;
create trigger trg_end_of_tenancy_cases_sync_context
before insert or update on public.end_of_tenancy_cases
for each row
execute function public.sync_end_of_tenancy_case_context();

drop trigger if exists trg_end_of_tenancy_cases_mark_case on public.end_of_tenancy_cases;
create trigger trg_end_of_tenancy_cases_mark_case
after insert or update on public.end_of_tenancy_cases
for each row
execute function public.mark_case_as_end_of_tenancy();

drop trigger if exists trg_end_of_tenancy_cases_set_updated_at on public.end_of_tenancy_cases;
create trigger trg_end_of_tenancy_cases_set_updated_at
before update on public.end_of_tenancy_cases
for each row
execute function public.set_updated_at();

drop trigger if exists trg_case_documents_set_updated_at on public.case_documents;
create trigger trg_case_documents_set_updated_at
before update on public.case_documents
for each row
execute function public.set_updated_at();

drop trigger if exists trg_document_extractions_set_updated_at on public.document_extractions;
create trigger trg_document_extractions_set_updated_at
before update on public.document_extractions
for each row
execute function public.set_updated_at();

drop trigger if exists trg_end_of_tenancy_issues_set_updated_at on public.end_of_tenancy_issues;
create trigger trg_end_of_tenancy_issues_set_updated_at
before update on public.end_of_tenancy_issues
for each row
execute function public.set_updated_at();

drop trigger if exists trg_issue_evidence_links_set_updated_at on public.issue_evidence_links;
create trigger trg_issue_evidence_links_set_updated_at
before update on public.issue_evidence_links
for each row
execute function public.set_updated_at();

drop trigger if exists trg_decision_recommendations_set_updated_at on public.decision_recommendations;
create trigger trg_decision_recommendations_set_updated_at
before update on public.decision_recommendations
for each row
execute function public.set_updated_at();

drop trigger if exists trg_deposit_claim_line_items_set_updated_at on public.deposit_claim_line_items;
create trigger trg_deposit_claim_line_items_set_updated_at
before update on public.deposit_claim_line_items
for each row
execute function public.set_updated_at();

alter table public.end_of_tenancy_cases enable row level security;
alter table public.case_documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.end_of_tenancy_issues enable row level security;
alter table public.issue_evidence_links enable row level security;
alter table public.decision_recommendations enable row level security;
alter table public.decision_recommendation_sources enable row level security;
alter table public.deposit_claim_line_items enable row level security;
alter table public.decision_review_actions enable row level security;

drop policy if exists end_of_tenancy_cases_operator_all on public.end_of_tenancy_cases;
create policy end_of_tenancy_cases_operator_all
  on public.end_of_tenancy_cases
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists case_documents_operator_all on public.case_documents;
create policy case_documents_operator_all
  on public.case_documents
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists document_extractions_operator_all on public.document_extractions;
create policy document_extractions_operator_all
  on public.document_extractions
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists end_of_tenancy_issues_operator_all on public.end_of_tenancy_issues;
create policy end_of_tenancy_issues_operator_all
  on public.end_of_tenancy_issues
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists issue_evidence_links_operator_all on public.issue_evidence_links;
create policy issue_evidence_links_operator_all
  on public.issue_evidence_links
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists decision_recommendations_operator_all on public.decision_recommendations;
create policy decision_recommendations_operator_all
  on public.decision_recommendations
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists decision_recommendation_sources_operator_all on public.decision_recommendation_sources;
create policy decision_recommendation_sources_operator_all
  on public.decision_recommendation_sources
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists deposit_claim_line_items_operator_all on public.deposit_claim_line_items;
create policy deposit_claim_line_items_operator_all
  on public.deposit_claim_line_items
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());

drop policy if exists decision_review_actions_operator_all on public.decision_review_actions;
create policy decision_review_actions_operator_all
  on public.decision_review_actions
  for all
  to authenticated
  using (public.is_active_operator())
  with check (public.is_active_operator());
