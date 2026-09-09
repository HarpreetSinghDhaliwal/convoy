import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getConsentStatus } from "../services/legalService";
import type { ConsentStatus } from "../types";

const EMPTY: ConsentStatus = { kyc: false, location: false, chat: false, complete: false };

// The root layout reads `complete` from here to decide whether a logged-in
// user lands on the consent screen or the main app — same pattern as
// useKycStatus gating trip creation.
export function useConsentStatus() {
  const { session } = useAuthSession();
  const [status, setStatus] = useState<ConsentStatus>(EMPTY);
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
        setStatus(await getConsentStatus(userId));
      } catch (err) {
        // Was an unhandled rejection before — invisible to the user, only
        // visible in devtools. Logged here so it isn't silent even when the
        // caller (ConsentScreen) doesn't have its own error UI for this path.
        console.error("useConsentStatus: failed to load consent status", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
