begin;

create table public.demo_funnel_events (
  visitor text not null check (visitor ~ '^[a-f0-9]{32}$'),
  kind text not null check (kind in ('visit','search','search_empty','product','add','remove','signin','slot','submit','accepted',
    'catalog_unavailable','review_changed','pickup_unavailable','active_order')),
  recorded_at timestamptz not null default statement_timestamp(),
  primary key(visitor,kind)
);
create index demo_funnel_period on public.demo_funnel_events(kind,recorded_at);
alter table public.demo_funnel_events enable row level security;
revoke all on public.demo_funnel_events from public,anon,authenticated;

create function public.note_demo_funnel(visit_id uuid, event_kind text)
returns void language sql security definer set search_path = '' as $$
  insert into public.demo_funnel_events(visitor,kind)
  values (md5(visit_id::text),event_kind) on conflict(visitor,kind) do nothing
$$;
revoke all on function public.note_demo_funnel(uuid,text) from public,anon,authenticated;
grant execute on function public.note_demo_funnel(uuid,text) to service_role;

create function public.demo_funnel_report(period_start timestamptz, period_end timestamptz)
returns table(visits bigint,carts bigint,authenticated bigint,accepted bigint)
language sql stable security definer set search_path = '' as $$
  with cohort as (
    select v.visitor, bool_or(e.kind='add') as cart, bool_or(e.kind='signin') as signed_in,
      bool_or(e.kind='accepted') as ordered
    from public.demo_funnel_events v join public.demo_funnel_events e using(visitor)
    where v.kind='visit' and v.recorded_at>=period_start and v.recorded_at<period_end
    group by v.visitor
  )
  select count(*), count(*) filter(where cart), count(*) filter(where cart and signed_in),
    count(*) filter(where cart and signed_in and ordered)
  from cohort having public.is_administrator()
$$;
revoke all on function public.demo_funnel_report(timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.demo_funnel_report(timestamptz,timestamptz) to authenticated;

commit;
