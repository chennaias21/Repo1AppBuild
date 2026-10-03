-- SkillSopan: course completion certificates. Run once in the Supabase SQL editor, after 0002.
-- Safe to run twice.

create table if not exists public.certificates (
  id text primary key,
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  holder_name text not null,
  issued_at timestamptz not null default now()
);

alter table public.certificates enable row level security;

-- A learner can read their own certificate. Issuing and public verification both go through
-- backend routes using the service role, so there is no insert/update policy and no public read.
drop policy if exists "certificates: read own" on public.certificates;
create policy "certificates: read own" on public.certificates for select using (auth.uid() = user_id);
