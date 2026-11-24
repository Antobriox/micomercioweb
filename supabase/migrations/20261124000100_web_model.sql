begin;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  given_names text not null check (length(trim(given_names)) between 1 and 100),
  family_names text not null check (length(trim(family_names)) between 1 and 100),
  national_id text not null unique check (national_id ~ '^[0-9]{10}$'),
  mobile text not null check (mobile ~ '^[+]?[0-9]{9,15}$'),
  email text not null unique check (email = lower(trim(email)) and length(email) between 3 and 254),
  verified_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.administrators (
  user_id uuid primary key references public.profiles(user_id) on delete restrict,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.favorites (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  product_id text not null check (length(product_id) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.editorial_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 100),
  visible boolean not null default false
);

create table public.product_editorial (
  product_id text primary key check (length(product_id) between 1 and 100),
  category_id uuid references public.editorial_categories(id) on delete set null,
  description text,
  visible boolean not null default true,
  featured boolean not null default false
);

create table public.editorial_images (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.product_editorial(product_id) on delete cascade,
  variant_id text,
  object_path text not null unique,
  alt_text text not null check (length(trim(alt_text)) between 1 and 240),
  position smallint not null default 0 check (position >= 0)
);

create table public.cart_items (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  variant_id text not null check (length(variant_id) between 1 and 100),
  quantity integer not null check (quantity between 1 and 10000),
  updated_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);

create table public.pickup_slots (
  id uuid primary key default gen_random_uuid(),
  service_date date not null,
  starts_at time not null check (extract(minute from starts_at)::int % 15 = 0 and extract(second from starts_at) = 0),
  capacity integer not null check (capacity >= 0),
  reserved integer not null default 0 check (reserved >= 0 and reserved <= capacity),
  closed_reason text check (closed_reason is null or length(trim(closed_reason)) > 0),
  unique (service_date, starts_at)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete restrict,
  slot_id uuid not null references public.pickup_slots(id) on delete restrict,
  request_key uuid not null,
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
  ),
  estimated_total_minor integer not null check (estimated_total_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_key)
);

create unique index one_active_order_per_customer on public.orders(user_id)
  where status in ('pending', 'confirmed', 'preparing', 'ready');
create index orders_customer_history on public.orders(user_id, created_at desc);
create index orders_slot_idx on public.orders(slot_id);

create table public.order_items (
  order_id uuid not null references public.orders(id) on delete restrict,
  variant_id text not null,
  product_name text not null,
  presentation text not null,
  unit text not null,
  quantity integer not null check (quantity between 1 and 10000),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  primary key (order_id, variant_id)
);

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete restrict,
  previous_status text,
  next_status text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index order_events_timeline on public.order_events(order_id, created_at, id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  event_id bigint not null unique references public.order_events(id) on delete restrict,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_customer_timeline on public.notifications(user_id, created_at desc);

create table public.cms_pages (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  draft jsonb not null check (jsonb_typeof(draft) = 'object'),
  published jsonb check (published is null or jsonb_typeof(published) = 'object'),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  check ((published is null) = (published_at is null))
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  location text not null check (location in ('home', 'promotions')),
  title text not null,
  body text,
  desktop_path text not null,
  mobile_path text not null,
  alt_text text not null,
  destination text,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  position smallint not null default 0 check (position >= 0),
  enabled boolean not null default false
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete restrict,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity text not null,
  entity_id text not null,
  occurred_at timestamptz not null default clock_timestamp()
);
create index audit_log_entity_time on public.audit_log(entity, entity_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.administrators enable row level security;
alter table public.favorites enable row level security;
alter table public.editorial_categories enable row level security;
alter table public.product_editorial enable row level security;
alter table public.editorial_images enable row level security;
alter table public.cart_items enable row level security;
alter table public.pickup_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.notifications enable row level security;
alter table public.cms_pages enable row level security;
alter table public.banners enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.profiles, public.administrators, public.favorites, public.editorial_categories,
  public.product_editorial, public.editorial_images, public.cart_items, public.pickup_slots, public.orders,
  public.order_items, public.order_events, public.notifications, public.cms_pages, public.banners,
  public.audit_log from anon, authenticated;

create function public.is_active_customer() returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and verified_at is not null and disabled_at is null
  );
  $$;

create function public.is_administrator() returns boolean
  language sql stable security definer set search_path = ''
  as $$
  select public.is_active_customer() and exists (
    select 1 from public.administrators
    where user_id = (select auth.uid()) and revoked_at is null
  );
  $$;

revoke all on function public.is_active_customer(), public.is_administrator() from public, anon, authenticated;
grant execute on function public.is_active_customer(), public.is_administrator() to authenticated;

grant select on public.profiles, public.orders, public.order_items, public.order_events,
  public.notifications, public.pickup_slots, public.audit_log to authenticated;
grant select, insert, update, delete on public.cart_items, public.favorites to authenticated;

create policy profile_read on public.profiles for select to authenticated
  using ((user_id = (select auth.uid()) and (select public.is_active_customer())) or (select public.is_administrator()));

create policy favorites_owner on public.favorites for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_customer()))
  with check (user_id = (select auth.uid()) and (select public.is_active_customer()));

create policy cart_owner on public.cart_items for all to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_customer()))
  with check (user_id = (select auth.uid()) and (select public.is_active_customer()));

create policy order_read on public.orders for select to authenticated
  using ((user_id = (select auth.uid()) and (select public.is_active_customer())) or (select public.is_administrator()));

create policy order_item_read on public.order_items for select to authenticated using (
  exists (select 1 from public.orders where id = order_id)
);

create policy order_event_read on public.order_events for select to authenticated using (
  exists (select 1 from public.orders where id = order_id)
);

create policy notification_read on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_active_customer()));

create policy pickup_read on public.pickup_slots for select to authenticated using (
  (select public.is_administrator()) or service_date >= (now() at time zone 'America/Guayaquil')::date
);

create policy audit_read on public.audit_log for select to authenticated using ((select public.is_administrator()));

create function public.log_web_change() returns trigger
  language plpgsql security definer set search_path = '' as $$
  declare
    record_id text;
  begin
    record_id := (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> tg_argv[0];
    insert into public.audit_log(actor_id, action, entity, entity_id)
      values (auth.uid(), tg_op, tg_table_name, record_id);
    return null;
  end;
  $$;

revoke all on function public.log_web_change() from public, anon, authenticated;

create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.log_web_change('user_id');
create trigger audit_administrators after insert or update or delete on public.administrators
  for each row execute function public.log_web_change('user_id');
create trigger audit_orders after insert or update or delete on public.orders
  for each row execute function public.log_web_change('id');
create trigger audit_pickup_slots after insert or update or delete on public.pickup_slots
  for each row execute function public.log_web_change('id');
create trigger audit_editorial_categories after insert or update or delete on public.editorial_categories
  for each row execute function public.log_web_change('id');
create trigger audit_product_editorial after insert or update or delete on public.product_editorial
  for each row execute function public.log_web_change('product_id');
create trigger audit_editorial_images after insert or update or delete on public.editorial_images
  for each row execute function public.log_web_change('id');
create trigger audit_cms_pages after insert or update or delete on public.cms_pages
  for each row execute function public.log_web_change('slug');
create trigger audit_banners after insert or update or delete on public.banners
  for each row execute function public.log_web_change('id');

create function public.update_slot_reservation() returns trigger
  language plpgsql set search_path = '' as $$
  begin
    if tg_op = 'INSERT' then
      if new.status <> 'pending' then
        raise exception using errcode = '23514', message = 'invalid_initial_order_status';
      end if;
      update public.pickup_slots set reserved = reserved + 1
        where id = new.slot_id and closed_reason is null and reserved < capacity;
      if not found then
        raise exception using errcode = '23514', message = 'pickup_slot_unavailable';
      end if;
    elsif new.slot_id is distinct from old.slot_id or
          (old.status in ('cancelled', 'delivered') and new.status is distinct from old.status) then
      raise exception using errcode = '23514', message = 'invalid_order_update';
    elsif new.status = 'cancelled' and old.status <> 'cancelled' then
      update public.pickup_slots set reserved = reserved - 1 where id = old.slot_id;
    end if;
    return new;
  end;
  $$;

revoke all on function public.update_slot_reservation() from public, anon, authenticated;

create trigger reserve_order_slot after insert or update of status, slot_id on public.orders
  for each row execute function public.update_slot_reservation();

commit;
