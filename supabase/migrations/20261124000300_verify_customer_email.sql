begin;

create function public.sync_confirmed_email() returns trigger
  language plpgsql security definer set search_path = '' as $$
  begin
    update public.profiles
      set email = lower(trim(new.email)), verified_at = new.email_confirmed_at, updated_at = now()
      where user_id = new.id and
        (email is distinct from lower(trim(new.email)) or verified_at is distinct from new.email_confirmed_at);
    return new;
  end;
  $$;

revoke all on function public.sync_confirmed_email() from public, anon, authenticated;

create trigger sync_customer_email_after_auth_change after update of email, email_confirmed_at on auth.users
  for each row
  when (new.email is not null and
    (old.email is distinct from new.email or old.email_confirmed_at is distinct from new.email_confirmed_at))
  execute function public.sync_confirmed_email();

commit;
