alter table public.messages
  add column if not exists client_send_key text,
  add column if not exists source_draft_message_id uuid references public.messages(id);

create unique index if not exists messages_client_send_key_unique
  on public.messages (client_send_key)
  where client_send_key is not null;

create unique index if not exists messages_source_draft_message_id_unique
  on public.messages (source_draft_message_id)
  where source_draft_message_id is not null;
