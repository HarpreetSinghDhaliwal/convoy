import { useEffect, useState } from "react";
import { getAggregate, getRatingsForUser } from "../services/ratingService";
import type { Rating } from "../types";

export function useUserRatings(userId: string | undefined) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setRatings(await getRatingsForUser(userId));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  return { ratings, loading, aggregate: getAggregate(ratings) };
}
