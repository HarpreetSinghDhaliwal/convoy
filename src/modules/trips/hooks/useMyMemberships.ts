import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getMyMemberships } from "../services/tripService";
import type { TripMember } from "../types";

export function useMyMemberships() {
  const { session } = useAuthSession();
  const [memberships, setMemberships] = useState<TripMember[]>([]);
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
        setMemberships(await getMyMemberships(userId));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { memberships, loading, refresh };
}
