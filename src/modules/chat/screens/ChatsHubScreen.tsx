import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Card, Badge, Avatar, Button } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useActiveChats } from "../hooks/useActiveChats";
import { setChatLastRead } from "../services/chatService";
import { RoadtripConciergeBot } from "../components/RoadtripConciergeBot";
import type { ActiveTripChat } from "../types";

export function ChatsHubScreen() {
  const { session } = useAuthSession();
  const { chats, loading, totalUnread, refresh } = useActiveChats();
  const [activeTab, setActiveTab] = useState<"trips" | "ai">("trips");

  function handleOpenTripChat(chat: ActiveTripChat) {
    setChatLastRead(chat.chatId, Date.now());
    refresh();
    const params: { id: string; partnerId?: string; isGroup?: string } = { id: chat.tripId };
    if (chat.isGroup) {
      params.isGroup = "true";
    } else if (chat.partnerId) {
      params.partnerId = chat.partnerId;
    }
    router.push({
      pathname: "/trips/[id]/chat",
      params,
    });
  }

  return (
    <Screen
      showBack
      title="Chats & Assistant"
      showNavBar
      onBack={() => (router.canGoBack() ? router.back() : router.push("/"))}
    >
      {/* Top Segmented Tab Switcher */}
      <View style={styles.tabBar}>
        <Pressable
          onPress={() => setActiveTab("trips")}
          style={[styles.tabBtn, activeTab === "trips" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabLabel, activeTab === "trips" && styles.tabLabelActive]}>
            🚗 Direct Chats
          </Text>
          {totalUnread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("ai")}
          style={[styles.tabBtn, activeTab === "ai" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabLabel, activeTab === "ai" && styles.tabLabelActive]}>
            🤖 AI Concierge
          </Text>
        </Pressable>
      </View>

      {/* Content Area */}
      {activeTab === "ai" ? (
        <RoadtripConciergeBot />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chatId}
          refreshing={loading}
          onRefresh={refresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const hasUnread = item.unreadCount > 0;
            const depart = new Date(item.departAt).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const cardTitle = item.isGroup
              ? item.groupChatEnabled
                ? `👥 ${item.destination} (Group Discussion)`
                : `📢 ${item.destination} (Announcements)`
              : item.isLead
              ? `💬 1-on-1: ${item.partnerName || "Passenger"}`
              : `💬 1-on-1 with Host: ${item.partnerName || "Driver"}`;

            const badgeLabel = item.isGroup
              ? item.groupChatEnabled
                ? "Group 👥"
                : "Broadcast 📢"
              : "Private 1-on-1 🔒";

            return (
              <Card
                style={[styles.chatCard, hasUnread && styles.chatCardUnread]}
                onPress={() => handleOpenTripChat(item)}
              >
                <View style={styles.chatCardRow}>
                  <Avatar
                    name={item.isGroup ? (item.groupChatEnabled ? "Group" : "Broadcast") : (item.partnerName || "Traveler")}
                    uri={item.isGroup ? undefined : item.partnerPhotoUrl}
                    size="md"
                  />
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeaderRow}>
                      <Text style={styles.destinationTitle} numberOfLines={1}>
                        {cardTitle}
                      </Text>
                      <Badge label={badgeLabel} variant={item.isGroup ? "neutral" : "accent"} />
                    </View>
                    <Text style={styles.routeSub} numberOfLines={1}>
                      🚗 {item.destination} • 📍 {item.originLabel}
                    </Text>
                    <Text
                      style={[styles.lastMessageText, hasUnread && styles.lastMessageUnread]}
                      numberOfLines={1}
                    >
                      {item.lastMessage
                        ? `${item.lastMessage.senderId === session?.user.id ? "You: " : ""}${item.lastMessage.body}`
                        : item.isGroup
                        ? "Official trip updates & announcements"
                        : "Private 1-on-1 chat · Tap to coordinate"}
                    </Text>
                  </View>
                  {hasUnread && (
                    <View style={styles.itemUnreadBadge}>
                      <Text style={styles.itemUnreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>No active chats yet</Text>
                <Text style={styles.emptySub}>
                  When you host or join a journey, your private 1-on-1 driver-passenger chats and trip announcement channels will appear here.
                </Text>
                <View style={styles.emptyActions}>
                  <Button
                    label="🧭 Explore Journeys"
                    onPress={() => router.push("/")}
                    variant="primary"
                    size="md"
                  />
                  <Button
                    label="🤖 Chat with AI Concierge"
                    onPress={() => setActiveTab("ai")}
                    variant="secondary"
                    size="md"
                  />
                </View>
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  tabBtnActive: {
    backgroundColor: colors.paper,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 13,
  },
  tabLabelActive: {
    color: colors.ink,
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  unreadBadgeText: {
    color: colors.inkLight,
    fontSize: 10,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.sm,
  },
  chatCard: {
    padding: spacing.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  chatCardUnread: {
    borderColor: colors.accent,
    backgroundColor: "rgba(235, 94, 40, 0.03)",
  },
  chatCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  destinationTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 15,
  },
  routeSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    marginBottom: 4,
  },
  lastMessageText: {
    ...typography.body,
    color: colors.inkMuted,
    fontSize: 12.5,
  },
  lastMessageUnread: {
    color: colors.ink,
    fontWeight: "600",
  },
  itemUnreadBadge: {
    backgroundColor: colors.accent,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  itemUnreadText: {
    color: colors.inkLight,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptySub: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyActions: {
    gap: spacing.sm,
    width: "100%",
    maxWidth: 260,
  },
});
