-- The app code selects avatar_url from users_profiles but the column does not exist.
alter table public.users_profiles
  add column if not exists avatar_url text;
