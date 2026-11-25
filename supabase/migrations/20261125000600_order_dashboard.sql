begin;

create function public.daily_admin_orders(target_day date)
returns table (status text, amount bigint)
language sql stable security invoker set search_path = '' as $$
  select o.status, count(*) from public.orders o join public.pickup_slots s on s.id = o.slot_id
    where public.is_administrator() and s.service_date = target_day
    group by o.status
$$;
revoke all on function public.daily_admin_orders(date) from public, anon, authenticated;
grant execute on function public.daily_admin_orders(date) to authenticated;

commit;
