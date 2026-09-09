-- Phase 01/05 routing support. Route geometry is written via an RPC, not a
-- raw insert — supabase-js can't hand a GeoJSON payload straight to a
-- `geography` column; ST_GeomFromGeoJSON needs to run server-side. The
-- function checks trip ownership itself since SECURITY DEFINER bypasses RLS.

create or replace function public.save_trip_route(
  p_trip_id uuid,
  p_geojson jsonb,
  p_distance_km numeric,
  p_duration_min numeric
) returns void as $$
begin
  if not exists (select 1 from public.trips where id = p_trip_id and lead_id = auth.uid()) then
    raise exception 'Only the trip Lead can set its route';
  end if;

  insert into public.trip_routes (trip_id, geometry, distance_km, duration_min)
  values (
    p_trip_id,
    ST_SetSRID(ST_GeomFromGeoJSON(p_geojson::text), 4326)::geography,
    p_distance_km,
    p_duration_min
  )
  on conflict (trip_id) do update set
    geometry = excluded.geometry,
    distance_km = excluded.distance_km,
    duration_min = excluded.duration_min;
end;
$$ language plpgsql security definer;

-- Phase 05: route-overlap trip matching. Corridor buffer in km, converted to
-- meters for ST_DWithin (geography distances are in meters). Only matches
-- published, non-cancelled, future trips other than the one asked about.
create or replace function public.find_overlapping_trips(p_trip_id uuid, p_buffer_km numeric default 5)
returns table(trip_id uuid, destination text, depart_at timestamptz, distance_km numeric) as $$
  select t.id, t.destination, t.depart_at, tr2.distance_km
  from public.trip_routes tr1
  join public.trip_routes tr2 on tr2.trip_id <> tr1.trip_id
  join public.trips t on t.id = tr2.trip_id
  where tr1.trip_id = p_trip_id
    and t.published = true
    and t.cancelled_at is null
    and t.depart_at > now()
    and ST_DWithin(tr1.geometry, tr2.geometry, p_buffer_km * 1000);
$$ language sql security definer stable;
