import { supabase } from "@/lib/supabase/client";
import type { PendingRating, Rating } from "../types";

function rowToRating(row: Record<string, unknown>): Rating {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    raterId: row.rater_id as string,
    rateeId: row.ratee_id as string,
    score: row.score as number,
    review: (row.review as string) ?? null,
    createdAt: row.created_at as string,
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

export async function getRatingsForUser(userId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from("ratings")
    .select()
    .eq("ratee_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToRating);
}

export function getAggregate(ratings: Rating[]): { average: number; count: number } {
  if (ratings.length === 0) return { average: 0, count: 0 };
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return { average: sum / ratings.length, count: ratings.length };
}
