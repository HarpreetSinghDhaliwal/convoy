import { supabase } from "@/lib/supabase/client";
import { looksLikeContactOrPaymentInfo } from "@/lib/contentSafety/contactInfoDetector";
import type { Message, ActiveTripChat } from "../types";

const READ_STORAGE_KEY_PREFIX = "convoy_chat_last_read_";

export function getChatLastRead(tripId: string): number {
  if (typeof window !== "undefined" && window.localStorage) {
    const val = localStorage.getItem(`${READ_STORAGE_KEY_PREFIX}${tripId}`);
    return val ? parseInt(val, 10) : 0;
  }
  return 0;
}

export function setChatLastRead(tripId: string, timestamp?: number): void {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem(
      `${READ_STORAGE_KEY_PREFIX}${tripId}`,
      (timestamp ?? Date.now()).toString(),
    );
  }
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    senderId: row.sender_id as string,
    body: row.body as string,
    flagged: row.flagged as boolean,
    sentAt: row.sent_at as string,
  };
}

export async function fetchMessages(tripId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select()
    .eq("trip_id", tripId)
    .order("sent_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMessage);
}

export async function sendMessage(tripId: string, senderId: string, body: string): Promise<void> {
  const { error } = await supabase.from("messages").insert({
    trip_id: tripId,
    sender_id: senderId,
    body,
    flagged: looksLikeContactOrPaymentInfo(body),
  });
  if (error) throw error;
}

export async function fetchUserActiveChats(userId: string): Promise<ActiveTripChat[]> {
  // 1. Get trips where user is host (lead)
  const { data: hostedTrips } = await supabase
    .from("trips")
    .select("id, destination, origin_label, depart_at, lead_id")
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
  }> = [];

  if (memberTripIds.length > 0) {
    const { data: jt } = await supabase
      .from("trips")
      .select("id, destination, origin_label, depart_at, lead_id")
      .in("id", memberTripIds)
      .is("cancelled_at", null);
    joinedTrips = jt ?? [];
  }

  // Combine and deduplicate
  const allTripsMap = new Map<
    string,
    {
      id: string;
      destination: string;
      origin_label: string;
      depart_at: string;
      lead_id: string;
      isLead: boolean;
    }
  >();

  (hostedTrips ?? []).forEach((t) => {
    allTripsMap.set(t.id, { ...t, isLead: true });
  });

  joinedTrips.forEach((t) => {
    if (!allTripsMap.has(t.id)) {
      allTripsMap.set(t.id, { ...t, isLead: false });
    }
  });

  const tripList = Array.from(allTripsMap.values());
  if (tripList.length === 0) return [];

  const tripIds = tripList.map((t) => t.id);

  // Fetch recent messages for these trips
  const { data: messagesData } = await supabase
    .from("messages")
    .select()
    .in("trip_id", tripIds)
    .order("sent_at", { ascending: false });

  const messagesByTrip = new Map<string, Message[]>();
  (messagesData ?? []).forEach((row) => {
    const msg = rowToMessage(row);
    const list = messagesByTrip.get(msg.tripId) ?? [];
    list.push(msg);
    messagesByTrip.set(msg.tripId, list);
  });

  // Fetch host user details
  const leadIds = Array.from(new Set(tripList.map((t) => t.lead_id)));
  const { data: usersData } = await supabase
    .from("users")
    .select("id, name, photo_url")
    .in("id", leadIds);

  const usersMap = new Map<string, { name: string; photo_url?: string }>();
  (usersData ?? []).forEach((u) => {
    usersMap.set(u.id, { name: u.name, photo_url: u.photo_url });
  });

  return tripList.map((t) => {
    const tripMsgs = messagesByTrip.get(t.id) ?? [];
    const lastMessage = tripMsgs[0];
    const lastRead = getChatLastRead(t.id);
    const unreadCount = tripMsgs.filter(
      (m) => m.senderId !== userId && new Date(m.sentAt).getTime() > lastRead,
    ).length;

    const leadInfo = usersMap.get(t.lead_id);

    return {
      tripId: t.id,
      destination: t.destination,
      originLabel: t.origin_label,
      departAt: t.depart_at,
      leadId: t.lead_id,
      leadName: leadInfo?.name,
      leadPhotoUrl: leadInfo?.photo_url,
      isLead: t.isLead,
      lastMessage,
      unreadCount,
    };
  });
}

export function subscribeToTripMessages(
  tripId: string,
  onMessage: (message: Message) => void,
): () => void {
  const channel = supabase
    .channel(`trip-chat-${tripId}`)
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

  const channel = supabase
    .channel("global-user-trip-chats")
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
