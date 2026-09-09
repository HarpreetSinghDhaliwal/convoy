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

  const isHost = Boolean(trip && session?.user.id === trip.leadId);
  const groupChatEnabled = Boolean(trip?.groupChatEnabled);

  // Active target state
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>(
    initialPartnerId || (!isHost ? trip?.leadId : undefined),
  );
  const [isGroupMode, setIsGroupMode] = useState<boolean>(
    initialIsGroup === "true" || (!initialPartnerId && isHost && !selectedPartnerId),
  );
  const [togglingGroup, setTogglingGroup] = useState(false);

  useEffect(() => {
    if (initialPartnerId) {
      setSelectedPartnerId(initialPartnerId);
      setIsGroupMode(false);
    } else if (initialIsGroup === "true") {
      setIsGroupMode(true);
    } else if (!isHost && trip?.leadId && !selectedPartnerId) {
      setSelectedPartnerId(trip.leadId);
    }
  }, [initialPartnerId, initialIsGroup, isHost, trip?.leadId, selectedPartnerId]);

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
          .from("public_profiles")
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

          // If host and no partner selected, default to first passenger if not in group mode
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
    } finally {
      setTogglingGroup(false);
    }
  }

  const draftLooksFlagged = draft.length > 0 && looksLikeContactOrPaymentInfo(draft);

  const partnerInfo = activePartnerId ? memberMap.get(activePartnerId) : undefined;
  const hostInfo = trip?.leadId ? memberMap.get(trip.leadId) : undefined;

  // Title logic
  const chatTitle = isGroupMode
    ? groupChatEnabled
      ? `👥 Group Chat: ${trip?.destination || "Trip"}`
      : `📢 Announcements: ${trip?.destination || "Trip"}`
    : isHost
    ? `💬 1-on-1: ${partnerInfo?.name || "Passenger"}`
    : `💬 1-on-1: Host ${hostInfo?.name || ""}`;

  // Can user post in group mode?
  // In Broadcast mode (default), ONLY the host can post in the group.
  // In Open Discussion mode, everyone approved can post.
  const canPostInGroup = isHost || groupChatEnabled;
  const canSendMessages = !isGroupMode || canPostInGroup;

  async function handleSend(customText?: string) {
    if (!canSendMessages) return;
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
    const isItemHost = Boolean(trip && item.senderId === trip.leadId);
    const sender = memberMap.get(item.senderId);
    const timeString = new Date(item.sentAt).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    // In Broadcast Mode (default), co-passengers' profiles are shielded from other passengers
    const isPassengerPrivacyShielded =
      isGroupMode && !groupChatEnabled && !isHost && !isItemHost;

    const senderDisplayName = isItemHost
      ? `${sender?.name || "Trip Host"} (Host)`
      : isPassengerPrivacyShielded
      ? "Co-Traveler"
      : sender?.name || "Co-Traveler";

    const canNavigateToProfile = !isPassengerPrivacyShielded;

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
        {!isMine && (
          <Pressable
            disabled={!canNavigateToProfile}
            onPress={() =>
              canNavigateToProfile &&
              router.push({ pathname: "/profile/[id]", params: { id: item.senderId } })
            }
            style={styles.avatarWrap}
          >
            <Avatar
              name={isPassengerPrivacyShielded ? "Co-Traveler" : sender?.name || "Traveler"}
              uri={isPassengerPrivacyShielded ? undefined : sender?.photoUrl}
              size="sm"
            />
          </Pressable>
        )}

        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          {!isMine && (
            <Pressable
              disabled={!canNavigateToProfile}
              onPress={() =>
                canNavigateToProfile &&
                router.push({ pathname: "/profile/[id]", params: { id: item.senderId } })
              }
              style={styles.senderHeader}
            >
              <Text style={styles.senderName}>{senderDisplayName}</Text>
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
      onBack={() => (router.canGoBack() ? router.back() : router.push("/messages"))}
      rightAction={<SosButton tripId={tripId} />}
    >
      {/* Trip Info & Group Control Banner */}
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

          {/* Group Discussion Toggle (Only visible to Host when on the Group Channel) */}
          {isHost && isGroupMode ? (
            <Pressable
              onPress={handleToggleGroupChat}
              disabled={togglingGroup}
              style={[styles.hostToggleBtn, groupChatEnabled && styles.hostToggleBtnActive]}
            >
              <Text style={[styles.hostToggleText, groupChatEnabled && styles.hostToggleTextActive]}>
                {groupChatEnabled ? "👥 Open Discussion: ON" : "📢 Broadcast Only"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })}
              style={styles.tripDetailsPill}
            >
              <Text style={styles.tripDetailsPillText}>
                {isGroupMode ? "Trip Details ›" : "🔒 1-on-1 Private"}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Host Navigation Channels (Group Channel + 1-on-1 with each passenger) */}
      {isHost && (
        <View style={styles.channelSwitcherBar}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={approvedMembers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.channelSwitcherContent}
            ListHeaderComponent={
              <Pressable
                style={[styles.channelChip, isGroupMode && styles.channelChipActive]}
                onPress={() => setIsGroupMode(true)}
              >
                <Text style={[styles.channelChipText, isGroupMode && styles.channelChipTextActive]}>
                  {groupChatEnabled ? "👥 Trip Group Chat" : "📢 Trip Announcements"}
                </Text>
              </Pressable>
            }
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
                  <Avatar name={item.name || "Passenger"} uri={item.photoUrl} size={18} />
                  <Text style={[styles.channelChipText, active && styles.channelChipTextActive]}>
                    {item.name || "Passenger"}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Passenger Navigation Channels (1-on-1 with Host + Trip Broadcast/Group Channel) */}
      {!isHost && (
        <View style={styles.channelSwitcherBar}>
          <Pressable
            style={[styles.channelChip, !isGroupMode && styles.channelChipActive]}
            onPress={() => setIsGroupMode(false)}
          >
            <Avatar name={hostInfo?.name || "Host"} uri={hostInfo?.photoUrl} size={18} />
            <Text style={[styles.channelChipText, !isGroupMode && styles.channelChipTextActive]}>
              Host {hostInfo?.name ? `(${hostInfo.name})` : ""}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.channelChip, isGroupMode && styles.channelChipActive]}
            onPress={() => setIsGroupMode(true)}
          >
            <Text style={[styles.channelChipText, isGroupMode && styles.channelChipTextActive]}>
              {groupChatEnabled ? "👥 Trip Group Chat" : "📢 Trip Announcements"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Privacy & Channel Explainer Bar */}
      <View style={styles.privacyModeNotice}>
        <Text style={styles.privacyModeIcon}>
          {isGroupMode ? (groupChatEnabled ? "👥" : "📢") : "🔒"}
        </Text>
        <Text style={styles.privacyModeText}>
          {isGroupMode
            ? groupChatEnabled
              ? "Open Group Discussion: Visible to all confirmed travelers on this journey."
              : isHost
              ? "Broadcast Mode: Only you can post updates. Passenger identities are shielded from each other."
              : "Trip Announcements: Official updates from Trip Host. Passenger identities remain private."
            : isHost
            ? `Private 1-on-1 with ${partnerInfo?.name || "Passenger"} · Only you two can talk here (nobody else).`
            : `Private 1-on-1 with Host (${hostInfo?.name || "Driver"}) · Only you two can talk here (nobody else).`}
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
              icon={isGroupMode ? (groupChatEnabled ? "👥" : "📢") : "🔒"}
              title={
                isGroupMode
                  ? groupChatEnabled
                    ? "Welcome to the Group Chat!"
                    : "Trip Broadcast Announcements"
                  : `1-on-1 Private Chat with ${partnerInfo?.name || (!isHost ? "Trip Host" : "Passenger")}`
              }
              description={
                isGroupMode
                  ? groupChatEnabled
                    ? "Discuss travel plans, playlists, and stops together with your fellow approved roadtrippers."
                    : isHost
                    ? "Post departure timings, exact car location, and route updates for all your confirmed passengers here."
                    : "The trip host will post official journey updates and pickup coordinates here."
                  : "Direct private conversation for personal questions, luggage, and pickup specifics. Confidential between you two."
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
            For community safety against fraud, sharing direct phone numbers or off-platform payment
            links is restricted. Use Convoy's verified in-app features.
          </Text>
        </View>
      )}

      {/* Quick Coordination Chips (Only shown if user can post) */}
      {canSendMessages && (
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
      )}

      {/* Message Composer Dock or Broadcast Locked Notice */}
      {canSendMessages ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={
                isGroupMode
                  ? "Post update to trip channel..."
                  : `Message ${partnerInfo?.name || (isHost ? "passenger" : "host")} directly (private)...`
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
      ) : (
        <View style={styles.broadcastLockedBar}>
          <View style={styles.broadcastLockedTextWrap}>
            <Text style={styles.broadcastLockedTitle}>📢 Announcements Only Channel</Text>
            <Text style={styles.broadcastLockedSub}>
              Only the Trip Host can post updates in this channel. For personal queries, chat with the host 1-on-1.
            </Text>
          </View>
          <Button
            label="💬 Chat 1-on-1 with Host"
            onPress={() => {
              setIsGroupMode(false);
              setSelectedPartnerId(trip?.leadId);
            }}
            variant="primary"
            size="sm"
            style={styles.broadcastLockedBtn}
          />
        </View>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
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
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  privacyModeIcon: {
    fontSize: 14,
  },
  privacyModeText: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    maxWidth: "85%",
  },
  messageRowMine: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  messageRowOther: {
    alignSelf: "flex-start",
  },
  avatarWrap: {
    marginBottom: 2,
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  bubbleMine: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: colors.paper,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  senderName: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 11,
  },
  hostBadgeTag: {
    ...typography.captionBold,
    color: colors.accent,
    fontSize: 10,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  bubbleTextMine: {
    ...typography.body,
    color: colors.paper,
    fontSize: 14,
  },
  bubbleTextOther: {
    ...typography.body,
    color: colors.ink,
    fontSize: 14,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 4,
  },
  timeTextMine: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 10,
  },
  timeTextOther: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 10,
  },
  checkmarks: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.85)",
  },
  flaggedContainer: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  flaggedNoteMine: {
    ...typography.caption,
    color: "#FEE2E2",
    fontSize: 10,
  },
  flaggedNoteOther: {
    ...typography.caption,
    color: "#DC2626",
    fontSize: 10,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  warningIcon: {
    fontSize: 14,
  },
  warningText: {
    ...typography.caption,
    color: "#92400E",
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  quickChipsBar: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  quickChipsContent: {
    gap: spacing.xs,
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
    color: colors.ink,
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    backgroundColor: colors.paper,
    padding: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    fontSize: 14,
    maxHeight: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    alignSelf: "flex-end",
  },
  broadcastLockedBar: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.sm,
    alignItems: "center",
  },
  broadcastLockedTextWrap: {
    alignItems: "center",
    gap: 2,
  },
  broadcastLockedTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 13,
  },
  broadcastLockedSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 15,
  },
  broadcastLockedBtn: {
    width: "100%",
  },
});
