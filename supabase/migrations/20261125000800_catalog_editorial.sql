begin;

grant select,insert,update,delete on public.product_editorial,public.editorial_categories,public.editorial_images to authenticated;
create policy admin_product_editorial on public.product_editorial to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));
create policy admin_editorial_categories on public.editorial_categories to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));
create policy admin_editorial_images on public.editorial_images to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));

create function public.storefront_editorial(product_ids text[])
returns table(product_id text, visible boolean, description text, featured boolean, category_slug text, category_title text, photos jsonb)
language sql stable security definer set search_path = '' as $$
  select e.product_id,e.visible,case when e.visible then e.description end,e.visible and e.featured,
    c.slug,c.title,
    case when e.visible then coalesce((
      select jsonb_agg(jsonb_build_object('object_path',i.object_path,'alt_text',i.alt_text,'variant_id',i.variant_id) order by i.position,i.id)
      from public.editorial_images i where i.product_id=e.product_id
    ),'[]'::jsonb) else '[]'::jsonb end
    from public.product_editorial e
    left join public.editorial_categories c on c.id=e.category_id and e.visible and c.visible
    where e.product_id = any(product_ids)
$$;
revoke all on function public.storefront_editorial(text[]) from public,anon,authenticated;
grant execute on function public.storefront_editorial(text[]) to anon,authenticated;

create function public.public_editorial_media(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.editorial_images i join public.product_editorial p using(product_id)
    where p.visible and i.object_path=path)
$$;
revoke all on function public.public_editorial_media(text) from public,anon,authenticated;
grant execute on function public.public_editorial_media(text) to anon,authenticated;

do $$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
      values ('editorial','editorial',false,1250000,array['image/webp']) on conflict (id) do nothing;
    execute 'create policy editorial_public_read on storage.objects for select to anon,authenticated
      using (bucket_id = ''editorial'' and public.public_editorial_media(name))';
    execute 'create policy editorial_admin_manage on storage.objects to authenticated
      using (bucket_id = ''editorial'' and (select public.is_administrator()))
      with check (bucket_id = ''editorial'' and (select public.is_administrator()))';
  end if;
end;
$$;

commit;
