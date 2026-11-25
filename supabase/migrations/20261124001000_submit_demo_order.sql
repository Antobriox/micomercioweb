begin;

alter table public.orders
  alter column estimated_total_minor type bigint,
  add column demo boolean not null default true check (demo);
alter table public.order_items alter column unit_price_minor type bigint;

create function public.submit_demo_order(
  customer uuid, operation uuid, expected_revision text, requested_day date,
  requested_time time, current_quote jsonb, moment timestamptz default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  receipt uuid;
  chosen uuid;
  offered integer;
  total numeric;
  currency_code text := current_quote ->> 'currency';
  quoted jsonb := current_quote -> 'lines';
begin
  if customer is null or operation is null or expected_revision is null or
     expected_revision !~ '^[a-f0-9]{64}$' or requested_day is null or requested_time is null then
    raise exception using errcode = '23514', message = 'invalid_order_request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(customer::text, 161600));
  perform 1 from public.profiles where user_id = customer and verified_at is not null and disabled_at is null for share;
  if not found then raise exception using errcode = '42501', message = 'customer_unavailable'; end if;

  select id into receipt from public.orders where user_id = customer and request_key = operation;
  if found then return receipt; end if;

  if exists(select 1 from public.orders where user_id = customer and status in ('pending','confirmed','preparing','ready')) then
    raise exception using errcode = '23505', message = 'active_order';
  end if;
  perform 1 from public.order_reviews where user_id = customer and revision = expected_revision and snapshot = current_quote for share;
  if not found then raise exception using errcode = '23514', message = 'review_changed'; end if;
  if jsonb_typeof(quoted) is distinct from 'array' or currency_code is null or currency_code !~ '^[A-Z]{3}$' then
    raise exception using errcode = '23514', message = 'review_changed';
  end if;
  if jsonb_array_length(quoted) not between 1 and 200 then
    raise exception using errcode = '23514', message = 'review_changed';
  end if;

  with parsed as (
    select * from jsonb_to_recordset(quoted) as r(sku text, "productName" text, presentation text,
      unit text, quantity integer, "unitPriceMinor" bigint, currency text)
  )
  select sum(p."unitPriceMinor"::numeric * p.quantity) into total
    from parsed p join public.cart_items c on c.user_id = customer and c.variant_id = p.sku and c.quantity = p.quantity
    where p.quantity between 1 and 10000 and p."unitPriceMinor" between 0 and 9007199254740991
      and p.currency = currency_code and p."productName" is not null and p.presentation is not null and p.unit is not null
    having count(*) = jsonb_array_length(quoted) and count(distinct p.sku) = jsonb_array_length(quoted);

  if total is null or total > 9007199254740991 or total is distinct from (current_quote ->> 'totalMinor')::numeric then
    raise exception using errcode = '23514', message = 'review_changed';
  end if;
  select candidate.capacity into offered from public.eligible_pickup_times(coalesce(moment, clock_timestamp())) candidate
    where candidate.service_date = requested_day and candidate.starts_at = requested_time;
  if not found then raise exception using errcode = '23514', message = 'pickup_unavailable'; end if;

  perform set_config('request.jwt.claim.sub', customer::text, true);
  insert into public.pickup_slots(service_date, starts_at, capacity)
    values(requested_day, requested_time, offered) on conflict (service_date, starts_at) do nothing;
  select id into chosen from public.pickup_slots where service_date = requested_day and starts_at = requested_time for update;
  perform 1 from public.eligible_pickup_times(coalesce(moment, clock_timestamp())) candidate
    where candidate.service_date = requested_day and candidate.starts_at = requested_time;
  if not found then raise exception using errcode = '23514', message = 'pickup_unavailable'; end if;

  insert into public.orders(user_id, slot_id, request_key, estimated_total_minor, currency)
    values(customer, chosen, operation, total::bigint, currency_code) returning id into receipt;
  insert into public.order_items(order_id, variant_id, product_name, presentation, unit, quantity, unit_price_minor)
    select receipt, r.sku, r."productName", r.presentation, r.unit, r.quantity, r."unitPriceMinor"
    from jsonb_to_recordset(quoted) as r(sku text, "productName" text, presentation text, unit text, quantity integer, "unitPriceMinor" bigint);
  insert into public.order_events(order_id, actor_id, next_status) values(receipt, customer, 'pending');
  delete from public.cart_items c using jsonb_to_recordset(quoted) as r(sku text, quantity integer)
    where c.user_id = customer and c.variant_id = r.sku and c.quantity = r.quantity;
  delete from public.order_reviews where user_id = customer and revision = expected_revision;
  return receipt;
end;
$$;

revoke all on function public.submit_demo_order(uuid,uuid,text,date,time,jsonb,timestamptz) from public, anon, authenticated;
grant execute on function public.submit_demo_order(uuid,uuid,text,date,time,jsonb,timestamptz) to service_role;

commit;
