create or replace function public.normalize_uk_phone(value text)
returns text
language plpgsql
immutable
as $$
declare
  raw text;
begin
  if value is null then
    return null;
  end if;

  raw := trim(value);

  if raw = '' or lower(raw) in ('null', 'undefined', 'none', 'n/a') then
    return null;
  end if;

  raw := regexp_replace(raw, '[^0-9+]+', '', 'g');

  if raw = '' then
    return null;
  end if;

  if left(raw, 2) = '00' then
    raw := '+' || substring(raw from 3);
  end if;

  if left(raw, 3) = '+44' then
    return '+44' || regexp_replace(substring(raw from 4), '^0+', '');
  end if;

  if raw ~ '^44[0-9]+$' then
    return '+' || raw;
  end if;

  if raw ~ '^0[0-9]+$' then
    return '+44' || substring(raw from 2);
  end if;

  return raw;
end;
$$;

create index if not exists contacts_normalized_phone_idx
  on public.contacts (public.normalize_uk_phone(phone))
  where phone is not null;

create index if not exists call_sessions_normalized_caller_phone_idx
  on public.call_sessions (public.normalize_uk_phone(caller_phone))
  where caller_phone is not null;
