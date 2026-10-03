-- SkillSopan: show who paid. Adds email, name and mobile to each payment row and fills in
-- the rows that already exist. Run once in the Supabase SQL editor, after 0003. Safe to run twice.

alter table public.payments add column if not exists email text;
alter table public.payments add column if not exists full_name text;
alter table public.payments add column if not exists mobile text;

update public.payments p
set email = u.email
from auth.users u
where u.id = p.user_id and p.email is null;

update public.payments p
set full_name = pr.full_name,
    mobile = pr.mobile
from public.profiles pr
where pr.id = p.user_id and p.full_name is null;
