import { useCallback, useEffect, useState } from "react";
import { getApprovedSeatCount, getTrip } from "../services/tripService";
import type { Trip } from "../types";

export function useTripDetail(tripId: string | undefined) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [approvedSeats, setApprovedSeats] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(() => {
    async function load() {
      if (!tripId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(undefined);
      try {
        const [tripResult, seatCount] = await Promise.all([
          getTrip(tripId),
          getApprovedSeatCount(tripId),
        ]);
        setTrip(tripResult);
        setApprovedSeats(seatCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load this trip");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const seatsLeft = trip ? trip.seatsTotal - approvedSeats : 0;

  return { trip, approvedSeats, seatsLeft, loading, error, refresh };
}
