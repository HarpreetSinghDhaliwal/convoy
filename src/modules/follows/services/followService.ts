import { supabase } from "@/lib/supabase/client";
import type { Follow, FollowStats } from "../types";

function rowToFollow(row: Record<string, unknown>): Follow {
  return {
    id: row.id as string,
    followerId: row.follower_id as string,
    followedId: row.followed_id as string,
    viaTripId: (row.via_trip_id as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function follow(
  followerId: string,
  followedId: string,
  viaTripId?: string,
): Promise<void> {
  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    followed_id: followedId,
    via_trip_id: viaTripId ?? null,
  });
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

export async function getFollowStats(targetUserId: string, currentUserId?: string): Promise<FollowStats> {
  // Count followers
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followed_id", targetUserId);

  // Count following
  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", targetUserId);

  let isFollowing = false;
  if (currentUserId && currentUserId !== targetUserId) {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("followed_id", targetUserId)
      .maybeSingle();
    isFollowing = !!data;
  }

  return {
    followersCount: followersCount ?? 0,
    followingCount: followingCount ?? 0,
    isFollowing,
  };
}

export async function getFollowing(followerId: string): Promise<Follow[]> {
  const { data, error } = await supabase
    .from("follows")
    .select()
    .eq("follower_id", followerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const follows = (data ?? []).map(rowToFollow);
  if (follows.length === 0) return [];

  const followedIds = follows.map((f) => f.followedId);
  const { data: users } = await supabase
    .from("users")
    .select("id, name, photo_url, bio")
    .in("id", followedIds);

  const userMap = new Map<string, { id: string; name: string; photo_url?: string; bio?: string }>();
  (users ?? []).forEach((u) => {
    userMap.set(u.id, u);
  });

  return follows.map((f) => ({
    ...f,
    followedUser: userMap.get(f.followedId)
      ? {
          id: userMap.get(f.followedId)!.id,
          name: userMap.get(f.followedId)!.name,
          photoUrl: userMap.get(f.followedId)!.photo_url,
          bio: userMap.get(f.followedId)!.bio,
        }
      : undefined,
  }));
}
