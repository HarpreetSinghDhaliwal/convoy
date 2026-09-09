import { useCallback, useEffect, useState } from "react";
import { listTrips } from "../services/tripService";
import type { Trip, TripFilters } from "../types";

export function useTrips(filters: TripFilters = {}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Stringified so the effect below only re-runs when a filter value
  // actually changes, not on every render (a fresh object literal from the
  // caller would otherwise retrigger this every time).
  const filtersKey = JSON.stringify(filters);

  const refresh = useCallback(() => {
    async function load() {
      setLoading(true);
      setError(undefined);
      try {
        setTrips(await listTrips(JSON.parse(filtersKey)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load trips");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filtersKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trips, loading, error, refresh };
}
