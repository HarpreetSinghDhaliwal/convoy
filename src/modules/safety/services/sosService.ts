import { supabase } from "@/lib/supabase/client";

export interface SosEvent {
  id: string;
  userId: string;
  tripId: string | null;
  lat: number;
  lng: number;
  triggeredAt: string;
  resolvedAt: string | null;
}

function rowToSosEvent(row: Record<string, unknown>): SosEvent {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tripId: (row.trip_id as string) ?? null,
    lat: Number(row.lat),
    lng: Number(row.lng),
    triggeredAt: row.triggered_at as string,
    resolvedAt: (row.resolved_at as string) ?? null,
  };
}

export async function logSosEvent(
  userId: string,
  lat: number,
  lng: number,
  tripId?: string,
): Promise<SosEvent> {
  const { data, error } = await supabase
    .from("sos_events")
    .insert({ user_id: userId, lat, lng, trip_id: tripId ?? null })
    .select()
    .single();
  if (error) throw error;
  return rowToSosEvent(data);
}

export async function resolveSosEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("sos_events")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;
}
