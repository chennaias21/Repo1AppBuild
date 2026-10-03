-- SkillSopan: pricing tiers, lesson progress by lesson id, quiz attempts, certificates.
-- Run once in the Supabase SQL editor, after 0001_init.sql. Safe to run twice.

-- Which plan was bought, and when access ends (null = lifetime).
alter table public.payments add column if not exists tier text;
alter table public.payments add column if not exists expires_at timestamptz;

-- Progress is keyed by the lesson id used in the curriculum ("3.3").
create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

alter table public.progress enable row level security;

drop policy if exists "progress: read own" on public.progress;
create policy "progress: read own" on public.progress for select using (auth.uid() = user_id);
drop policy if exists "progress: insert own" on public.progress;
create policy "progress: insert own" on public.progress for insert with check (auth.uid() = user_id);
drop policy if exists "progress: update own" on public.progress;
create policy "progress: update own" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per quiz attempt. Written by the backend only, so scores cannot be edited from the browser.
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  score integer not null,
  total integer not null,
  answers jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, lesson_id);
alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_attempts: read own" on public.quiz_attempts;
create policy "quiz_attempts: read own" on public.quiz_attempts for select using (auth.uid() = user_id);
