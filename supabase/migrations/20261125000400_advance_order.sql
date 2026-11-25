begin;

create function public.advance_order(target uuid, expected text, destination text, demo_payment_checked boolean default false, demo_pickup_checked boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare
  previous text;
  next_allowed text;
begin
  if not public.is_administrator() then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;
  select status into previous from public.orders where id = target for update;
  if not found then raise exception using errcode = '42501', message = 'access_denied'; end if;
  if previous is distinct from expected then
    raise exception using errcode = '40001', message = 'order_state_changed';
  end if;
  next_allowed := case previous
    when 'pending' then 'confirmed'
    when 'confirmed' then 'preparing'
    when 'preparing' then 'ready'
    when 'ready' then 'delivered'
  end;
  if next_allowed is null or destination is distinct from next_allowed then
    raise exception using errcode = '23514', message = 'invalid_transition';
  end if;
  if destination = 'delivered' and
      (demo_payment_checked is distinct from true or demo_pickup_checked is distinct from true) then
    raise exception using errcode = '23514', message = 'demo_pickup_confirmation_required';
  end if;
  update public.orders set status = destination, updated_at = clock_timestamp() where id = target;
  insert into public.order_events(order_id,actor_id,previous_status,next_status,reason)
    values(target, auth.uid(), previous, destination,
      case when destination = 'delivered' then 'Cobro y retiro simulados verificados manualmente' end);
end;
$$;
revoke all on function public.advance_order(uuid,text,text,boolean,boolean) from public, anon, authenticated;
grant execute on function public.advance_order(uuid,text,text,boolean,boolean) to authenticated;

commit;
