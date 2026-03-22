-- Multiple portal action functions insert messages with message_type = 'portal_signal'
-- but the existing CHECK constraint does not include this value.

do $$
declare
  constraint_name text;
begin
  select con.conname
  into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'messages'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%message_type%';

  if constraint_name is not null then
    execute format('alter table public.messages drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type = any (array[
    'text',
    'email',
    'call_summary',
    'note',
    'system',
    'attachment',
    'portal_signal'
  ]));
