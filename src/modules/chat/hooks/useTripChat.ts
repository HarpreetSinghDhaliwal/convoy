import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { fetchMessages, sendMessage, subscribeToTripMessages } from "../services/chatService";
import { looksLikeContactOrPaymentInfo } from "@/lib/contentSafety/contactInfoDetector";
import type { Message } from "../types";

export function useTripChat(
  tripId: string,
  options?: { partnerId?: string; isGroup?: boolean },
) {
  const { session } = useAuthSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const partnerId = options?.partnerId;
  const isGroup = options?.isGroup;
  const currentUserId = session?.user.id;

  const load = useCallback(() => {
    async function run() {
      setLoading(true);
      try {
        setMessages(
          await fetchMessages(tripId, {
            partnerId,
            isGroup,
            currentUserId,
          }),
        );
      } finally {
        setLoading(false);
      }
    }
    return run();
  }, [tripId, partnerId, isGroup, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeToTripMessages(tripId, (message) => {
      // Filter incoming realtime message based on 1-on-1 vs group
      if (isGroup && message.recipientId) return;
      if (!isGroup) {
        if (!message.recipientId) return; // Ignore group broadcasts in 1-on-1 chat
        if (partnerId && currentUserId) {
          const isPair =
            (message.senderId === currentUserId && message.recipientId === partnerId) ||
            (message.senderId === partnerId && message.recipientId === currentUserId);
          if (!isPair) return;
        }
      }

      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
  }, [tripId, partnerId, isGroup, currentUserId]);

  // Blocked outright, not just flagged-and-sent — "only chat on our
  // platform," not chat as a channel for handing out a number to move the
  // conversation elsewhere. The server-side flagged column (chatService)
  // stays as a second layer in case a client ever bypasses this one.
  async function send(body: string): Promise<{ blocked: boolean }> {
    const trimmed = body.trim();
    if (!trimmed || !session?.user.id) return { blocked: false };
    if (looksLikeContactOrPaymentInfo(trimmed)) {
      return { blocked: true };
    }

    setSending(true);
    try {
      const recipientId = isGroup ? null : (partnerId ?? null);
      await sendMessage(tripId, session.user.id, trimmed, recipientId);
      return { blocked: false };
    } finally {
      setSending(false);
    }
  }

  return { messages, loading, sending, send, looksLikeContactOrPaymentInfo };
}
