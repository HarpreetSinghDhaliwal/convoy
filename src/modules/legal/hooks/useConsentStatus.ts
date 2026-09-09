import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getConsentStatus, subscribeConsentStatus } from "../services/legalService";
import type { ConsentStatus } from "../types";

const EMPTY: ConsentStatus = { kyc: false, location: false, chat: false, complete: false };

// The root layout reads `complete` from here to decide whether a logged-in
// user lands on the consent screen or the main app.
export function useConsentStatus() {
  const { session } = useAuthSession();
  const [status, setStatus] = useState<ConsentStatus>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    async function load() {
      const userId = session?.user.id;
      if (!userId) {
        setStatus(EMPTY);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const nextStatus = await getConsentStatus(userId);
        setStatus(nextStatus);
      } catch (err) {
        console.error("useConsentStatus: failed to load consent status", err);
      } finally {
        setLoading(false);
      }
    }
    return load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to any consent updates across the app
  useEffect(() => {
    const unsubscribe = subscribeConsentStatus(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  return { status, loading, refresh };
}
