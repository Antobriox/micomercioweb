begin;

drop policy profile_read on public.profiles;
create policy profile_read on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_customer()));

create function public.admin_search_customers(needle text default '', page_offset integer default 0)
returns table(user_id uuid, given_names text, family_names text, verified_at timestamptz, disabled_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.user_id,p.given_names,p.family_names,p.verified_at,p.disabled_at
    from public.profiles p
    where public.is_administrator() and char_length(needle) <= 254 and (
      needle = '' or p.national_id = needle or p.email = lower(needle) or
      strpos(lower(concat_ws(' ',p.given_names,p.family_names)),lower(needle)) > 0
    )
    order by p.created_at desc, p.user_id
    offset greatest(page_offset,0) limit 31
$$;

create function public.admin_search_orders(needle text default '', order_status text default null, pickup_date date default null, pickup_time time default null, page_offset integer default 0)
returns table(id uuid, status text, created_at timestamptz, service_date date, starts_at time, customer_name text)
language sql stable security definer set search_path = '' as $$
  select o.id,o.status,o.created_at,s.service_date,s.starts_at,concat_ws(' ',p.given_names,p.family_names)
    from public.orders o join public.pickup_slots s on s.id=o.slot_id join public.profiles p on p.user_id=o.user_id
    where public.is_administrator() and char_length(needle) <= 254
      and (order_status is null or o.status=order_status)
      and (pickup_date is null or s.service_date=pickup_date)
      and (pickup_time is null or s.starts_at=pickup_time)
      and (needle = '' or (char_length(needle) >= 8 and starts_with(o.id::text, lower(needle))) or
        p.national_id = needle or p.email = lower(needle) or
        strpos(lower(concat_ws(' ',p.given_names,p.family_names)),lower(needle)) > 0)
    order by o.created_at desc,o.id
    offset greatest(page_offset,0) limit 31
$$;

create function public.admin_customer_detail(target uuid)
returns table(user_id uuid, given_names text, family_names text, masked_id text, email text, mobile text,
  verified_at timestamptz, disabled_at timestamptz, updated_at timestamptz, administrator boolean)
language sql stable security definer set search_path = '' as $$
  select p.user_id,p.given_names,p.family_names,'••••••' || right(p.national_id,4),p.email,p.mobile,
    p.verified_at,p.disabled_at,p.updated_at,exists(select 1 from public.administrators a where a.user_id=p.user_id and a.revoked_at is null)
    from public.profiles p where public.is_administrator() and p.user_id=target
$$;

create function public.admin_set_customer_disabled(target uuid, expected_version timestamptz, disable boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  version timestamptz;
  was_disabled boolean;
begin
  if not public.is_administrator() or disable is null or target = auth.uid() or
      exists(select 1 from public.administrators where user_id=target and revoked_at is null) then
    raise exception using errcode='42501', message='access_denied';
  end if;
  select updated_at,disabled_at is not null into version,was_disabled
    from public.profiles where user_id=target for update;
  if not found then raise exception using errcode='42501', message='access_denied'; end if;
  if version is distinct from expected_version then raise exception using errcode='40001', message='profile_changed'; end if;
  if disable = was_disabled then return; end if;
  update public.profiles set disabled_at=case when disable then clock_timestamp() end, updated_at=clock_timestamp()
    where user_id=target;
  if disable then delete from auth.sessions where user_id=target; end if;
end;
$$;

revoke all on function public.admin_search_customers(text,integer),public.admin_search_orders(text,text,date,time,integer),
  public.admin_customer_detail(uuid),public.admin_set_customer_disabled(uuid,timestamptz,boolean) from public, anon, authenticated;
grant execute on function public.admin_search_customers(text,integer),public.admin_search_orders(text,text,date,time,integer),
  public.admin_customer_detail(uuid),public.admin_set_customer_disabled(uuid,timestamptz,boolean) to authenticated;

commit;
