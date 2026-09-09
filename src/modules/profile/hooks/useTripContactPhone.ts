import { useEffect, useState } from "react";
import { getTripContactPhone } from "../services/profileService";

// Returns null both while loading and when access is denied — the RPC
// itself (migration 0014) is what actually enforces the visibility rules;
// this hook just surfaces whatever it decides, never overrides it.
export function useTripContactPhone(tripId: string, targetUserId: string) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setPhone(await getTripContactPhone(tripId, targetUserId));
      } catch {
        setPhone(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId, targetUserId]);

  return { phone, loading };
}
