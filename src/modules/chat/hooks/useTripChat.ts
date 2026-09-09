import { useCallback, useEffect, useState } from "react";
import { useAuthSession } from "@/modules/auth";
import { fetchMessages, sendMessage, subscribeToTripMessages } from "../services/chatService";
import { looksLikeContactOrPaymentInfo } from "@/lib/contentSafety/contactInfoDetector";
import type { Message } from "../types";

export function useTripChat(tripId: string) {
  const { session } = useAuthSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    async function run() {
      setLoading(true);
      try {
        setMessages(await fetchMessages(tripId));
      } finally {
        setLoading(false);
      }
    }
    return run();
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return subscribeToTripMessages(tripId, (message) => {
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });
  }, [tripId]);

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
      await sendMessage(tripId, session.user.id, trimmed);
      // No optimistic append here — the realtime subscription above will
      // deliver this sender's own message back too, and appending twice
      // (once optimistically, once from realtime) is worse than a beat of
      // latency on your own messages.
      return { blocked: false };
    } finally {
      setSending(false);
    }
  }

  return { messages, loading, sending, send, looksLikeContactOrPaymentInfo };
}
