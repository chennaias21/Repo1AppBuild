-- Excel Mastery: core schema
-- Run this once in the Supabase project's SQL editor (or via `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth.users row, holds registration + access fields
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  mobile text,
  access_status text not null default 'free' check (access_status in ('free', 'pending', 'paid')),
  access_granted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: user can read own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user can update own row"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only the service role (backend) may ever change access_status / access_granted_at.
-- A signed-in user's own UPDATE (e.g. editing their name) is allowed by the RLS
-- policy above, but this trigger silently reverts any attempt to touch the
-- access-control columns unless the request is running as service_role —
-- so the payment gate cannot be bypassed via the Supabase client SDK, browser
-- devtools, or a direct REST call with the anon key.
create or replace function public.protect_access_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.access_status := old.access_status;
    new.access_granted_at := old.access_granted_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_access_columns_trigger on public.profiles;
create trigger protect_access_columns_trigger
  before update on public.profiles
  for each row
  execute function public.protect_access_columns();

-- Auto-create a profile row whenever a new auth user is created (e.g. after OTP sign-up).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- payments: one row per Razorpay order, source of truth for payment state
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  amount_paise integer not null,
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

alter table public.payments enable row level security;

create policy "payments: user can read own rows"
  on public.payments for select
  using (auth.uid() = user_id);

-- No insert/update policy for regular users: orders are created and verified
-- exclusively by backend routes using the service-role key.

-- ---------------------------------------------------------------------------
-- lesson_progress: per-user completion tracking
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_slug text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (user_id, lesson_slug)
);

alter table public.lesson_progress enable row level security;

create policy "progress: user can read own rows"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "progress: user can insert own rows"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "progress: user can update own rows"
  on public.lesson_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- achievements: unlocked milestones
-- ---------------------------------------------------------------------------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_key)
);

alter table public.achievements enable row level security;

create policy "achievements: user can read own rows"
  on public.achievements for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- sheets_sync_log: records failed admin-sheet syncs for later reconciliation
-- ---------------------------------------------------------------------------
create table if not exists public.sheets_sync_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  status text not null check (status in ('pending', 'synced', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

alter table public.sheets_sync_log enable row level security;
-- No public policies: only the service role touches this table.
