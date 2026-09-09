-- Phase 01: the trip board (blueprint §01, §06). Route geometry storage
-- (trip_routes) and the PostGIS extension are included now even though the
-- routing module's UI isn't built yet — Phase 05's route-matching depends
-- on this existing from the start, not bolted on later.

create extension if not exists postgis;

create type trip_member_status as enum ('requested', 'approved', 'declined', 'withdrawn', 'left');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.users(id),
  destination text not null,
  origin_label text not null,
  origin_lat numeric not null,
  origin_lng numeric not null,
  destination_lat numeric not null,
  destination_lng numeric not null,
  depart_at timestamptz not null,
  seats_total int not null check (seats_total > 0),
  price_per_seat numeric not null check (price_per_seat >= 0),
  women_only boolean not null default false,
  short_note text,
  description text,
  -- { accommodation: { type, sharing, name }, meals: string, add_ons: [{ title, note }] }
  inclusions jsonb,
  -- [{ label, url, moderation_status }]
  links jsonb,
  published boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trips enable row level security;

create policy "published trips are readable by anyone signed in"
  on public.trips for select
  using (published = true or lead_id = auth.uid());

create policy "verified users create their own trips"
  on public.trips for insert
  with check (
    lead_id = auth.uid()
    and exists (select 1 from public.users where id = auth.uid() and kyc_status = 'verified')
  );

create policy "leads update their own trips"
  on public.trips for update
  using (lead_id = auth.uid());

create table public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.users(id),
  pickup_point_id uuid,
  status trip_member_status not null default 'requested',
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

alter table public.trip_members enable row level security;

create policy "members see their own membership rows"
  on public.trip_members for select
  using (user_id = auth.uid());

create policy "leads see membership rows on their own trips"
  on public.trip_members for select
  using (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()));

create policy "verified users request to join"
  on public.trip_members for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.users where id = auth.uid() and kyc_status = 'verified')
  );

create policy "leads approve/decline, members withdraw/leave"
  on public.trip_members for update
  using (
    user_id = auth.uid()
    or exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid())
  );

create table public.trip_pickup_points (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  lat numeric not null,
  lng numeric not null
);

alter table public.trip_pickup_points enable row level security;

create policy "pickup points readable with their trip"
  on public.trip_pickup_points for select
  using (exists (select 1 from public.trips where trips.id = trip_id and (trips.published or trips.lead_id = auth.uid())));

create policy "leads manage pickup points on their own trips"
  on public.trip_pickup_points for all
  using (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()));

create table public.trip_media (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  url text not null,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'flagged')),
  uploaded_at timestamptz not null default now()
);

alter table public.trip_media enable row level security;

create policy "approved media readable with the trip; leads see their own pending media"
  on public.trip_media for select
  using (
    moderation_status = 'approved'
    or exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid())
  );

create policy "leads upload media to their own trips"
  on public.trip_media for insert
  with check (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()));

-- Route geometry — populated once the routing module calls OSRM (Phase 01
-- UI) and read by Phase 05's overlap-matching queries later.
create table public.trip_routes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  geometry geography(linestring, 4326),
  distance_km numeric,
  duration_min numeric
);

alter table public.trip_routes enable row level security;

create policy "route geometry readable with its trip"
  on public.trip_routes for select
  using (exists (select 1 from public.trips where trips.id = trip_id and (trips.published or trips.lead_id = auth.uid())));

create policy "leads write route geometry for their own trips"
  on public.trip_routes for all
  using (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()));

create index trip_routes_geometry_idx on public.trip_routes using gist (geometry);
