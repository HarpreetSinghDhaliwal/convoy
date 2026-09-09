import { useEffect, useState } from "react";
import { findOverlappingTrips, type OverlappingTrip } from "../services/tripRouteService";

export function useOverlappingTrips(tripId: string | undefined) {
  const [trips, setTrips] = useState<OverlappingTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tripId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setTrips(await findOverlappingTrips(tripId));
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId]);

  return { trips, loading };
}
