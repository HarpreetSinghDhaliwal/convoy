-- Phase 16: Allow all authenticated registered travelers to create trips & join requests
-- (KYC verification is highlighted as a trust & safety badge rather than hard blocking trip creation)

alter table public.trips add column if not exists is_round_trip boolean not null default false;
alter table public.trips add column if not exists return_depart_at timestamptz;

drop policy if exists "verified users create their own trips" on public.trips;
drop policy if exists "authenticated users create their own trips" on public.trips;

create policy "authenticated users create their own trips"
  on public.trips for insert
  with check (
    lead_id = auth.uid()
  );

drop policy if exists "verified users request to join" on public.trip_members;
drop policy if exists "authenticated users request to join" on public.trip_members;

create policy "authenticated users request to join"
  on public.trip_members for insert
  with check (
    user_id = auth.uid()
  );

-- Ensure trip_checkpoints table exists
create table if not exists public.trip_checkpoints (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  lat numeric not null,
  lng numeric not null,
  sort_order int not null default 0
);

alter table public.trip_checkpoints enable row level security;

drop policy if exists "checkpoints readable with their trip" on public.trip_checkpoints;
create policy "checkpoints readable with their trip"
  on public.trip_checkpoints for select
  using (exists (select 1 from public.trips where trips.id = trip_id and (trips.published or trips.lead_id = auth.uid())));

drop policy if exists "leads manage checkpoints on their own trips" on public.trip_checkpoints;
create policy "leads manage checkpoints on their own trips"
  on public.trip_checkpoints for all
  using (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()));

create index if not exists trip_checkpoints_trip_id_idx on public.trip_checkpoints(trip_id, sort_order);
