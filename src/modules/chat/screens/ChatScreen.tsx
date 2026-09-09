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
import { useTripDetail, setTripGroupChatEnabled } from "@/modules/trips";
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
  const {
    id: tripId,
    partnerId: initialPartnerId,
    isGroup: initialIsGroup,
  } = useLocalSearchParams<{ id: string; partnerId?: string; isGroup?: string }>();

  const { session } = useAuthSession();
  const { trip, refresh: refreshTrip } = useTripDetail(tripId);

  const isHost = trip && session?.user.id === trip.leadId;
  const groupChatEnabled = Boolean(trip?.groupChatEnabled);

  // Active target state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>(
    initialPartnerId || (!isHost ? trip?.leadId : undefined),
  );
  const [isGroupMode, setIsGroupMode] = useState<boolean>(
    initialIsGroup === "true" && groupChatEnabled,
  );
  const [togglingGroup, setTogglingGroup] = useState(false);

  // Approved members list for host selection
  const [approvedMembers, setApprovedMembers] = useState<
    Array<{ id: string; name: string; photoUrl?: string }>
  >([]);

  // Participants map for avatar/name resolution
  const [memberMap, setMemberMap] = useState<Map<string, { name: string; photoUrl?: string }>>(
    new Map(),
  );

  // Effective partner ID (for 1-on-1)
  const activePartnerId = isGroupMode
    ? undefined
    : selectedPartnerId || (!isHost ? trip?.leadId : approvedMembers[0]?.id);

  const { messages, loading, sending, send, looksLikeContactOrPaymentInfo } = useTripChat(
    tripId,
    {
      partnerId: activePartnerId,
      isGroup: isGroupMode,
    },
  );

  const [draft, setDraft] = useState("");
  const [blockedNotice, setBlockedNotice] = useState(false);

  // Mark active chat as read
  useEffect(() => {
    if (tripId) {
      const chatKey = isGroupMode ? `${tripId}_group` : `${tripId}_${activePartnerId || ""}`;
      setChatLastRead(chatKey, Date.now());
    }
  }, [tripId, isGroupMode, activePartnerId, messages.length]);

  // Load approved members & host profile
  useEffect(() => {
    async function loadMembers() {
      if (!tripId) return;

      const { data: memberRows } = await supabase
        .from("trip_members")
        .select("user_id")
        .eq("trip_id", tripId)
        .eq("status", "approved");

      const memberIds = (memberRows ?? []).map((m) => m.user_id as string);
      const allIds = new Set(memberIds);
      if (trip?.leadId) allIds.add(trip.leadId);

      if (allIds.size > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("id, name, photo_url")
          .in("id", Array.from(allIds));

        if (users) {
          const map = new Map<string, { name: string; photoUrl?: string }>();
          const approvedList: Array<{ id: string; name: string; photoUrl?: string }> = [];

          users.forEach((u: any) => {
            const item = { id: u.id, name: u.name, photoUrl: u.photo_url };
            map.set(u.id, item);
            if (u.id !== trip?.leadId) {
              approvedList.push(item);
            }
          });

          setMemberMap(map);
          setApprovedMembers(approvedList);

          // If host and no partner selected, default to first passenger
          if (isHost && !selectedPartnerId && approvedList.length > 0 && !isGroupMode) {
            setSelectedPartnerId(approvedList[0].id);
          }
        }
      }
    }
    loadMembers();
  }, [tripId, trip?.leadId, isHost, selectedPartnerId, isGroupMode]);

  async function handleToggleGroupChat() {
    if (!tripId || !isHost) return;
    setTogglingGroup(true);
    try {
      await setTripGroupChatEnabled(tripId, !groupChatEnabled);
      await refreshTrip();
      if (!groupChatEnabled) {
        setIsGroupMode(true);
      } else {
        setIsGroupMode(false);
      }
    } finally {
      setTogglingGroup(false);
    }
  }

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

  const partnerInfo = activePartnerId ? memberMap.get(activePartnerId) : undefined;
  const hostInfo = trip?.leadId ? memberMap.get(trip.leadId) : undefined;

  const chatTitle = isGroupMode
    ? `👥 Group Chat: ${trip?.destination || "Trip"}`
    : isHost
    ? `💬 Chat with ${partnerInfo?.name || "Passenger"}`
    : `💬 Chat with Host: ${hostInfo?.name || "Host"}`;

  function renderMessage({ item }: { item: Message }) {
    const isMine = item.senderId === session?.user.id;
    const isItemHost = trip && item.senderId === trip.leadId;
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
              {isItemHost && <Text style={styles.hostBadgeTag}>👑 Host</Text>}
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
      title={chatTitle}
      rightAction={<SosButton tripId={tripId} />}
    >
      {/* Trip Info Header Card */}
      {trip && (
        <View style={styles.tripHeaderCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tripDestTitle} numberOfLines={1}>
              🚗 {trip.destination}
            </Text>
            <Text style={styles.tripRouteSub}>
              📍 {trip.originLabel} • 📅{" "}
              {new Date(trip.departAt).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>

          {/* Host Group Toggle Button */}
          {isHost ? (
            <Pressable
              onPress={handleToggleGroupChat}
              style={[styles.hostToggleBtn, groupChatEnabled && styles.hostToggleBtnActive]}
            >
              <Text style={[styles.hostToggleText, groupChatEnabled && styles.hostToggleTextActive]}>
                {groupChatEnabled ? "👥 Group: ON" : "🔒 1-on-1 Mode"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })}
              style={styles.tripDetailsPill}
            >
              <Text style={styles.tripDetailsPillText}>Trip Details ›</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Host / Participant Channel Switcher */}
      {isHost && (approvedMembers.length > 1 || groupChatEnabled) && (
        <View style={styles.channelSwitcherBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={approvedMembers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.channelSwitcherContent}
            renderItem={({ item }) => {
              const active = !isGroupMode && activePartnerId === item.id;
              return (
                <Pressable
                  style={[styles.channelChip, active && styles.channelChipActive]}
                  onPress={() => {
                    setIsGroupMode(false);
                    setSelectedPartnerId(item.id);
                  }}
                >
                  <Text style={[styles.channelChipText, active && styles.channelChipTextActive]}>
                    💬 {item.name || "Passenger"}
                  </Text>
                </Pressable>
              );
            }}
            ListFooterComponent={
              groupChatEnabled ? (
                <Pressable
                  style={[styles.channelChip, isGroupMode && styles.channelChipActive]}
                  onPress={() => setIsGroupMode(true)}
                >
                  <Text style={[styles.channelChipText, isGroupMode && styles.channelChipTextActive]}>
                    👥 Group Chat
                  </Text>
                </Pressable>
              ) : null
            }
          />
        </View>
      )}

      {/* Passenger Group Switcher (only if Host enabled group chat) */}
      {!isHost && groupChatEnabled && (
        <View style={styles.channelSwitcherBar}>
          <Pressable
            style={[styles.channelChip, !isGroupMode && styles.channelChipActive]}
            onPress={() => setIsGroupMode(false)}
          >
            <Text style={[styles.channelChipText, !isGroupMode && styles.channelChipTextActive]}>
              💬 1-on-1 with Host
            </Text>
          </Pressable>
          <Pressable
            style={[styles.channelChip, isGroupMode && styles.channelChipActive]}
            onPress={() => setIsGroupMode(true)}
          >
            <Text style={[styles.channelChipText, isGroupMode && styles.channelChipTextActive]}>
              👥 Trip Group Chat
            </Text>
          </Pressable>
        </View>
      )}

      {/* Privacy Mode Notice Bar */}
      <View style={styles.privacyModeNotice}>
        <Text style={styles.privacyModeIcon}>{isGroupMode ? "👥" : "🔒"}</Text>
        <Text style={styles.privacyModeText}>
          {isGroupMode
            ? "Group Chat: Visible to all approved co-travelers (enabled by Trip Host)."
            : isHost
            ? `Private 1-on-1 chat with ${partnerInfo?.name || "this traveler"}. Co-travelers cannot see this.`
            : `Private 1-on-1 chat with Host (${hostInfo?.name || "Host"}). No other passengers can see this.`}
        </Text>
      </View>

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
              icon={isGroupMode ? "👥" : "💬"}
              title={isGroupMode ? "Welcome to the group chat!" : `Start 1-on-1 Chat with ${partnerInfo?.name || (!isHost ? "Host" : "Passenger")}`}
              description={
                isGroupMode
                  ? "Coordinate departure times and music vibes with the entire roadtrip group."
                  : "Private coordination between you and the host/traveler. Avoid sharing off-platform contact info."
              }
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
            placeholder={
              isGroupMode
                ? "Type a message to group..."
                : `Message ${partnerInfo?.name || (isHost ? "passenger" : "host")} directly...`
            }
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
  tripHeaderCard: {
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
  tripDestTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 14,
  },
  tripRouteSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  hostToggleBtn: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  hostToggleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  hostToggleText: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 11,
  },
  hostToggleTextActive: {
    color: colors.paper,
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
  channelSwitcherBar: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: 4,
    marginBottom: 4,
  },
  channelSwitcherContent: {
    gap: spacing.xs,
  },
  channelChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  channelChipActive: {
    backgroundColor: colors.paperRaised,
    borderColor: colors.accent,
  },
  channelChipText: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 12,
  },
  channelChipTextActive: {
    color: colors.accent,
  },
  privacyModeNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    gap: 6,
  },
  privacyModeIcon: {
    fontSize: 12,
  },
  privacyModeText: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    flex: 1,
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

