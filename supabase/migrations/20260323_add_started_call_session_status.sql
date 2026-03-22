-- The ingest_inbound_call function inserts call sessions with status = 'started'
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
    and rel.relname = 'call_sessions'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%status%'
    and pg_get_constraintdef(con.oid) ilike '%initiated%';

  if constraint_name is not null then
    execute format('alter table public.call_sessions drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.call_sessions
  add constraint call_sessions_status_check
  check (status is null or status = any (array[
    'initiated',
    'ringing',
    'started',
    'in_progress',
    'completed',
    'failed',
    'voicemail',
    'abandoned'
  ]));
