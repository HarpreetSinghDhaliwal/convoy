import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { follow, getFollowing, unfollow } from "../services/followService";
import type { Follow } from "../types";

export function useFollowing() {
  const { session } = useAuthSession();
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    async function load() {
      const userId = session?.user.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setFollowing(await getFollowing(userId));
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function followUser(followedId: string, viaTripId?: string) {
    if (!session?.user.id) return;
    await follow(session.user.id, followedId, viaTripId);
    refresh();
  }

  async function unfollowUser(followedId: string) {
    if (!session?.user.id) return;
    await unfollow(session.user.id, followedId);
    refresh();
  }

  return {
    following,
    loading,
    isFollowing: (userId: string) => following.some((f) => f.followedId === userId),
    followUser,
    unfollowUser,
  };
}
