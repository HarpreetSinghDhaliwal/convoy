import { supabase } from "@/lib/supabase/client";
import type { PickupPoint } from "../types";

function rowToPickupPoint(row: Record<string, unknown>): PickupPoint {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    label: row.label as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
  };
}

export async function listPickupPoints(tripId: string): Promise<PickupPoint[]> {
  const { data, error } = await supabase
    .from("trip_pickup_points")
    .select()
    .eq("trip_id", tripId);
  if (error) throw error;
  return (data ?? []).map(rowToPickupPoint);
}

export async function addPickupPoint(
  tripId: string,
  label: string,
  lat: number,
  lng: number,
): Promise<PickupPoint> {
  const { data, error } = await supabase
    .from("trip_pickup_points")
    .insert({ trip_id: tripId, label, lat, lng })
    .select()
    .single();
  if (error) throw error;
  return rowToPickupPoint(data);
}

export async function removePickupPoint(id: string): Promise<void> {
  const { error } = await supabase.from("trip_pickup_points").delete().eq("id", id);
  if (error) throw error;
}
