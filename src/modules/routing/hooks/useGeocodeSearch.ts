import { useCallback, useRef, useState } from "react";
import { searchPlace } from "../services/geocodeService";
import type { GeocodeResult } from "../types";

const DEBOUNCE_MS = 400;

export function useGeocodeSearch() {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlace(query));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  return { results, searching, search };
}
