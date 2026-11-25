begin;

create table public.operating_weekdays (
  day smallint primary key check (day between 1 and 7),
  store_open time not null,
  store_close time not null,
  web_open time not null,
  web_close time not null,
  check (store_open <= web_open and web_open < web_close and web_close <= store_close)
);
insert into public.operating_weekdays(day, store_open, store_close, web_open, web_close) values
  (1,'06:00','18:00','07:00','17:00'), (2,'06:00','18:00','07:00','17:00'),
  (3,'06:00','18:00','07:00','17:00'), (4,'06:00','18:00','07:00','17:00'),
  (5,'06:00','18:00','07:00','17:00'), (6,'05:30','18:00','07:00','17:00'),
  (7,'05:00','14:00','07:00','13:00');

create table public.operating_exceptions (
  day date primary key,
  closed boolean not null,
  notice text not null check (char_length(trim(notice)) between 1 and 240),
  store_open time,
  store_close time,
  web_open time,
  web_close time,
  check (
    (closed and store_open is null and store_close is null and web_open is null and web_close is null)
    or
    (not closed and store_open is not null and store_close is not null and web_open is not null and web_close is not null
      and store_open <= web_open and web_open < web_close and web_close <= store_close)
  )
);

create table public.operating_switch (
  id boolean primary key default true check (id),
  paused boolean not null default false,
  notice text check (notice is null or char_length(trim(notice)) between 1 and 240),
  check (not paused or notice is not null)
);
insert into public.operating_switch (id) values (true);

alter table public.operating_weekdays enable row level security;
alter table public.operating_exceptions enable row level security;
alter table public.operating_switch enable row level security;
revoke all on public.operating_weekdays, public.operating_exceptions, public.operating_switch
  from public, anon, authenticated;
grant select, update on public.operating_weekdays, public.operating_switch to authenticated;
grant select, insert, update, delete on public.operating_exceptions to authenticated;

create policy operating_weekdays_admin on public.operating_weekdays for all to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));
create policy operating_exceptions_admin on public.operating_exceptions for all to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));
create policy operating_switch_admin on public.operating_switch for all to authenticated
  using ((select public.is_administrator())) with check ((select public.is_administrator()));

create trigger audit_operating_weekdays after update on public.operating_weekdays for each row execute function public.log_web_change('day');
create trigger audit_operating_exceptions after insert or update or delete on public.operating_exceptions
  for each row execute function public.log_web_change('day');
create trigger audit_operating_switch after update on public.operating_switch for each row execute function public.log_web_change('id');

create function public.operating_at(moment timestamptz default statement_timestamp())
  returns table (service_date date, local_time time, store_open time, store_close time,
    web_open time, web_close time, accepting boolean, notice text)
  language sql stable security definer set search_path = '' as $$
    with local_clock as (select moment at time zone 'America/Guayaquil' as here),
    schedule as (
      select here, switch.paused, coalesce(exception.closed, false) as closed,
        case when switch.paused then switch.notice else exception.notice end as reason,
        case when exception.day is not null then exception.store_open else weekday.store_open end as opens,
        case when exception.day is not null then exception.store_close else weekday.store_close end as closes,
        case when exception.day is not null then exception.web_open else weekday.web_open end as online_from,
        case when exception.day is not null then exception.web_close else weekday.web_close end as online_to
      from local_clock
      join public.operating_weekdays weekday on weekday.day = extract(isodow from here)
      cross join public.operating_switch switch
      left join public.operating_exceptions exception on exception.day = here::date
    )
    select here::date, here::time, opens, closes, online_from, online_to,
      not paused and not closed and here::time >= online_from and here::time < online_to, reason
    from schedule;
  $$;
revoke all on function public.operating_at(timestamptz) from public, anon, authenticated;
grant execute on function public.operating_at(timestamptz) to anon, authenticated;

commit;
