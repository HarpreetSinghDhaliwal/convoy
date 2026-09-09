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
 * If viewer is the ratee (profile owner) or rater, includes the rating marked with appropriate exchange status.
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
  const isOwner = Boolean(viewerId && viewerId === userId);

  for (const r of allReceived) {
    const isMutual = reverseSet.has(`${r.trip_id}:${r.rater_id}`);
    const isExpired = new Date(r.created_at).getTime() < fourteenDaysAgo;
    const isExchanged = isMutual || isExpired;
    const isViewerAuthor = Boolean(viewerId && r.rater_id === viewerId);

    // Show if exchanged (public) OR if viewer is author OR if viewer is the profile owner
    if (isExchanged || isViewerAuthor || isOwner) {
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

export async function getRatingsGivenByUser(userId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select()
    .eq("rater_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const rateeIds = Array.from(new Set(data.map((r) => r.ratee_id)));
  const { data: ratees } = await supabase
    .from("users")
    .select("id, name, photo_url")
    .in("id", rateeIds);

  const rateeMap = new Map<string, { name: string; photo_url?: string }>();
  (ratees ?? []).forEach((u) => {
    rateeMap.set(u.id, { name: u.name, photo_url: u.photo_url });
  });

  return data.map((r) => {
    const rateeInfo = rateeMap.get(r.ratee_id);
    return rowToRating(
      {
        ...r,
        rater_name: rateeInfo?.name,
        rater_photo_url: rateeInfo?.photo_url,
      },
      true,
    );
  });
}

export function getAggregate(ratings: Rating[]): { average: number; count: number; totalCount: number } {
  const exchangedOnly = ratings.filter((r) => r.isExchanged !== false);
  const totalCount = ratings.length;
  if (ratings.length === 0) return { average: 0, count: 0, totalCount: 0 };

  const target = exchangedOnly.length > 0 ? exchangedOnly : ratings;
  const sum = target.reduce((acc, r) => acc + r.score, 0);
  return {
    average: sum / target.length,
    count: exchangedOnly.length,
    totalCount,
  };
}
