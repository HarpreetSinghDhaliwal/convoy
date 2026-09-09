import { supabase } from "@/lib/supabase/client";
import type { RouteResult } from "../types";

export async function saveTripRoute(tripId: string, route: RouteResult): Promise<void> {
  const { error } = await supabase.rpc("save_trip_route", {
    p_trip_id: tripId,
    p_geojson: route.geometry,
    p_distance_km: route.distanceKm,
    p_duration_min: route.durationMin,
  });
  if (error) throw error;
}

export interface OverlappingTrip {
  tripId: string;
  destination: string;
  departAt: string;
  distanceKm: number;
}

// Phase 05. Only returns results once both trips have a saved route
// (saveTripRoute above) — a trip created before routing existed, or one
// whose OSRM call failed silently, just won't have matches.
export async function findOverlappingTrips(
  tripId: string,
  bufferKm = 5,
): Promise<OverlappingTrip[]> {
  const { data, error } = await supabase.rpc("find_overlapping_trips", {
    p_trip_id: tripId,
    p_buffer_km: bufferKm,
  });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    tripId: row.trip_id as string,
    destination: row.destination as string,
    departAt: row.depart_at as string,
    distanceKm: Number(row.distance_km),
  }));
}
