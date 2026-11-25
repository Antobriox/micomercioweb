begin;

create function public.repeat_order_into_cart(original uuid, operation uuid, incoming jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare customer uuid := auth.uid();
begin
  if not public.is_active_customer() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(customer::text, 161600));
  if not exists(select 1 from public.orders where id = original and user_id = customer and status in ('delivered','cancelled')) then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  if exists(select 1 from public.orders where user_id = customer and status in ('pending','confirmed','preparing','ready')) then
    raise exception using errcode = '23514', message = 'active_order';
  end if;
  if jsonb_typeof(incoming) is distinct from 'array' or
     exists(select 1 from jsonb_to_recordset(incoming) as requested(sku text, quantity integer)
       where not exists (select 1 from public.order_items where order_id = original and variant_id = requested.sku and quantity = requested.quantity)) then
    raise exception using errcode = '23514', message = 'invalid_repeat_items';
  end if;
  perform public.change_my_cart(operation, 'merge', incoming);
end;
$$;

revoke all on function public.repeat_order_into_cart(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.repeat_order_into_cart(uuid,uuid,jsonb) to authenticated;

commit;
