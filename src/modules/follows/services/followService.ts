import { supabase } from "@/lib/supabase/client";
import type { Follow } from "../types";

function rowToFollow(row: Record<string, unknown>): Follow {
  return {
    id: row.id as string,
    followerId: row.follower_id as string,
    followedId: row.followed_id as string,
    viaTripId: row.via_trip_id as string,
    createdAt: row.created_at as string,
  };
}

// The DB's can_follow() check (migration 0008) is the real enforcement —
// this will reject with a policy violation if there's no shared completed
// trip, regardless of what the client sends.
export async function follow(followerId: string, followedId: string, viaTripId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, followed_id: followedId, via_trip_id: viaTripId });
  if (error) throw error;
}

export async function unfollow(followerId: string, followedId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followed_id", followedId);
  if (error) throw error;
}

export async function getFollowing(followerId: string): Promise<Follow[]> {
  const { data, error } = await supabase.from("follows").select().eq("follower_id", followerId);
  if (error) throw error;
  return (data ?? []).map(rowToFollow);
}
