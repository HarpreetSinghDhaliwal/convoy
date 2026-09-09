import { useCallback, useEffect, useState } from "react";
import { listCheckpoints } from "../services/tripService";
import type { TripCheckpoint } from "../types";

// Read-only — checkpoints are set once at trip creation (CreateTripScreen)
// and just displayed here (TripDetailScreen), unlike pickup points which
// the Lead can add/remove after publishing.
export function useCheckpoints(tripId: string | undefined) {
  const [checkpoints, setCheckpoints] = useState<TripCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    async function load() {
      if (!tripId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setCheckpoints(await listCheckpoints(tripId));
      } catch (err) {
        console.error("useCheckpoints: failed to load checkpoints", err);
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { checkpoints, loading };
}
