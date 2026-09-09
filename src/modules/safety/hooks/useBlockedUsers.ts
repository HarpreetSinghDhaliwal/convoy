import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { blockUser, getBlockedUserIds, unblockUser } from "../services/safetyService";

// Every module that renders a list of other users (trips, chat, follows)
// should filter through this rather than re-querying blocks itself — one
// source of truth for "should this person's content be hidden from me."
export function useBlockedUsers() {
  const { session } = useAuthSession();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
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
        setBlockedIds(await getBlockedUserIds(userId));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function block(userId: string) {
    if (!session?.user.id) return;
    await blockUser(session.user.id, userId);
    refresh();
  }

  async function unblock(userId: string) {
    if (!session?.user.id) return;
    await unblockUser(session.user.id, userId);
    refresh();
  }

  return { blockedIds, loading, isBlocked: (id: string) => blockedIds.includes(id), block, unblock };
}
