begin;

create function public.update_my_contact(given text, family text, phone text, expected_version timestamptz)
  returns boolean language plpgsql security definer set search_path = '' as $$
  begin
    if not public.is_active_customer() then
      raise exception using errcode = '42501', message = 'access_denied';
    end if;

    update public.profiles
    set given_names = trim(given), family_names = trim(family), mobile = phone, updated_at = clock_timestamp()
    where user_id = (select auth.uid()) and updated_at = expected_version;
    return found;
  end;
  $$;

revoke all on function public.update_my_contact(text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.update_my_contact(text,text,text,timestamptz) to authenticated;

commit;
