import { supabase } from "@/lib/supabase/client";
import { looksLikeContactOrPaymentInfo } from "@/lib/contentSafety/contactInfoDetector";
import type { Message } from "../types";

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
    // Client-side flagging is a screening net, not the enforcement boundary
    // — a determined bad actor can phrase around a regex. Human moderation
    // review (blueprint §03) is what actually catches what this misses.
    flagged: looksLikeContactOrPaymentInfo(body),
  });
  if (error) throw error;
}

// Realtime subscription — the actual "chat" part of trip-scoped chat.
// Returns an unsubscribe function; callers own the channel's lifecycle.
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
