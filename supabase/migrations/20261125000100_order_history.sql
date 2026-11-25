begin;

drop policy pickup_read on public.pickup_slots;
create policy pickup_read on public.pickup_slots for select to authenticated using (
  (select public.is_administrator()) or
  ((select public.is_active_customer()) and (
    service_date >= (now() at time zone 'America/Guayaquil')::date or
    exists(select 1 from public.orders own where own.user_id = (select auth.uid()) and own.slot_id = pickup_slots.id)
  ))
);

commit;
