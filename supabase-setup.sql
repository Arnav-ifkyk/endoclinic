-- EndoClinic — run this once in Supabase → SQL Editor → New query → Run.
-- Creates the two tables, keeps a server timestamp on every change,
-- and allows access ONLY to signed-in users (your dad's login).

create table if not exists public.patients (
  id uuid primary key,
  doc jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key,
  patient_id uuid not null,
  doc jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists patients_updated_idx on public.patients (updated_at);
create index if not exists visits_updated_idx on public.visits (updated_at);
create index if not exists visits_patient_idx on public.visits (patient_id);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

drop trigger if exists patients_touch on public.patients;
create trigger patients_touch before insert or update on public.patients
  for each row execute function public.touch_updated_at();
drop trigger if exists visits_touch on public.visits;
create trigger visits_touch before insert or update on public.visits
  for each row execute function public.touch_updated_at();

-- Row Level Security: nobody without a login can read or write anything.
alter table public.patients enable row level security;
alter table public.visits   enable row level security;

drop policy if exists "clinic staff" on public.patients;
create policy "clinic staff" on public.patients for all to authenticated using (true) with check (true);
drop policy if exists "clinic staff" on public.visits;
create policy "clinic staff" on public.visits   for all to authenticated using (true) with check (true);

-- Records are never hard-deleted by the app (deleted = true), so history can be recovered.
