import { useActiveChats } from "./useActiveChats";

export function useUnreadCount() {
  const { totalUnread, refresh } = useActiveChats();
  return { unreadCount: totalUnread, refresh };
}
