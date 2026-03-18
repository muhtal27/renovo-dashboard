update public.users_profiles up
set auth_user_id = au.id,
    updated_at = now()
from auth.users au
where up.auth_user_id is null
  and up.email is not null
  and lower(up.email) = lower(au.email);
