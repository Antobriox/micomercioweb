begin;

create function public.admin_cms_page(target text)
returns setof public.cms_pages language sql stable security definer set search_path = '' as $$
  select p.* from public.cms_pages p where public.is_administrator() and p.slug=target
$$;

create function public.published_cms_page(target text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select p.published from public.cms_pages p where p.slug=target
$$;

create function public.save_cms_page(target text, content jsonb, expected_version timestamptz, publish boolean, legal_reviewed boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  touched bigint;
begin
  if not public.is_administrator() then raise exception using errcode='42501',message='access_denied'; end if;
  if target is null or target not in ('inicio','nosotros','contacto','como-comprar','preguntas-frecuentes','privacidad','condiciones') or
     publish is null or jsonb_typeof(content) is distinct from 'object' or
     char_length(content::text)>24000 or coalesce(char_length(trim(content->>'title')),0) < 1 then
    raise exception using errcode='23514',message='invalid_content';
  end if;
  if publish and target in ('privacidad','condiciones') and legal_reviewed is distinct from true then
    raise exception using errcode='23514',message='legal_review_required';
  end if;
  if expected_version is null then
    insert into public.cms_pages(slug,draft,published,published_at)
    values (target,content,case when publish then content end, case when publish then clock_timestamp() end)
    on conflict(slug) do nothing;
  else
    update public.cms_pages set draft=content,updated_at=clock_timestamp(),
      published=case when publish then content else published end,
      published_at=case when publish then clock_timestamp() else published_at end
      where slug=target and updated_at=expected_version;
  end if;
  get diagnostics touched = row_count;
  if touched=0 then raise exception using errcode='40001',message='cms_version_changed'; end if;
end;
$$;

revoke all on function public.admin_cms_page(text),public.published_cms_page(text),
  public.save_cms_page(text,jsonb,timestamptz,boolean,boolean) from public,anon,authenticated;
grant execute on function public.admin_cms_page(text),public.save_cms_page(text,jsonb,timestamptz,boolean,boolean) to authenticated;
grant execute on function public.published_cms_page(text) to anon,authenticated;

create or replace function public.public_editorial_media(path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.editorial_images i join public.product_editorial p using(product_id)
    where p.visible and i.object_path=path)
  or exists(select 1 from public.banners b where b.enabled and b.starts_at<=statement_timestamp()
    and b.ends_at>statement_timestamp() and (b.desktop_path=path or b.mobile_path=path))
  or exists(select 1 from public.cms_pages c where c.published->'photos' @> jsonb_build_array(jsonb_build_object('path',path)));
$$;

commit;
