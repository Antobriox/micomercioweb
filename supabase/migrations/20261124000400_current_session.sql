begin;

create or replace function public.is_active_customer() returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select exists (
    select 1 from public.profiles p
    join auth.sessions s on s.user_id = p.user_id
    where p.user_id = (select auth.uid())
      and p.verified_at is not null and p.disabled_at is null
      and (s.not_after is null or s.not_after > now())
      and s.id = ((nullif(current_setting('request.jwt.claims', true), '')::jsonb) ->> 'session_id')::uuid
  );
  $$;

commit;
