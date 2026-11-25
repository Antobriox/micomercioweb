begin;

create table public.order_reviews (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  revision text not null check (revision ~ '^[a-f0-9]{64}$'),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  accepted_at timestamptz not null default clock_timestamp()
);

alter table public.order_reviews enable row level security;
revoke all on public.order_reviews from public, anon, authenticated;
grant select, insert, update on public.order_reviews to authenticated;
create policy order_reviews_owner on public.order_reviews for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_customer()))
  with check (user_id = (select auth.uid()) and (select public.is_active_customer()));

commit;
