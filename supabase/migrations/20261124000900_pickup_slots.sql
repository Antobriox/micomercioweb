begin;

alter table public.operating_switch add column default_capacity integer not null default 0
  check (default_capacity between 0 and 10000);

create function public.eligible_pickup_times(moment timestamptz)
  returns table (service_date date, starts_at time, remaining integer, capacity integer)
  language sql stable security definer set search_path = '' as $$
    select o.service_date, slot.start_at::time,
      coalesce(existing.capacity, settings.default_capacity) - coalesce(existing.reserved, 0),
      coalesce(existing.capacity, settings.default_capacity)
    from public.operating_at(moment) o
    cross join public.operating_switch settings
    cross join lateral generate_series(o.service_date::timestamp,
      o.service_date + o.store_close, interval '15 minutes') as slot(start_at)
    left join public.pickup_slots existing
      on existing.service_date = o.service_date and existing.starts_at = slot.start_at::time
    where o.accepting and existing.closed_reason is null
      and slot.start_at >= o.service_date + o.store_open
      and slot.start_at >= o.service_date + o.local_time + interval '30 minutes'
      and slot.start_at + interval '15 minutes' <= o.service_date + o.store_close
      and coalesce(existing.capacity, settings.default_capacity) > coalesce(existing.reserved, 0)
    order by slot.start_at;
  $$;

revoke all on function public.eligible_pickup_times(timestamptz) from public, anon, authenticated;

create function public.available_pickup_times()
  returns table (service_date date, starts_at time, remaining integer)
  language sql stable security definer set search_path = '' as $$
    select p.service_date, p.starts_at, p.remaining
    from public.eligible_pickup_times(statement_timestamp()) p
    where public.is_active_customer() and not exists (
      select 1 from public.orders
      where user_id = (select auth.uid()) and status in ('pending', 'confirmed', 'preparing', 'ready')
    );
  $$;

revoke all on function public.available_pickup_times() from public, anon, authenticated;
grant execute on function public.available_pickup_times() to authenticated;

create function public.configure_pickup_slot(day date, starts time, places integer, reason text)
  returns void language plpgsql security definer set search_path = '' as $$
  begin
    if not public.is_administrator() then raise exception using errcode = '42501', message = 'access_denied'; end if;
    if day is null or starts is null or starts >= time '24:00' or
        extract(minute from starts)::integer % 15 <> 0 or extract(second from starts) <> 0 or
        places is null or places not between 0 and 10000 or
        (reason is not null and char_length(trim(reason)) not between 1 and 240) then
      raise exception using errcode = '23514', message = 'invalid_pickup_slot';
    end if;

    insert into public.pickup_slots(service_date, starts_at, capacity, closed_reason)
      values (day, starts, places, reason)
    on conflict (service_date, starts_at) do update
      set capacity = excluded.capacity, closed_reason = excluded.closed_reason;
  end;
  $$;

revoke all on function public.configure_pickup_slot(date,time,integer,text) from public, anon, authenticated;
grant execute on function public.configure_pickup_slot(date,time,integer,text) to authenticated;

commit;
