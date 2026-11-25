begin;

create function public.cancel_order(target uuid, expected text, as_administrator boolean default false, rationale text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  previous text;
begin
  if as_administrator is null or not public.is_active_customer() or (as_administrator and not public.is_administrator()) then
    raise exception using errcode = '42501', message = 'access_denied';
  end if;

  select status into previous from public.orders
    where id = target and (as_administrator or user_id = actor) for update;
  if not found then raise exception using errcode = '42501', message = 'access_denied'; end if;
  if previous is distinct from expected then
    raise exception using errcode = '40001', message = 'order_state_changed';
  end if;

  if previous not in ('pending','confirmed','preparing','ready') or
      (not as_administrator and previous not in ('pending','confirmed')) then
    raise exception using errcode = '23514', message = 'cannot_cancel';
  end if;
  if as_administrator and (rationale is null or char_length(trim(rationale)) not between 1 and 240) then
    raise exception using errcode = '23514', message = 'reason_required';
  end if;

  update public.orders set status = 'cancelled', updated_at = clock_timestamp() where id = target;
  insert into public.order_events(order_id,actor_id,previous_status,next_status,reason)
    values(target, actor, previous, 'cancelled', case when as_administrator then trim(rationale) end);
end;
$$;

revoke all on function public.cancel_order(uuid,text,boolean,text) from public, anon, authenticated;
grant execute on function public.cancel_order(uuid,text,boolean,text) to authenticated;

revoke select on public.order_events from authenticated;
grant select (id,order_id,actor_id,previous_status,next_status,created_at) on public.order_events to authenticated;

create function public.admin_order_events(target uuid)
returns table (id bigint, previous_status text, next_status text, reason text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.id, e.previous_status, e.next_status, e.reason, e.created_at
  from public.order_events e where public.is_administrator() and e.order_id = target
  order by e.id;
$$;
revoke all on function public.admin_order_events(uuid) from public, anon, authenticated;
grant execute on function public.admin_order_events(uuid) to authenticated;

commit;
