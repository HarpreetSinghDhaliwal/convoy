import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { getKycStatus } from "../services/kycService";
import type { KycStatus } from "../types";

// The one place that answers "is this user allowed to host/join a trip yet"
// — trips module gates on isVerified from here rather than re-deriving it.
export function useKycStatus() {
  const { session } = useAuthSession();
  const [status, setStatus] = useState<KycStatus>("unverified");
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
        setStatus(await getKycStatus(userId));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, isVerified: status === "verified", refresh };
}
