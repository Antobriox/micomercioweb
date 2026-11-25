begin;

create function public.notify_order_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.previous_status is not distinct from new.next_status then return new; end if;
  insert into public.notifications(user_id, event_id, created_at)
    select user_id, new.id, new.created_at from public.orders where id = new.order_id
    on conflict (event_id) do nothing;
  return new;
end;
$$;
revoke all on function public.notify_order_owner() from public, anon, authenticated;
create trigger order_event_notification after insert on public.order_events
  for each row execute function public.notify_order_owner();

insert into public.notifications(user_id, event_id, created_at)
  select o.user_id, e.id, e.created_at from public.order_events e join public.orders o on o.id = e.order_id
    where e.previous_status is distinct from e.next_status
    on conflict (event_id) do nothing;

create function public.mark_order_notification_read(target uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_active_customer() then return false; end if;
  update public.notifications set read_at = coalesce(read_at, clock_timestamp())
    where id = target and user_id = auth.uid();
  return found;
end;
$$;
revoke all on function public.mark_order_notification_read(uuid) from public, anon, authenticated;
grant execute on function public.mark_order_notification_read(uuid) to authenticated;

commit;
