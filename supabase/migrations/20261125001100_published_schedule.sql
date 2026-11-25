begin;

create function public.public_operating_week()
returns table (day integer, store_open time, store_close time, web_open time, web_close time)
language sql stable security definer set search_path = '' as $$
  select w.day::integer,w.store_open,w.store_close,w.web_open,w.web_close
    from public.operating_weekdays w order by w.day
$$;
revoke all on function public.public_operating_week() from public,anon,authenticated;
grant execute on function public.public_operating_week() to anon,authenticated;
commit;
