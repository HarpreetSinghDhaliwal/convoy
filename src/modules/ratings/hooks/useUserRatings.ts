import { useCallback, useEffect, useState } from "react";
import { getAggregate, getRatingsForUser } from "../services/ratingService";
import type { Rating } from "../types";

export function useUserRatings(userId: string | undefined, viewerId?: string) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRatings(await getRatingsForUser(userId, viewerId));
    } catch {
      setRatings([]);
    } finally {
      setLoading(false);
    }
  }, [userId, viewerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ratings, loading, aggregate: getAggregate(ratings), refresh: load };
}
