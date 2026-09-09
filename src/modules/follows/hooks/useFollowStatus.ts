import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { follow, getFollowStats, unfollow } from "../services/followService";
import type { FollowStats } from "../types";

export function useFollowStatus(targetUserId: string | undefined) {
  const { session } = useAuthSession();
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getFollowStats(targetUserId, session?.user.id);
      setStats(res);
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  }, [targetUserId, session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleFollow() {
    if (!targetUserId || !session?.user.id || submitting) return;
    setSubmitting(true);
    try {
      if (stats.isFollowing) {
        await unfollow(session.user.id, targetUserId);
        setStats((prev) => ({
          ...prev,
          isFollowing: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        await follow(session.user.id, targetUserId);
        setStats((prev) => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1,
        }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return {
    stats,
    loading,
    submitting,
    toggleFollow,
    refresh,
  };
}
