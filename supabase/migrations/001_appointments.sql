-- supabase/migrations/001_appointments.sql
-- Run this once in Supabase -> SQL Editor -> New query -> Run.
-- Safe to run multiple times (idempotent).

create table if not exists public.appointments (
  id uuid primary key,
  patient_id uuid,
  doc jsonb not null,
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists appointments_updated_idx on public.appointments (updated_at);
create index if not exists appointments_patient_idx on public.appointments (patient_id);

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before insert or update on public.appointments
  for each row execute function public.touch_updated_at();

alter table public.appointments enable row level security;

drop policy if exists "clinic staff" on public.appointments;
create policy "clinic staff" on public.appointments for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.appointments to authenticated;
