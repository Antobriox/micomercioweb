begin;

create table public.demo_submission_intents (
  attempt_id text primary key check (attempt_id ~ '^[a-f0-9]{32}$'),
  attempted_at timestamptz not null default statement_timestamp()
);
create index demo_submission_period on public.demo_submission_intents(attempted_at);
create index orders_demo_attempt on public.orders((md5(user_id::text || ':' || request_key::text)));
alter table public.demo_submission_intents enable row level security;
revoke all on public.demo_submission_intents from public,anon,authenticated;

create function public.note_demo_attempt(customer uuid, request_id uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.demo_submission_intents(attempt_id)
  select md5(customer::text || ':' || request_id::text)
    where customer is not null and request_id is not null
  on conflict (attempt_id) do nothing
$$;
revoke all on function public.note_demo_attempt(uuid,uuid) from public,anon,authenticated;
grant execute on function public.note_demo_attempt(uuid,uuid) to service_role;

create function public.web_order_metrics(period_start timestamptz, period_end timestamptz)
returns table(attempts bigint, accepted bigint, preparation_count bigint, preparation_median numeric, preparation_p90 numeric)
language sql stable security definer set search_path = '' as $$
  with metrics as (
    select count(*) as attempts,count(o.id) as accepted
    from public.demo_submission_intents i left join public.orders o on md5(o.user_id::text || ':' || o.request_key::text) = i.attempt_id
    where i.attempted_at>=period_start and i.attempted_at<period_end
  ),
  steps as (
    select min(e.created_at) filter(where e.next_status='preparing') preparing_at,
      min(e.created_at) filter(where e.next_status='ready') ready_at
    from public.orders o join public.order_events e on e.order_id=o.id
    where o.created_at>=period_start and o.created_at<period_end
    group by o.id
  ),
  elapsed as (
    select extract(epoch from ready_at-preparing_at)/60 as minutes from steps where ready_at>=preparing_at
  )
  select m.attempts,m.accepted,p.total,p.median,p.p90 from metrics m cross join lateral (
    select count(*) as total,round(percentile_cont(0.5) within group (order by minutes)::numeric,1) as median,
      round(percentile_cont(0.9) within group (order by minutes)::numeric,1) as p90
    from elapsed
  ) p where public.is_administrator()
$$;
revoke all on function public.web_order_metrics(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.web_order_metrics(timestamptz,timestamptz) to authenticated;

commit;
