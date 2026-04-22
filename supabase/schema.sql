-- ACIS schema for Issue #4:
-- Authentication, profile management, and role-based dashboards.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name varchar(255) not null,
  email varchar(255) not null unique,
  password varchar(255),
  role varchar(32) not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- If users table was created earlier with password NOT NULL, relax it.
alter table if exists public.users
  alter column password drop not null;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  phone varchar(30),
  address varchar(255),
  avatar_url varchar(512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users (role);
create index if not exists idx_profiles_user_id on public.profiles (user_id);

-- Mirror Supabase Auth users into application tables automatically.
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_full_name text;
  meta_phone text;
  meta_address text;
  meta_avatar_url text;
begin
  meta_full_name := nullif(new.raw_user_meta_data ->> 'full_name', '');
  meta_phone := nullif(new.raw_user_meta_data ->> 'phone', '');
  meta_address := nullif(new.raw_user_meta_data ->> 'address', '');
  meta_avatar_url := nullif(new.raw_user_meta_data ->> 'avatar_url', '');

  insert into public.users (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(meta_full_name, split_part(new.email, '@', 1)),
    new.email,
    'customer',
    true
  )
  on conflict (id) do nothing;

  insert into public.profiles (user_id, phone, address, avatar_url)
  values (new.id, meta_phone, meta_address, meta_avatar_url)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

-- Backfill existing auth users that were created before this trigger.
insert into public.users (id, full_name, email, role, is_active)
select
  au.id,
  coalesce(nullif(au.raw_user_meta_data ->> 'full_name', ''), split_part(au.email, '@', 1)),
  au.email,
  'customer',
  true
from auth.users as au
left join public.users as pu on pu.id = au.id
where pu.id is null
on conflict (id) do nothing;

insert into public.profiles (user_id, phone, address, avatar_url)
select
  au.id,
  nullif(au.raw_user_meta_data ->> 'phone', ''),
  nullif(au.raw_user_meta_data ->> 'address', ''),
  nullif(au.raw_user_meta_data ->> 'avatar_url', '')
from auth.users as au
left join public.profiles as pp on pp.user_id = au.id
where pp.user_id is null
on conflict (user_id) do nothing;

alter table public.users enable row level security;
alter table public.profiles enable row level security;

create policy "users_select_own_or_admin"
on public.users
for select
to authenticated
using (auth.uid() = id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
));

create policy "users_update_own_or_admin"
on public.users
for update
to authenticated
using (auth.uid() = id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
))
with check (auth.uid() = id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
));

create policy "users_insert_self"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
));

create policy "profiles_insert_own_or_admin"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
));

create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
))
with check (auth.uid() = user_id or exists (
  select 1 from public.users as current_user
  where current_user.id = auth.uid()
  and current_user.role = 'admin'
));

-- Optional helper trigger for updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();
