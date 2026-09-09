import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
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
    if (!targetUserId || submitting) return;

    if (!session?.user.id) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to your Convoy account to follow fellow roadtrippers.",
        [
          { text: "Sign In", onPress: () => router.push("/account") },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }

    if (session.user.id === targetUserId) {
      Alert.alert("Notice", "You cannot follow your own profile.");
      return;
    }

    const wasFollowing = stats.isFollowing;
    const prevFollowersCount = stats.followersCount;

    // Optimistic UI update
    setStats((prev) => ({
      ...prev,
      isFollowing: !wasFollowing,
      followersCount: wasFollowing
        ? Math.max(0, prevFollowersCount - 1)
        : prevFollowersCount + 1,
    }));

    setSubmitting(true);
    try {
      if (wasFollowing) {
        await unfollow(session.user.id, targetUserId);
      } else {
        await follow(session.user.id, targetUserId);
      }
    } catch (err: any) {
      console.error("Error toggling follow:", err);
      // Revert optimistic update
      setStats((prev) => ({
        ...prev,
        isFollowing: wasFollowing,
        followersCount: prevFollowersCount,
      }));
      Alert.alert(
        "Follow Action",
        err?.message || "Could not update follow status. Please check your connection or database permissions.",
      );
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
