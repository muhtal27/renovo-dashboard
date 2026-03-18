create or replace function public.landlord_portal_can_read_quote(target_quote_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.maintenance_quotes mq
    join public.maintenance_requests mr
      on mr.id = mq.maintenance_request_id
    where mq.id = target_quote_id
      and public.current_portal_contact_id('landlord') is not null
      and (
        (mr.property_id is not null and public.portal_can_read_property(mr.property_id))
        or (mr.case_id is not null and public.portal_can_read_case(mr.case_id))
      )
  );
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'maintenance_quotes'
      and policyname = 'maintenance_quotes_portal_select'
  ) then
    execute $policy$
      alter policy maintenance_quotes_portal_select
        on public.maintenance_quotes
        using (
          contractor_id = public.current_portal_contractor_id()
          or public.landlord_portal_can_read_quote(id)
        )
    $policy$;
  else
    create policy maintenance_quotes_portal_select
      on public.maintenance_quotes
      for select
      to authenticated
      using (
        contractor_id = public.current_portal_contractor_id()
        or public.landlord_portal_can_read_quote(id)
      );
  end if;
end $$;

create or replace function public.landlord_approve_quote(
  target_quote_id uuid,
  approval_note text default null
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_contact_id uuid;
  target_quote public.maintenance_quotes%rowtype;
  target_request public.maintenance_requests%rowtype;
  contractor_label text;
  amount_label text;
  note_text text;
  signal_message text;
  inserted_message public.messages;
begin
  actor_contact_id := public.current_portal_contact_id('landlord');
  note_text := nullif(btrim(approval_note), '');

  if actor_contact_id is null then
    raise exception 'Landlord portal access is not available for this user';
  end if;

  if target_quote_id is null then
    raise exception 'A quote id is required';
  end if;

  if not public.landlord_portal_can_read_quote(target_quote_id) then
    raise exception 'You do not have access to this quote';
  end if;

  select *
  into target_quote
  from public.maintenance_quotes
  where id = target_quote_id;

  if not found then
    raise exception 'Quote not found';
  end if;

  select *
  into target_request
  from public.maintenance_requests
  where id = target_quote.maintenance_request_id;

  if not found then
    raise exception 'Maintenance request not found for this quote';
  end if;

  if target_request.case_id is null then
    raise exception 'This quote is not linked to a case yet';
  end if;

  if coalesce(target_request.status, '') in ('completed', 'cancelled') then
    raise exception 'This maintenance request can no longer be approved';
  end if;

  if coalesce(target_quote.quote_status, '') = 'accepted'
    and coalesce(target_request.landlord_approval_required, false) = false then
    raise exception 'This quote has already been approved';
  end if;

  select coalesce(nullif(btrim(company_name), ''), nullif(btrim(primary_trade), ''))
  into contractor_label
  from public.contractors
  where id = target_quote.contractor_id;

  contractor_label := coalesce(contractor_label, 'the selected contractor');
  amount_label := case
    when target_quote.quote_amount is null then 'the submitted amount'
    else 'GBP ' || trim(to_char(target_quote.quote_amount, 'FM999,999,999,990.00'))
  end;

  signal_message := format('Landlord approved %s from %s.', amount_label, contractor_label);

  if note_text is not null then
    signal_message := signal_message || ' Note: ' || note_text;
  end if;

  update public.maintenance_quotes
  set quote_status = 'accepted'
  where id = target_quote_id;

  update public.maintenance_requests
  set
    status = case
      when status in ('completed', 'cancelled') then status
      else 'approved'
    end,
    landlord_approval_required = false,
    contractor_id = coalesce(target_quote.contractor_id, contractor_id),
    estimated_cost = coalesce(target_quote.quote_amount, estimated_cost),
    updated_at = now()
  where id = target_request.id;

  update public.cases
  set
    last_activity_at = now(),
    last_customer_message_at = now(),
    updated_at = now(),
    waiting_on = 'internal',
    waiting_reason = signal_message,
    next_action_at = now()
  where id = target_request.case_id;

  insert into public.messages (
    case_id,
    channel,
    sender_type,
    message_text,
    sender_contact_id,
    direction,
    message_type,
    created_at
  )
  values (
    target_request.case_id,
    'portal',
    'contact',
    signal_message,
    actor_contact_id,
    'inbound',
    'portal_signal',
    now()
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.landlord_approve_quote(uuid, text) to authenticated;

create or replace function public.landlord_case_signal(
  target_case_id uuid,
  signal_type text,
  detail_text text default null
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_contact_id uuid;
  normalized_signal text;
  note_text text;
  signal_message text;
  inserted_message public.messages;
begin
  actor_contact_id := public.current_portal_contact_id('landlord');
  normalized_signal := lower(coalesce(signal_type, ''));
  note_text := nullif(btrim(detail_text), '');

  if actor_contact_id is null then
    raise exception 'Landlord portal access is not available for this user';
  end if;

  if target_case_id is null then
    raise exception 'A case id is required';
  end if;

  if normalized_signal not in ('need_more_detail', 'request_callback') then
    raise exception 'Unsupported landlord signal';
  end if;

  if not public.portal_can_read_case(target_case_id) then
    raise exception 'You do not have access to this case';
  end if;

  if normalized_signal = 'need_more_detail' and note_text is null then
    raise exception 'Add a short note about the detail you need';
  end if;

  if normalized_signal = 'need_more_detail' then
    signal_message := 'Landlord asked for more detail: ' || note_text;
  else
    signal_message := 'Landlord requested a callback.';

    if note_text is not null then
      signal_message := signal_message || ' Note: ' || note_text;
    end if;
  end if;

  update public.cases
  set
    last_activity_at = now(),
    last_customer_message_at = now(),
    updated_at = now(),
    waiting_on = 'internal',
    waiting_reason = signal_message,
    next_action_at = now()
  where id = target_case_id;

  insert into public.messages (
    case_id,
    channel,
    sender_type,
    message_text,
    sender_contact_id,
    direction,
    message_type,
    created_at
  )
  values (
    target_case_id,
    'portal',
    'contact',
    signal_message,
    actor_contact_id,
    'inbound',
    'portal_signal',
    now()
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.landlord_case_signal(uuid, text, text) to authenticated;
