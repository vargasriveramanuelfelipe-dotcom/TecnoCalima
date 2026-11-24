-- Run in the Supabase SQL Editor. Enable RLS and create policies appropriate
-- to your deployment before using this database with real customers.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(12, 2) not null check (price >= 0),
  old_price numeric(12, 2),
  rating numeric(3, 2) not null default 4.8,
  reviews integer not null default 0,
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  badge text not null default '',
  image_url text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  customer_email text not null,
  phone text not null,
  address text not null,
  items jsonb not null default '[]'::jsonb,
  total numeric(12, 2) not null check (total >= 0),
  status text not null default 'Recibido'
    check (status in ('Recibido', 'En preparación', 'Enviado', 'Entregado', 'Cancelado')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Policies for this demo storefront:
-- Public read access is needed for the customer catalog.
-- Public write access is needed because the demo admin has no authentication.
-- Replace these policies with authenticated/admin-only policies before
-- deploying a real store.
drop policy if exists "Public read products" on public.products;
create policy "Public read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Demo write products" on public.products;
create policy "Demo write products"
  on public.products for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Public read orders" on public.orders;
create policy "Public read orders"
  on public.orders for select
  to anon, authenticated
  using (true);

drop policy if exists "Customer create orders" on public.orders;
create policy "Customer create orders"
  on public.orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Demo update orders" on public.orders;
create policy "Demo update orders"
  on public.orders for update
  to anon, authenticated
  using (true)
  with check (true);
