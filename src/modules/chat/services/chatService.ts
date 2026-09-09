import { supabase } from "@/lib/supabase/client";
import { looksLikeContactOrPaymentInfo } from "@/lib/contentSafety/contactInfoDetector";
import type { Message, ActiveTripChat } from "../types";

const READ_STORAGE_KEY_PREFIX = "convoy_chat_last_read_";

export function getChatLastRead(chatKey: string): number {
  if (typeof window !== "undefined" && window.localStorage) {
    const val = localStorage.getItem(`${READ_STORAGE_KEY_PREFIX}${chatKey}`);
    return val ? parseInt(val, 10) : 0;
  }
  return 0;
}

export function setChatLastRead(chatKey: string, timestamp?: number): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(
      `${READ_STORAGE_KEY_PREFIX}${chatKey}`,
      (timestamp ?? Date.now()).toString(),
    );
  }
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    senderId: row.sender_id as string,
    recipientId: (row.recipient_id as string) ?? null,
    body: row.body as string,
    flagged: row.flagged as boolean,
    sentAt: row.sent_at as string,
  };
}

export async function fetchMessages(
  tripId: string,
  options?: { partnerId?: string; isGroup?: boolean; currentUserId?: string },
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("trip_id", tripId)
    .order("sent_at", { ascending: true });

  if (error) throw error;
  const all = (data ?? []).map(rowToMessage);

  // If 1-on-1 direct chat
  if (options?.partnerId && options?.currentUserId && !options.isGroup) {
    const { partnerId, currentUserId } = options;
    return all.filter((m) => {
      // Explicit 1-on-1 between these two specific users only
      return (
        (m.senderId === currentUserId && m.recipientId === partnerId) ||
        (m.senderId === partnerId && m.recipientId === currentUserId)
      );
    });
  }

  // If explicit group chat
  if (options?.isGroup) {
    return all.filter((m) => !m.recipientId);
  }

  return all;
}

export async function sendMessage(
  tripId: string,
  senderId: string,
  body: string,
  recipientId?: string | null,
): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    trip_id: tripId,
    sender_id: senderId,
    recipient_id: recipientId ?? null,
    body,
    flagged: looksLikeContactOrPaymentInfo(body),
  });
  if (error) throw error;
}

export async function fetchUserActiveChats(userId: string): Promise<ActiveTripChat[]> {
  // 1. Get trips where user is host (lead)
  const { data: hostedTrips } = await supabase
    .from("trips")
    .select("id, destination, origin_label, depart_at, lead_id, group_chat_enabled")
    .eq("lead_id", userId)
    .is("cancelled_at", null);

  // 2. Get trips where user is approved member
  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", userId)
    .eq("status", "approved");

  const memberTripIds = (memberRows ?? []).map((r) => r.trip_id as string);

  let joinedTrips: Array<{
    id: string;
    destination: string;
    origin_label: string;
    depart_at: string;
    lead_id: string;
    group_chat_enabled?: boolean;
  }> = [];

  if (memberTripIds.length > 0) {
    const { data: jt } = await supabase
      .from("trips")
      .select("id, destination, origin_label, depart_at, lead_id, group_chat_enabled")
      .in("id", memberTripIds)
      .is("cancelled_at", null);
    joinedTrips = jt ?? [];
  }

  const allTripIds = Array.from(
    new Set([...(hostedTrips ?? []).map((t) => t.id), ...joinedTrips.map((t) => t.id)]),
  );

  if (allTripIds.length === 0) return [];

  // 3. Fetch all approved members for all these trips
  const { data: allApprovedMembers } = await supabase
    .from("trip_members")
    .select("trip_id, user_id")
    .in("trip_id", allTripIds)
    .eq("status", "approved");

  // 4. Fetch all messages for these trips
  const { data: messagesData } = await supabase
    .from("messages")
    .select()
    .in("trip_id", allTripIds)
    .order("sent_at", { ascending: false });

  const allMessages = (messagesData ?? []).map(rowToMessage);

  // 5. Gather all user IDs needing profile lookups (hosts + members)
  const userIdsToFetch = new Set<string>();
  (hostedTrips ?? []).forEach((t) => userIdsToFetch.add(t.lead_id));
  joinedTrips.forEach((t) => userIdsToFetch.add(t.lead_id));
  (allApprovedMembers ?? []).forEach((m) => userIdsToFetch.add(m.user_id));

  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, photo_url")
    .in("id", Array.from(userIdsToFetch));

  const usersMap = new Map<string, { name: string; photo_url?: string }>();
  (usersData ?? []).forEach((u) => {
    usersMap.set(u.id, { name: u.name, photo_url: u.photo_url });
  });

  const chats: ActiveTripChat[] = [];

  // Process Hosted Trips
  (hostedTrips ?? []).forEach((t) => {
    const groupChatEnabled = Boolean(t.group_chat_enabled);
    const membersOnThisTrip = (allApprovedMembers ?? []).filter(
      (m) => m.trip_id === t.id && m.user_id !== userId,
    );

    // 1-on-1 direct chats with each approved passenger
    membersOnThisTrip.forEach((m) => {
      const memberInfo = usersMap.get(m.user_id);
      const partnerId = m.user_id;
      const chatKey = `${t.id}_${partnerId}`;

      const pairMessages = allMessages.filter(
        (msg) =>
          msg.tripId === t.id &&
          ((msg.senderId === userId && msg.recipientId === partnerId) ||
            (msg.senderId === partnerId && msg.recipientId === userId)),
      );

      const lastMessage = pairMessages[0];
      const lastRead = getChatLastRead(chatKey);
      const unreadCount = pairMessages.filter(
        (msg) => msg.senderId !== userId && new Date(msg.sentAt).getTime() > lastRead,
      ).length;

      chats.push({
        tripId: t.id,
        chatId: chatKey,
        destination: t.destination,
        originLabel: t.origin_label,
        departAt: t.depart_at,
        leadId: t.lead_id,
        leadName: usersMap.get(t.lead_id)?.name,
        leadPhotoUrl: usersMap.get(t.lead_id)?.photo_url,
        isLead: true,
        partnerId,
        partnerName: memberInfo?.name || "Passenger",
        partnerPhotoUrl: memberInfo?.photo_url,
        isGroup: false,
        groupChatEnabled,
        lastMessage,
        unreadCount,
      });
    });

    // Trip Broadcast / Group Channel for Host
    const chatKey = `${t.id}_group`;
    const groupMessages = allMessages.filter((msg) => msg.tripId === t.id && !msg.recipientId);
    const lastMessage = groupMessages[0];
    const lastRead = getChatLastRead(chatKey);
    const unreadCount = groupMessages.filter(
      (msg) => msg.senderId !== userId && new Date(msg.sentAt).getTime() > lastRead,
    ).length;

    chats.push({
      tripId: t.id,
      chatId: chatKey,
      destination: t.destination,
      originLabel: t.origin_label,
      departAt: t.depart_at,
      leadId: t.lead_id,
      leadName: usersMap.get(t.lead_id)?.name,
      leadPhotoUrl: usersMap.get(t.lead_id)?.photo_url,
      isLead: true,
      partnerName: groupChatEnabled
        ? `Trip Group Discussion`
        : `Trip Announcements (Broadcast)`,
      isGroup: true,
      groupChatEnabled,
      lastMessage,
      unreadCount,
    });
  });

  // Process Joined Trips (Passenger)
  joinedTrips.forEach((t) => {
    const groupChatEnabled = Boolean(t.group_chat_enabled);
    const hostInfo = usersMap.get(t.lead_id);
    const partnerId = t.lead_id;
    const chatKey = `${t.id}_${partnerId}`;

    const pairMessages = allMessages.filter(
      (msg) =>
        msg.tripId === t.id &&
        ((msg.senderId === userId && msg.recipientId === partnerId) ||
          (msg.senderId === partnerId && msg.recipientId === userId)),
    );

    const lastMessage = pairMessages[0];
    const lastRead = getChatLastRead(chatKey);
    const unreadCount = pairMessages.filter(
      (msg) => msg.senderId !== userId && new Date(msg.sentAt).getTime() > lastRead,
    ).length;

    // 1-on-1 direct private chat with the Host
    chats.push({
      tripId: t.id,
      chatId: chatKey,
      destination: t.destination,
      originLabel: t.origin_label,
      departAt: t.depart_at,
      leadId: t.lead_id,
      leadName: hostInfo?.name,
      leadPhotoUrl: hostInfo?.photo_url,
      isLead: false,
      partnerId,
      partnerName: hostInfo?.name ? `Host: ${hostInfo.name}` : "Trip Host",
      partnerPhotoUrl: hostInfo?.photo_url,
      isGroup: false,
      groupChatEnabled,
      lastMessage,
      unreadCount,
    });

    // Trip Broadcast / Group Channel for Passenger
    const groupChatKey = `${t.id}_group`;
    const groupMessages = allMessages.filter((msg) => msg.tripId === t.id && !msg.recipientId);
    const gLastMessage = groupMessages[0];
    const gLastRead = getChatLastRead(groupChatKey);
    const gUnreadCount = groupMessages.filter(
      (msg) => msg.senderId !== userId && new Date(msg.sentAt).getTime() > gLastRead,
    ).length;

    chats.push({
      tripId: t.id,
      chatId: groupChatKey,
      destination: t.destination,
      originLabel: t.origin_label,
      departAt: t.depart_at,
      leadId: t.lead_id,
      leadName: hostInfo?.name,
      leadPhotoUrl: hostInfo?.photo_url,
      isLead: false,
      partnerName: groupChatEnabled
        ? `Trip Group Discussion`
        : `Trip Announcements (Broadcast)`,
      isGroup: true,
      groupChatEnabled,
      lastMessage: gLastMessage,
      unreadCount: gUnreadCount,
    });
  });

  return chats;
}

export function subscribeToTripMessages(
  tripId: string,
  onMessage: (message: Message) => void,
): () => void {
  const channelName = `trip-chat-${tripId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `trip_id=eq.${tripId}` },
      (payload) => onMessage(rowToMessage(payload.new as Record<string, unknown>)),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToAllUserChatMessages(
  tripIds: string[],
  onNewMessage: (msg: Message) => void,
): () => void {
  if (tripIds.length === 0) return () => {};

  const channelName = `global-user-trip-chats-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      (payload) => {
        const msg = rowToMessage(payload.new as Record<string, unknown>);
        if (tripIds.includes(msg.tripId)) {
          onNewMessage(msg);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
