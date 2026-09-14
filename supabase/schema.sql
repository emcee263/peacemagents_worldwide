create extension if not exists "pgcrypto";

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'customer'
    check(role in ('customer','staff','admin','developer')),
  created_at timestamptz not null default now()
);

create table if not exists categories(
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table if not exists products(
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists product_variants(
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique,
  size text,
  stock integer not null default 0,
  price numeric(12,2)
);

create table if not exists orders(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists order_items(
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0
);

create table if not exists newsletter_subscribers(
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages(
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- =========================================================
-- ENABLE RLS
-- =========================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('staff','admin','developer')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin','developer')
  );
$$;

-- =========================================================
-- REMOVE OLD POLICIES
-- =========================================================

drop policy if exists "published products are public" on products;

drop policy if exists "users can view own profile" on profiles;
drop policy if exists "users can update own profile" on profiles;
drop policy if exists "staff can view profiles" on profiles;
drop policy if exists "staff can update profiles" on profiles;

drop policy if exists "published categories are public" on categories;
drop policy if exists "staff can manage categories" on categories;

drop policy if exists "published variants are public" on product_variants;
drop policy if exists "staff can manage variants" on product_variants;

drop policy if exists "staff can manage products" on products;

drop policy if exists "users can view own orders" on orders;
drop policy if exists "staff can view orders" on orders;
drop policy if exists "staff can update orders" on orders;

drop policy if exists "users can view own order items" on order_items;
drop policy if exists "staff can view order items" on order_items;

drop policy if exists "staff can view newsletter subscribers" on newsletter_subscribers;
drop policy if exists "staff can manage newsletter subscribers" on newsletter_subscribers;

drop policy if exists "staff can view contact messages" on contact_messages;
drop policy if exists "staff can update contact messages" on contact_messages;

-- =========================================================
-- PROFILES
-- =========================================================

create policy "users can view own profile"
on profiles
for select
using(auth.uid() = id);


create policy "staff can view profiles"
on profiles
for select
using(public.is_staff());

create policy "staff can update profiles"
on profiles
for update
using(public.is_staff())
with check(public.is_staff());

-- =========================================================
-- CATEGORIES
-- =========================================================

create policy "published categories are public"
on categories
for select
using(
  exists(
    select 1
    from products
    where products.category_id = categories.id
      and products.published = true
  )
);

create policy "staff can manage categories"
on categories
for all
using(public.is_staff())
with check(public.is_staff());

-- =========================================================
-- PRODUCTS
-- =========================================================

create policy "published products are public"
on products
for select
using(published = true);

create policy "staff can manage products"
on products
for all
using(public.is_staff())
with check(public.is_staff());

-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================

create policy "published variants are public"
on product_variants
for select
using(
  exists(
    select 1
    from products
    where products.id = product_variants.product_id
      and products.published = true
  )
);

create policy "staff can manage variants"
on product_variants
for all
using(public.is_staff())
with check(public.is_staff());

-- =========================================================
-- ORDERS
-- =========================================================

create policy "users can view own orders"
on orders
for select
using(auth.uid() = user_id);

create policy "staff can view orders"
on orders
for select
using(public.is_staff());

create policy "staff can update orders"
on orders
for update
using(public.is_staff())
with check(public.is_staff());

-- =========================================================
-- ORDER ITEMS
-- =========================================================

create policy "users can view own order items"
on order_items
for select
using(
  exists(
    select 1
    from orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

create policy "staff can view order items"
on order_items
for select
using(public.is_staff());

-- =========================================================
-- NEWSLETTER
-- =========================================================

create policy "staff can view newsletter subscribers"
on newsletter_subscribers
for select
using(public.is_staff());

create policy "staff can manage newsletter subscribers"
on newsletter_subscribers
for all
using(public.is_staff())
with check(public.is_staff());

-- =========================================================
-- CONTACT MESSAGES
-- =========================================================

create policy "staff can view contact messages"
on contact_messages
for select
using(public.is_staff());

create policy "staff can update contact messages"
on contact_messages
for update
using(public.is_staff())
with check(public.is_staff());
-- =========================================================
-- PROFILE CREATION TRIGGER
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, email, role)
  values(
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'customer'
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
