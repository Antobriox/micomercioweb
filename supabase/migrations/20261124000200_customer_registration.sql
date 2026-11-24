begin;

create function public.is_valid_ecuadorian_id(value text) returns boolean
  language plpgsql immutable strict set search_path = '' as $$
  declare
    province integer;
    digit integer;
    total integer := 0;
  begin
    if value !~ '^[0-9]{10}$' then return false; end if;
    province := substring(value from 1 for 2)::integer;
    if (province not between 1 and 24 and province <> 30) or substring(value from 3 for 1)::integer > 5 then
      return false;
    end if;
    for position in 1..9 loop
      digit := substring(value from position for 1)::integer * (case when position % 2 = 1 then 2 else 1 end);
      total := total + (case when digit > 9 then digit - 9 else digit end);
    end loop;
    return (10 - total % 10) % 10 = substring(value from 10 for 1)::integer;
  end;
  $$;

revoke all on function public.is_valid_ecuadorian_id(text) from public, anon, authenticated;

create function public.create_customer_profile() returns trigger
  language plpgsql security definer set search_path = '' as $$
  declare
    details jsonb := new.raw_user_meta_data -> 'web_registration';
    national_id_value text := trim(details ->> 'nationalId');
  begin
    if details is null then return new; end if;
    if jsonb_typeof(details) is distinct from 'object' or
       not coalesce(public.is_valid_ecuadorian_id(national_id_value), false) or
       new.email is null then
      raise exception using errcode = '23514', message = 'invalid_registration_profile';
    end if;

    insert into public.profiles (user_id, given_names, family_names, national_id, mobile, email, verified_at)
      values (new.id, trim(details ->> 'givenNames'), trim(details ->> 'familyNames'),
        national_id_value, details ->> 'mobile', lower(trim(new.email)), new.email_confirmed_at);

    update auth.users set raw_user_meta_data = raw_user_meta_data - 'web_registration' where id = new.id;
    return new;
  end;
  $$;

revoke all on function public.create_customer_profile() from public, anon, authenticated;

create trigger register_customer_profile after insert on auth.users
  for each row execute function public.create_customer_profile();

create function public.strip_registration_user_data() returns trigger
  language plpgsql set search_path = '' as $$
  begin
    new.raw_user_meta_data := new.raw_user_meta_data - 'web_registration';
    return new;
  end;
  $$;

revoke all on function public.strip_registration_user_data() from public, anon, authenticated;

create trigger remove_registration_user_data before update of raw_user_meta_data on auth.users
  for each row execute function public.strip_registration_user_data();

create function public.strip_registration_identity_data() returns trigger
  language plpgsql set search_path = '' as $$
  begin
    new.identity_data := new.identity_data - 'web_registration';
    return new;
  end;
  $$;

revoke all on function public.strip_registration_identity_data() from public, anon, authenticated;

create trigger remove_registration_identity_data before insert or update of identity_data on auth.identities
  for each row execute function public.strip_registration_identity_data();

commit;
