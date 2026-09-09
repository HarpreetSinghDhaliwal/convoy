import { supabase } from "@/lib/supabase/client";
import type { FavoriteLocation } from "../types";

function rowToFavorite(row: Record<string, unknown>): FavoriteLocation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    label: row.label as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
    radiusKm: Number(row.radius_km),
    createdAt: row.created_at as string,
  };
}

export async function listFavoriteLocations(userId: string): Promise<FavoriteLocation[]> {
  const { data, error } = await supabase
    .from("favorite_locations")
    .select()
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map(rowToFavorite);
}

export async function addFavoriteLocation(
  userId: string,
  label: string,
  lat: number,
  lng: number,
  radiusKm = 50,
): Promise<void> {
  const { error } = await supabase
    .from("favorite_locations")
    .insert({ user_id: userId, label, lat, lng, radius_km: radiusKm });
  if (error) throw error;
}

export async function removeFavoriteLocation(id: string): Promise<void> {
  const { error } = await supabase.from("favorite_locations").delete().eq("id", id);
  if (error) throw error;
}
