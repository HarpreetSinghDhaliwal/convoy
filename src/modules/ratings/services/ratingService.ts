import { supabase } from "@/lib/supabase/client";
import type { PendingRating, Rating } from "../types";

function rowToRating(row: Record<string, unknown>, isExchanged = true): Rating {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    raterId: row.rater_id as string,
    rateeId: row.ratee_id as string,
    score: row.score as number,
    review: (row.review as string) ?? null,
    createdAt: row.created_at as string,
    isExchanged,
    raterName: (row.rater_name as string) ?? undefined,
    raterPhotoUrl: (row.rater_photo_url as string) ?? undefined,
  };
}

export async function getPendingRatings(userId: string): Promise<PendingRating[]> {
  const { data, error } = await supabase.rpc("get_pending_ratings", { p_user_id: userId });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    tripId: row.trip_id as string,
    rateeId: row.ratee_id as string,
  }));
}

export async function submitRating(
  tripId: string,
  raterId: string,
  rateeId: string,
  score: number,
  review?: string,
): Promise<void> {
  const { error } = await supabase.from("ratings").insert({
    trip_id: tripId,
    rater_id: raterId,
    ratee_id: rateeId,
    score,
    review: review ?? null,
  });
  if (error) throw error;
}

/**
 * Bilateral / Exchanged Rating Enforcement:
 * Returns publicly visible reviews (only when both parties have rated each other or 14-day window passed).
 * If viewer is the rater, includes their own submitted rating marked with isExchanged=false.
 */
export async function getRatingsForUser(userId: string, viewerId?: string): Promise<Rating[]> {
  // 1. Fetch all ratings where ratee_id = userId
  const { data: allReceived, error } = await supabase
    .from("ratings")
    .select()
    .eq("ratee_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!allReceived || allReceived.length === 0) return [];

  const tripIds = Array.from(new Set(allReceived.map((r) => r.trip_id)));

  // 2. Fetch reverse ratings (where rater_id = userId on those trips) to check mutual exchange
  const { data: reverseRatings } = await supabase
    .from("ratings")
    .select("trip_id, ratee_id, rater_id")
    .eq("rater_id", userId)
    .in("trip_id", tripIds);

  const reverseSet = new Set<string>();
  (reverseRatings ?? []).forEach((rev) => {
    reverseSet.add(`${rev.trip_id}:${rev.ratee_id}`);
  });

  // 3. Fetch rater profile names
  const raterIds = Array.from(new Set(allReceived.map((r) => r.rater_id)));
  const { data: raters } = await supabase
    .from("users")
    .select("id, name, photo_url")
    .in("id", raterIds);

  const raterMap = new Map<string, { name: string; photo_url?: string }>();
  (raters ?? []).forEach((u) => {
    raterMap.set(u.id, { name: u.name, photo_url: u.photo_url });
  });

  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

  const result: Rating[] = [];

  for (const r of allReceived) {
    const isMutual = reverseSet.has(`${r.trip_id}:${r.rater_id}`);
    const isExpired = new Date(r.created_at).getTime() < fourteenDaysAgo;
    const isExchanged = isMutual || isExpired;
    const isViewerAuthor = viewerId && r.rater_id === viewerId;

    // Only show if exchanged (public) OR if the current viewer wrote it
    if (isExchanged || isViewerAuthor) {
      const raterInfo = raterMap.get(r.rater_id);
      result.push(
        rowToRating(
          {
            ...r,
            rater_name: raterInfo?.name,
            rater_photo_url: raterInfo?.photo_url,
          },
          isExchanged,
        ),
      );
    }
  }

  return result;
}

export function getAggregate(ratings: Rating[]): { average: number; count: number } {
  // Aggregate only counts exchanged ratings for fair public scoring
  const exchangedOnly = ratings.filter((r) => r.isExchanged !== false);
  if (exchangedOnly.length === 0) return { average: 0, count: 0 };
  const sum = exchangedOnly.reduce((acc, r) => acc + r.score, 0);
  return { average: sum / exchangedOnly.length, count: exchangedOnly.length };
}
