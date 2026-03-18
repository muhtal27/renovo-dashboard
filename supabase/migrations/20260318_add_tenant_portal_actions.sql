create or replace function public.tenant_add_case_update(target_case_id uuid, update_text text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_contact_id uuid;
  inserted_message public.messages;
begin
  actor_contact_id := public.current_portal_contact_id('tenant');

  if actor_contact_id is null then
    raise exception 'Tenant portal access is not available for this user';
  end if;

  if target_case_id is null then
    raise exception 'A case id is required';
  end if;

  if nullif(btrim(update_text), '') is null then
    raise exception 'Please add a short update before sending';
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
    waiting_reason = 'Tenant sent a fresh update from the portal.',
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
    btrim(update_text),
    actor_contact_id,
    'inbound',
    'text',
    now()
  )
  returning * into inserted_message;

  return inserted_message;
end;
$$;

grant execute on function public.tenant_add_case_update(uuid, text) to authenticated;

create or replace function public.tenant_case_signal(target_case_id uuid, signal_type text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_contact_id uuid;
  normalized_signal text;
  signal_message text;
  inserted_message public.messages;
begin
  actor_contact_id := public.current_portal_contact_id('tenant');
  normalized_signal := lower(coalesce(signal_type, ''));

  if actor_contact_id is null then
    raise exception 'Tenant portal access is not available for this user';
  end if;

  if target_case_id is null then
    raise exception 'A case id is required';
  end if;

  if normalized_signal not in ('still_waiting', 'issue_resolved') then
    raise exception 'Unsupported tenant signal';
  end if;

  if not public.portal_can_read_case(target_case_id) then
    raise exception 'You do not have access to this case';
  end if;

  if normalized_signal = 'still_waiting' then
    signal_message := 'Tenant says they are still waiting for an update.';

    update public.cases
    set
      last_activity_at = now(),
      last_customer_message_at = now(),
      updated_at = now(),
      waiting_on = 'internal',
      waiting_reason = signal_message,
      next_action_at = now()
    where id = target_case_id;
  else
    signal_message := 'Tenant says the issue now looks resolved.';

    update public.cases
    set
      status = case when status in ('closed', 'cancelled') then status else 'resolved' end,
      last_activity_at = now(),
      last_customer_message_at = now(),
      updated_at = now(),
      waiting_on = 'none',
      waiting_reason = signal_message,
      next_action_at = null
    where id = target_case_id;
  end if;

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

grant execute on function public.tenant_case_signal(uuid, text) to authenticated;
