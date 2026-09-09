import { useEffect, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Screen, EmptyState, Avatar, Badge, Card } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { SosButton } from "@/modules/safety";
import { useTripDetail } from "@/modules/trips/hooks/useTripDetail";
import { supabase } from "@/lib/supabase/client";
import { useTripChat } from "../hooks/useTripChat";
import { setChatLastRead } from "../services/chatService";
import type { Message } from "../types";

const QUICK_CHIPS = [
  "📍 Sharing my pickup landmark",
  "⏰ What time should we meet?",
  "🎒 What is the boot space available?",
  "🎵 Who is playing the music aux?",
  "🥪 Planning breakfast dhaba stop?",
];

export function ChatScreen() {
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthSession();
  const { trip } = useTripDetail(tripId);
  const { messages, loading, sending, send, looksLikeContactOrPaymentInfo } = useTripChat(tripId);
  const [draft, setDraft] = useState("");
  const [blockedNotice, setBlockedNotice] = useState(false);
  const [memberMap, setMemberMap] = useState<Map<string, { name: string; photoUrl?: string }>>(
    new Map(),
  );

  // Mark chat as read
  useEffect(() => {
    if (tripId) {
      setChatLastRead(tripId, Date.now());
    }
  }, [tripId, messages.length]);

  // Load profiles for trip participants
  useEffect(() => {
    async function loadParticipantProfiles() {
      if (!tripId) return;
      const senderIds = Array.from(new Set(messages.map((m) => m.senderId)));
      if (trip?.leadId) senderIds.push(trip.leadId);
      if (senderIds.length === 0) return;

      const { data } = await supabase
        .from("users")
        .select("id, name, photo_url")
        .in("id", senderIds);

      if (data) {
        const m = new Map<string, { name: string; photoUrl?: string }>();
        data.forEach((u: any) => {
          m.set(u.id, { name: u.name, photoUrl: u.photo_url });
        });
        setMemberMap(m);
      }
    }
    loadParticipantProfiles();
  }, [tripId, trip?.leadId, messages.length]);

  const draftLooksFlagged = draft.length > 0 && looksLikeContactOrPaymentInfo(draft);

  async function handleSend(customText?: string) {
    const text = (customText || draft).trim();
    if (!text) return;
    setBlockedNotice(false);
    const result = await send(text);
    if (result.blocked) {
      setBlockedNotice(true);
      return;
    }
    if (!customText) setDraft("");
  }

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderId === session?.user.id;
    const isHost = trip && item.senderId === trip.leadId;
    const sender = memberMap.get(item.senderId);
    const timeString = new Date(item.sentAt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        {!isMine && (
          <Pressable
            onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.senderId } })}
            style={styles.avatarWrap}
          >
            <Avatar name={sender?.name || "Traveler"} uri={sender?.photoUrl} size="sm" />
          </Pressable>
        )}

        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && (
            <Pressable
              onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.senderId } })}
              style={styles.senderHeader}
            >
              <Text style={styles.senderName}>{sender?.name || "Co-Traveler"}</Text>
              {isHost && <Text style={styles.hostBadgeTag}>👑 Host</Text>}
            </Pressable>
          )}

          <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextOther}>{item.body}</Text>

          <View style={styles.bubbleMeta}>
            <Text style={isMine ? styles.timeTextMine : styles.timeTextOther}>{timeString}</Text>
            {isMine && <Text style={styles.checkmarks}>✓✓</Text>}
          </View>

          {item.flagged && (
            <View style={styles.flaggedContainer}>
              <Text style={isMine ? styles.flaggedNoteMine : styles.flaggedNoteOther}>
                ⚠️ Flagged for review — contains contact/payment patterns
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <Screen
      showBack
      title="Roadtrip Group Chat"
      rightAction={<SosButton tripId={tripId} />}
    >
      {/* Group Header Card */}
      {trip && (
        <View style={styles.groupHeaderCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupDestTitle} numberOfLines={1}>
              🚗 {trip.destination}
            </Text>
            <Text style={styles.groupSub}>
              📍 {trip.originLabel} • 📅{" "}
              {new Date(trip.departAt).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })}
            style={styles.tripDetailsPill}
          >
            <Text style={styles.tripDetailsPillText}>Trip Details ›</Text>
          </Pressable>
        </View>
      )}

      {/* Chat Messages List */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        refreshing={loading}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="💬"
              title="Welcome to the group chat!"
              description="Say hi to your co-travelers and coordinate your departure point and roadtrip vibes."
            />
          ) : null
        }
      />

      {/* Safety Notice Warning */}
      {(draftLooksFlagged || blockedNotice) && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>🛡️</Text>
          <Text style={styles.warningText}>
            For community safety against fraud, sharing direct phone numbers or off-platform payment links is restricted. Use Convoy's verified in-app features.
          </Text>
        </View>
      )}

      {/* Quick Coordination Chips */}
      <View style={styles.quickChipsBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={QUICK_CHIPS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.quickChipsContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
              onPress={() => handleSend(item)}
            >
              <Text style={styles.quickChipText}>{item}</Text>
            </Pressable>
          )}
        />
      </View>

      {/* Message Composer Dock */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message to roadtrip group..."
            placeholderTextColor={colors.inkSubtle}
            value={draft}
            onChangeText={setDraft}
            multiline
            numberOfLines={2}
          />
          <Button
            label="Send"
            onPress={() => handleSend()}
            loading={sending}
            disabled={!draft.trim() || draftLooksFlagged}
            variant="primary"
            size="md"
            style={styles.sendBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xs,
  },
  groupDestTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 14,
  },
  groupSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  tripDetailsPill: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tripDetailsPillText: {
    ...typography.captionBold,
    color: colors.accent,
    fontSize: 11,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  messageRow: {
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  avatarWrap: {
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.sm,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderBottomLeftRadius: 4,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  senderName: {
    ...typography.captionBold,
    color: colors.accent,
    fontSize: 12,
  },
  hostBadgeTag: {
    fontSize: 10,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
    color: colors.inkMuted,
  },
  bubbleTextMine: {
    ...typography.body,
    color: colors.inkLight,
    lineHeight: 20,
    fontSize: 14,
  },
  bubbleTextOther: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
    fontSize: 14,
  },
  bubbleMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  timeTextMine: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.75)",
  },
  timeTextOther: {
    fontSize: 10,
    color: colors.inkSubtle,
  },
  checkmarks: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.85)",
  },
  flaggedContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  flaggedNoteOther: {
    ...typography.caption,
    color: colors.statusFlagged,
    fontSize: 11,
  },
  flaggedNoteMine: {
    ...typography.caption,
    color: colors.inkLight,
    opacity: 0.9,
    fontStyle: "italic",
    fontSize: 11,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: colors.statusPendingLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.2)",
    marginBottom: spacing.xs,
    alignItems: "center",
    gap: spacing.xs,
  },
  warningIcon: {
    fontSize: 16,
  },
  warningText: {
    ...typography.caption,
    color: colors.statusPending,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  quickChipsBar: {
    paddingVertical: 4,
  },
  quickChipsContent: {
    gap: spacing.xs,
    paddingHorizontal: 2,
  },
  quickChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickChipPressed: {
    backgroundColor: colors.paperRaised,
  },
  quickChipText: {
    ...typography.caption,
    color: colors.inkMuted,
    fontSize: 11.5,
  },
  inputContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.xs,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    fontSize: 13.5,
    color: colors.ink,
    maxHeight: 80,
  },
  sendBtn: {
    minWidth: 70,
  },
});
