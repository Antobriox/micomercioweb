begin;

create function public.web_order_report(period_start timestamptz, period_end timestamptz)
returns table (status text, amount bigint)
language sql stable security invoker set search_path = '' as $$
  select o.status,count(*) from public.orders o
    where public.is_administrator() and o.created_at>=period_start and o.created_at<period_end
    group by o.status
$$;
revoke all on function public.web_order_report(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.web_order_report(timestamptz,timestamptz) to authenticated;

commit;
