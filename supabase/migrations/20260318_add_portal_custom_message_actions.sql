create or replace function public.landlord_add_case_update(target_case_id uuid, update_text text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_contact_id uuid;
  note_text text;
  inserted_message public.messages;
begin
  actor_contact_id := public.current_portal_contact_id('landlord');
  note_text := nullif(btrim(update_text), '');

  if actor_contact_id is null then
    raise exception 'Landlord portal access is not available for this user';
  end if;

  if target_case_id is null then
    raise exception 'A case id is required';
  end if;

  if note_text is null then
    raise exception 'Please add a short message before sending';
  end if;

  if not public.portal_can_read_case(target_case_id) then
    raise exception 'You do not have access to this case';
  end if;

  update public.cases
  set
    last_activity_at = now(),
    last_customer_message_at = now(),
    updated_at = now(),
    waiting_on = 'internal',
    waiting_reason = 'Landlord sent a fresh update from the portal.',
    next_action_at = coalesce(next_action_at, now())
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
    note_text,
    actor_contact_id,
    'inbound',
    'text',
    now()
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.landlord_add_case_update(uuid, text) to authenticated;

create or replace function public.contractor_add_case_update(target_case_id uuid, update_text text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_contact_id uuid;
  note_text text;
  inserted_message public.messages;
begin
  actor_contact_id := public.current_portal_contact_id('contractor');
  note_text := nullif(btrim(update_text), '');

  if actor_contact_id is null then
    raise exception 'Contractor portal access is not available for this user';
  end if;

  if target_case_id is null then
    raise exception 'A case id is required';
  end if;

  if note_text is null then
    raise exception 'Please add a short message before sending';
  end if;

  if not public.portal_can_read_case(target_case_id) then
    raise exception 'You do not have access to this case';
  end if;

  update public.cases
  set
    last_activity_at = now(),
    last_customer_message_at = now(),
    updated_at = now(),
    waiting_on = 'internal',
    waiting_reason = 'Contractor sent a fresh update from the portal.',
    next_action_at = coalesce(next_action_at, now())
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
    note_text,
    actor_contact_id,
    'inbound',
    'text',
    now()
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.contractor_add_case_update(uuid, text) to authenticated;
