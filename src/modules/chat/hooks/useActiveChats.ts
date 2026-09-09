import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import {
  fetchUserActiveChats,
  subscribeToAllUserChatMessages,
} from "../services/chatService";
import type { ActiveTripChat } from "../types";

export function useActiveChats() {
  const { session } = useAuthSession();
  const [chats, setChats] = useState<ActiveTripChat[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) {
      setChats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchUserActiveChats(userId);
      setChats(data);
    } catch {
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime updates when any message is received across user's active trip chats
  useEffect(() => {
    const tripIds = chats.map((c) => c.tripId);
    if (tripIds.length === 0) return;

    return subscribeToAllUserChatMessages(tripIds, () => {
      load();
    });
  }, [chats.map((c) => c.tripId).join(","), load]);

  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  return { chats, loading, totalUnread, refresh: load };
}
