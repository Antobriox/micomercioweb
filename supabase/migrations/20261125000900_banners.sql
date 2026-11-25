begin;

alter table public.banners add column updated_at timestamptz not null default clock_timestamp();
grant select,insert,update on public.banners to authenticated;
create policy admin_banners on public.banners to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));

create function public.active_banners(placement text)
returns setof public.banners
language sql stable security definer set search_path = '' as $$
  select b.* from public.banners b
    where b.location=placement and b.enabled and b.starts_at<=statement_timestamp() and b.ends_at>statement_timestamp()
    order by b.position,b.id
$$;
revoke all on function public.active_banners(text) from public,anon,authenticated;
grant execute on function public.active_banners(text) to anon,authenticated;

create or replace function public.public_editorial_media(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.editorial_images i join public.product_editorial p using(product_id)
    where p.visible and i.object_path=path)
  or exists(select 1 from public.banners b where b.enabled and b.starts_at<=statement_timestamp()
    and b.ends_at>statement_timestamp() and (b.desktop_path=path or b.mobile_path=path));
$$;

commit;
