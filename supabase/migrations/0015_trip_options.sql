-- Round trips, route checkpoints, and a clearer included/excluded model
-- for what a trip's fixed price covers — requested directly, not part of
-- the original blueprint phases.
--
-- `inclusions` (0004) stays schemaless jsonb — no column migration needed
-- there, just a shape change in what the app writes/reads: from
-- { accommodation, meals, addOns } to { included: string[], excluded:
-- string[] }, a simpler tag-list model that covers "hotel", "food",
-- "travel guide", or anything else a Lead wants to list, without a fixed
-- schema for what counts as an inclusion.

alter table public.trips
  add column is_round_trip boolean not null default false,
  add column return_depart_at timestamptz,
  add constraint round_trip_has_return_date
    check (not is_round_trip or return_depart_at is not null),
  add constraint return_after_departure
    check (return_depart_at is null or return_depart_at > depart_at);

-- Route stops between origin and destination (e.g. Delhi -> Chandigarh
-- (stop) -> Manali) — trip-level itinerary, set by the Lead at creation
-- time. Distinct from trip_pickup_points (0004): those are rider-boarding
-- locations, editable post-publish, one selected per member; checkpoints
-- are the trip's own route, same for everyone, ordered.
create table public.trip_checkpoints (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  label text not null,
  lat numeric not null,
  lng numeric not null,
  sort_order int not null default 0
);

alter table public.trip_checkpoints enable row level security;

create policy "checkpoints readable with their trip"
  on public.trip_checkpoints for select
  using (exists (select 1 from public.trips where trips.id = trip_id and (trips.published or trips.lead_id = auth.uid())));

create policy "leads manage checkpoints on their own trips"
  on public.trip_checkpoints for all
  using (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()))
  with check (exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid()));

create index trip_checkpoints_trip_id_idx on public.trip_checkpoints(trip_id, sort_order);
