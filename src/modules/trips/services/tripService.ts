import { supabase } from "@/lib/supabase/client";
import type {
  CreateTripInput,
  RequestToJoinOptions,
  Trip,
  TripCheckpoint,
  TripFilters,
  TripMember,
  TripMemberStatus,
} from "../types";

// Maps this module's camelCase domain types to/from Postgres's snake_case
// rows in one place — nothing outside this file should know the DB's
// column naming, only the Trip/TripMember shape.

function rowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    leadId: row.lead_id as string,
    destination: row.destination as string,
    originLabel: row.origin_label as string,
    originLat: Number(row.origin_lat),
    originLng: Number(row.origin_lng),
    destinationLat: Number(row.destination_lat),
    destinationLng: Number(row.destination_lng),
    departAt: row.depart_at as string,
    isRoundTrip: row.is_round_trip as boolean,
    returnDepartAt: (row.return_depart_at as string) ?? null,
    seatsTotal: row.seats_total as number,
    pricePerSeat: Number(row.price_per_seat),
    womenOnly: row.women_only as boolean,
    shortNote: (row.short_note as string) ?? null,
    description: (row.description as string) ?? null,
    inclusions: (row.inclusions as Trip["inclusions"]) ?? null,
    links: (row.links as Trip["links"]) ?? null,
    groupChatEnabled: Boolean(row.group_chat_enabled),
    published: row.published as boolean,
    cancelledAt: (row.cancelled_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function rowToMember(row: Record<string, unknown>): TripMember {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    userId: row.user_id as string,
    pickupPointId: (row.pickup_point_id as string) ?? null,
    status: row.status as TripMemberStatus,
    joinedAt: row.joined_at as string,
    seatsRequested: row.seats_requested != null ? Number(row.seats_requested) : 1,
    requestedLat: row.requested_lat != null ? Number(row.requested_lat) : null,
    requestedLng: row.requested_lng != null ? Number(row.requested_lng) : null,
  };
}

export async function createTrip(leadId: string, input: CreateTripInput): Promise<Trip> {
  const insertPayload: Record<string, any> = {
    lead_id: leadId,
    destination: input.destination,
    origin_label: input.originLabel,
    origin_lat: input.originLat,
    origin_lng: input.originLng,
    destination_lat: input.destinationLat,
    destination_lng: input.destinationLng,
    depart_at: input.departAt,
    seats_total: input.seatsTotal,
    price_per_seat: input.pricePerSeat,
    women_only: input.womenOnly ?? false,
    short_note: input.shortNote ?? null,
    description: input.description ?? null,
    inclusions: input.inclusions ?? null,
    published: true,
  };

  if (input.isRoundTrip !== undefined) {
    insertPayload.is_round_trip = input.isRoundTrip;
  }
  if (input.returnDepartAt) {
    insertPayload.return_depart_at = input.returnDepartAt;
  }

  let { data, error } = await supabase
    .from("trips")
    .insert(insertPayload)
    .select()
    .single();

  // If column error (e.g. is_round_trip or return_depart_at columns not yet applied in remote DB)
  if (error && (error.message?.includes("is_round_trip") || error.message?.includes("return_depart_at"))) {
    console.warn("createTrip: is_round_trip column missing on DB, retrying without optional round trip columns");
    delete insertPayload.is_round_trip;
    delete insertPayload.return_depart_at;
    const retry = await supabase.from("trips").insert(insertPayload).select().single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error("createTrip Supabase error:", error);
    if (error.message?.includes("row-level security")) {
      throw new Error("Trip creation blocked by safety policy. Please run migration 0016 in Supabase SQL editor or verify account.");
    }
    throw new Error(error.message || "Couldn't publish this trip — try again");
  }

  const trip = rowToTrip(data);

  if (input.checkpoints?.length) {
    try {
      const { error: checkpointError } = await supabase.from("trip_checkpoints").insert(
        input.checkpoints.map((cp, i) => ({
          trip_id: trip.id,
          label: cp.label,
          lat: cp.lat,
          lng: cp.lng,
          sort_order: i,
        })),
      );
      if (checkpointError) console.error("createTrip: failed to save checkpoints", checkpointError);
    } catch (cpErr) {
      console.warn("createTrip: checkpoint insert ignored:", cpErr);
    }
  }

  return trip;
}

function rowToCheckpoint(row: Record<string, unknown>): TripCheckpoint {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    label: row.label as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
    sortOrder: row.sort_order as number,
  };
}

export async function listCheckpoints(tripId: string): Promise<TripCheckpoint[]> {
  const { data, error } = await supabase
    .from("trip_checkpoints")
    .select()
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToCheckpoint);
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function listTrips(filters: TripFilters = {}): Promise<Trip[]> {
  let query = supabase.from("trips").select().eq("published", true).is("cancelled_at", null);

  // Exclude expired trips: depart_at >= afterDate OR (now - 2 hours buffer)
  const cutoff = filters.afterDate || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  query = query.gte("depart_at", cutoff);

  if (filters.womenOnlyOnly) {
    query = query.eq("women_only", true);
  }
  if (filters.roundTripOnly) {
    query = query.eq("is_round_trip", true);
  }

  const { data, error } = await query.order("depart_at", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  let trips = data.map(rowToTrip);
  const tripIds = trips.map((t) => t.id);

  // Fetch approved seat counts for exact seat availability filtering
  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("trip_id, seats_requested")
    .in("trip_id", tripIds)
    .eq("status", "approved");

  const bookedSeatsMap = new Map<string, number>();
  (memberRows ?? []).forEach((m: any) => {
    const prev = bookedSeatsMap.get(m.trip_id) ?? 0;
    const count = m.seats_requested != null ? Number(m.seats_requested) : 1;
    bookedSeatsMap.set(m.trip_id, prev + count);
  });

  // Filter by requested seats availability (e.g. 1, 2, 3, 4 seats)
  if (filters.seatsNeeded && filters.seatsNeeded > 0) {
    const needed = filters.seatsNeeded;
    trips = trips.filter((t) => {
      const booked = bookedSeatsMap.get(t.id) ?? 0;
      const left = t.seatsTotal - booked;
      return left >= needed;
    });
  }

  if (trips.length === 0) return [];

  // Fetch intermediate checkpoints for route stop matching
  const { data: checkpointRows } = await supabase
    .from("trip_checkpoints")
    .select("trip_id, label, lat, lng, sort_order")
    .in("trip_id", trips.map((t) => t.id));

  const checkpointsByTrip = new Map<string, Array<{ label: string; lat: number; lng: number }>>();
  (checkpointRows ?? []).forEach((cp: any) => {
    const list = checkpointsByTrip.get(cp.trip_id) ?? [];
    list.push({ label: cp.label, lat: Number(cp.lat), lng: Number(cp.lng) });
    checkpointsByTrip.set(cp.trip_id, list);
  });

  const maxRadiusKm = filters.radiusKm || 50; // 50 km strict corridor radius for pinpoint search

  // Data structure to hold match metadata for ranking and en-route badges
  interface MatchMeta {
    pickupDist: number;
    pickupLabel: string;
    isEnRoutePickup: boolean;
    dropoffDist: number;
    dropoffLabel: string;
    isEnRouteDropoff: boolean;
  }

  const tripMatchMeta = new Map<string, MatchMeta>();

  // Filter by Origin & Destination criteria (Pins and Text)
  trips = trips.filter((t) => {
    const rawStops = checkpointsByTrip.get(t.id) ?? [];
    
    // Ordered itinerary: Origin (0) -> Checkpoint 1 (1) -> ... -> Destination (N)
    const routeWaypoints = [
      { label: t.originLabel, lat: t.originLat, lng: t.originLng, isOrigin: true, isDest: false },
      ...rawStops.map((s) => ({ label: s.label, lat: s.lat, lng: s.lng, isOrigin: false, isDest: false })),
      { label: t.destination, lat: t.destinationLat, lng: t.destinationLng, isOrigin: false, isDest: true },
    ];

    let bestPickupIdx = -1;
    let minPickupDist = Infinity;
    let matchedPickupLabel = t.originLabel;
    let isEnRoutePickup = false;

    // 1. Origin / Boarding Point Matching
    if (filters.originLat !== undefined && filters.originLng !== undefined) {
      for (let i = 0; i < routeWaypoints.length - 1; i++) {
        const wp = routeWaypoints[i];
        const dist = haversineDistanceKm(filters.originLat, filters.originLng, wp.lat, wp.lng);
        if (dist <= maxRadiusKm && dist < minPickupDist) {
          minPickupDist = dist;
          bestPickupIdx = i;
          matchedPickupLabel = wp.label;
          isEnRoutePickup = !wp.isOrigin;
        }
      }
      if (bestPickupIdx === -1) return false;
    } else if (filters.origin && filters.origin.trim()) {
      const oTerm = filters.origin.trim().toLowerCase();
      const matchOrigin = t.originLabel.toLowerCase().includes(oTerm);
      const matchStopIdx = rawStops.findIndex((s) => s.label.toLowerCase().includes(oTerm));
      if (!matchOrigin && matchStopIdx === -1) return false;
      bestPickupIdx = matchOrigin ? 0 : matchStopIdx + 1;
      matchedPickupLabel = matchOrigin ? t.originLabel : rawStops[matchStopIdx].label;
      isEnRoutePickup = !matchOrigin;
    }

    let bestDropoffIdx = -1;
    let minDropoffDist = Infinity;
    let matchedDropoffLabel = t.destination;
    let isEnRouteDropoff = false;

    // 2. Destination / Dropoff Point Matching
    if (filters.destinationLat !== undefined && filters.destinationLng !== undefined) {
      const startIndex = bestPickupIdx !== -1 ? bestPickupIdx + 1 : 1;
      for (let j = startIndex; j < routeWaypoints.length; j++) {
        const wp = routeWaypoints[j];
        const dist = haversineDistanceKm(filters.destinationLat, filters.destinationLng, wp.lat, wp.lng);
        if (dist <= maxRadiusKm && dist < minDropoffDist) {
          minDropoffDist = dist;
          bestDropoffIdx = j;
          matchedDropoffLabel = wp.label;
          isEnRouteDropoff = !wp.isDest;
        }
      }
      if (bestDropoffIdx === -1) return false;
    } else if (filters.destination && filters.destination.trim()) {
      const dTerm = filters.destination.trim().toLowerCase();
      const matchDest = t.destination.toLowerCase().includes(dTerm);
      const matchOrigin = !filters.origin && t.originLabel.toLowerCase().includes(dTerm);
      const matchNote = (t.shortNote || "").toLowerCase().includes(dTerm);
      const matchStopIdx = rawStops.findIndex((s) => s.label.toLowerCase().includes(dTerm));

      if (!matchDest && matchStopIdx === -1 && !matchOrigin && !matchNote) return false;

      // Ensure dropoff occurs after boarding stop along forward route
      if (matchStopIdx !== -1 && bestPickupIdx !== -1 && matchStopIdx + 1 <= bestPickupIdx) {
        return false;
      }

      bestDropoffIdx = matchDest ? routeWaypoints.length - 1 : matchStopIdx + 1;
      matchedDropoffLabel = matchDest ? t.destination : (rawStops[matchStopIdx]?.label || t.destination);
      isEnRouteDropoff = !matchDest && matchStopIdx !== -1;
    }

    // Save match metadata for this trip
    tripMatchMeta.set(t.id, {
      pickupDist: minPickupDist !== Infinity ? minPickupDist : 0,
      pickupLabel: matchedPickupLabel,
      isEnRoutePickup,
      dropoffDist: minDropoffDist !== Infinity ? minDropoffDist : 0,
      dropoffLabel: matchedDropoffLabel,
      isEnRouteDropoff,
    });

    return true;
  });

  // Sort trips by closest pickup proximity first (e.g., <5km before 45km), then by departure time
  trips.sort((a, b) => {
    const metaA = tripMatchMeta.get(a.id);
    const metaB = tripMatchMeta.get(b.id);
    if (metaA && metaB && metaA.pickupDist !== metaB.pickupDist) {
      return metaA.pickupDist - metaB.pickupDist;
    }
    return new Date(a.departAt).getTime() - new Date(b.departAt).getTime();
  });

  return trips.map((t) => {
    const booked = bookedSeatsMap.get(t.id) ?? 0;
    return {
      ...t,
      seatsAvailable: Math.max(0, t.seatsTotal - booked),
      checkpointCount: (checkpointsByTrip.get(t.id) ?? []).length,
    };
  });
}

export async function getTrip(tripId: string): Promise<Trip> {
  const { data, error } = await supabase.from("trips").select().eq("id", tripId).single();
  if (error) throw error;
  return rowToTrip(data);
}

export async function cancelTrip(tripId: string): Promise<void> {
  const { error } = await supabase
    .from("trips")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", tripId);
  if (error) throw error;
}

export async function cancelTripWithReason(
  tripId: string,
  leadId: string,
  category: string,
  note: string,
): Promise<void> {
  const { error } = await supabase
    .from("trips")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", tripId);
  if (error) throw error;

  await supabase.from("trip_cancellations").insert({
    trip_id: tripId,
    user_id: leadId,
    role: "lead",
    reason_category: category,
    reason_note: note,
    status: "pending_review",
  });
}

export async function leaveTrip(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("trip_members")
    .update({ status: "left" satisfies TripMemberStatus })
    .eq("id", memberId);
  if (error) throw error;
}

export async function leaveTripWithReason(
  memberId: string,
  userId: string,
  tripId: string,
  category: string,
  note: string,
): Promise<void> {
  const { error } = await supabase
    .from("trip_members")
    .update({ status: "left" satisfies TripMemberStatus })
    .eq("id", memberId);
  if (error) throw error;

  await supabase.from("trip_cancellations").insert({
    trip_id: tripId,
    user_id: userId,
    role: "passenger",
    reason_category: category,
    reason_note: note,
    status: "pending_review",
  });
}

export async function requestToJoin(
  tripId: string,
  userId: string,
  options: RequestToJoinOptions = {},
): Promise<void> {
  const payload: Record<string, any> = {
    trip_id: tripId,
    user_id: userId,
    pickup_point_id: options.pickupPointId ?? null,
    requested_lat: options.requestedLat ?? null,
    requested_lng: options.requestedLng ?? null,
  };
  if (options.seatsRequested) {
    payload.seats_requested = options.seatsRequested;
  }

  let { error } = await supabase.from("trip_members").insert(payload);
  if (error && error.message?.includes("seats_requested")) {
    delete payload.seats_requested;
    const retry = await supabase.from("trip_members").insert(payload);
    error = retry.error;
  }
  if (error) throw error;
}

export function subscribeToMyMemberships(userId: string, onUpdate: () => void): () => void {
  const channelName = `user-memberships-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "trip_members", filter: `user_id=eq.${userId}` },
      () => {
        onUpdate();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Phase 05: rough locations submitted by requesters, for the Lead's
// "suggest a meeting point" flow (pickup-points module). Lives here, not in
// pickup-points, because it queries trip_members — pickup-points only ever
// reaches this through trips' public index, never trip_members directly.
export async function getRequesterLocations(
  tripId: string,
): Promise<{ lat: number; lng: number }[]> {
  const { data, error } = await supabase
    .from("trip_members")
    .select("requested_lat, requested_lng")
    .eq("trip_id", tripId)
    .not("requested_lat", "is", null)
    .not("requested_lng", "is", null);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    lat: Number(row.requested_lat),
    lng: Number(row.requested_lng),
  }));
}

export async function withdrawRequest(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("trip_members")
    .update({ status: "withdrawn" satisfies TripMemberStatus })
    .eq("id", memberId);
  if (error) throw error;
}

export async function getIncomingRequests(tripId: string): Promise<TripMember[]> {
  const { data, error } = await supabase
    .from("trip_members")
    .select()
    .eq("trip_id", tripId)
    .eq("status", "requested" satisfies TripMemberStatus);
  if (error) throw error;
  return (data ?? []).map(rowToMember);
}

async function setMemberStatus(memberId: string, status: TripMemberStatus): Promise<void> {
  const { error } = await supabase.from("trip_members").update({ status }).eq("id", memberId);
  if (error) throw error;
}

export async function approveRequest(memberId: string): Promise<void> {
  return setMemberStatus(memberId, "approved");
}

export async function declineRequest(memberId: string): Promise<void> {
  return setMemberStatus(memberId, "declined");
}

export async function getMyMemberships(userId: string): Promise<TripMember[]> {
  const { data, error } = await supabase.from("trip_members").select().eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map(rowToMember);
}

// How many approved seats a trip has left — trips module's own concern, not
// something the UI should compute by re-deriving membership counts itself.
export async function getApprovedSeatCount(tripId: string): Promise<number> {
  const { count, error } = await supabase
    .from("trip_members")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .eq("status", "approved" satisfies TripMemberStatus);
  if (error) throw error;
  return count ?? 0;
}

export async function setTripGroupChatEnabled(tripId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("trips")
    .update({ group_chat_enabled: enabled })
    .eq("id", tripId);
  if (error) throw error;
}
