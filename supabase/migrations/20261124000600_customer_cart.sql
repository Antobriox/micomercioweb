begin;

alter table public.cart_items
  add column quoted_minor bigint check (quoted_minor between 0 and 9007199254740991),
  add column quoted_currency text check (quoted_currency ~ '^[A-Z]{3}$'),
  add constraint quote_pair check ((quoted_minor is null) = (quoted_currency is null));

create table public.cart_operation_receipts (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  operation_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id)
);

alter table public.cart_operation_receipts enable row level security;
revoke all on public.cart_operation_receipts from public, anon, authenticated;

create function public.change_my_cart(operation uuid, intent text, incoming jsonb)
  returns void language plpgsql security definer set search_path = '' as $$
  declare
    customer uuid := auth.uid();
    item record;
    previous integer;
    target integer;
  begin
    if not public.is_active_customer() then
      raise exception using errcode = '42501', message = 'access_denied';
    end if;
    if operation is null or intent is null or intent not in ('merge', 'add', 'set') or
        jsonb_typeof(incoming) is distinct from 'array' then
      raise exception using errcode = '23514', message = 'invalid_cart_operation';
    end if;
    if jsonb_array_length(incoming) not between 1 and 200 or
        (intent <> 'merge' and jsonb_array_length(incoming) <> 1) then
      raise exception using errcode = '23514', message = 'invalid_cart_operation';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(customer::text, 161600));
    insert into public.cart_operation_receipts(user_id, operation_id)
      values (customer, operation) on conflict do nothing;
    if not found then return; end if;

    for item in select * from jsonb_to_recordset(incoming)
      as input(sku text, quantity integer, ceiling integer, minor bigint, currency text)
    loop
      if item.sku is null or length(item.sku) not between 1 and 100 or
        item.quantity is null or item.quantity not between 0 and 10000 or
        item.ceiling is null or item.ceiling not between 0 and 10000 or
        (intent = 'add' and item.quantity = 0) then
        raise exception using errcode = '23514', message = 'invalid_cart_line';
      end if;

      select quantity into previous from public.cart_items
        where user_id = customer and variant_id = item.sku;
      target := case intent
        when 'merge' then greatest(coalesce(previous, 0), item.quantity)
        when 'add' then coalesce(previous, 0) + item.quantity
        else item.quantity end;
      if target > item.ceiling then
        raise exception using errcode = '23514', message = 'cart_quantity_limit';
      end if;
      if target = 0 then
        delete from public.cart_items where user_id = customer and variant_id = item.sku;
      else
        insert into public.cart_items as saved(user_id, variant_id, quantity, quoted_minor, quoted_currency)
          values (customer, item.sku, target, item.minor, item.currency)
        on conflict (user_id, variant_id) do update set
          quantity = excluded.quantity, updated_at = clock_timestamp(),
          quoted_minor = coalesce(saved.quoted_minor, excluded.quoted_minor),
          quoted_currency = coalesce(saved.quoted_currency, excluded.quoted_currency);
      end if;
    end loop;
    if (select count(*) from public.cart_items where user_id = customer) > 200 then
      raise exception using errcode = '23514', message = 'cart_size_limit';
    end if;
  end;
  $$;

revoke all on function public.change_my_cart(uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.change_my_cart(uuid,text,jsonb) to authenticated;

commit;
