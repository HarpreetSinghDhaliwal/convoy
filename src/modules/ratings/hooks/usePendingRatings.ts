import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getPendingRatings, submitRating } from "../services/ratingService";
import type { PendingRating } from "../types";

// trips/ratings/follows are wired to consult this — a trip create/join
// action can check `pending.length > 0` and block, matching the checklist's
// "gate: block new trip creation/join until pending ratings are submitted."
export function usePendingRatings() {
  const { session } = useAuthSession();
  const [pending, setPending] = useState<PendingRating[]>([]);
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
        setPending(await getPendingRatings(userId));
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function rate(tripId: string, rateeId: string, score: number, review?: string) {
    if (!session?.user.id) return;
    await submitRating(tripId, session.user.id, rateeId, score, review);
    refresh();
  }

  return { pending, loading, hasPending: pending.length > 0, rate, refresh };
}
