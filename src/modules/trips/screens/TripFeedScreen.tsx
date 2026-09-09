import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Card, Badge, Avatar, EmptyState, TextField } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { TripFeedAdSlot } from "@/modules/ads";
import { useAuthSession } from "@/modules/auth";
import { useUserProfile } from "@/modules/profile";
import { useTrips } from "../hooks/useTrips";
import type { Trip } from "../types";

function TripCard({ trip }: { trip: Trip }) {
  const departDate = new Date(trip.departAt);
  const formattedDate = departDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = departDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })}
      style={styles.card}
    >
      {/* Top Meta Bar */}
      <View style={styles.cardTopRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formattedDate} · {formattedTime}</Text>
        </View>

        <View style={styles.badgesGroup}>
          {trip.womenOnly && <Badge label="Women-only" variant="trust" icon={<Text style={styles.badgeIcon}>🛡️</Text>} />}
          {trip.isRoundTrip && <Badge label="Round trip" variant="neutral" icon={<Text style={styles.badgeIcon}>🔄</Text>} />}
        </View>
      </View>

      {/* Route Journey Visualizer */}
      <View style={styles.routeContainer}>
        <View style={styles.routeVisual}>
          <View style={styles.originDot} />
          <View style={styles.routeLine} />
          <View style={styles.destPin}>
            <Text style={styles.destPinText}>📍</Text>
          </View>
        </View>
        <View style={styles.routeTextCol}>
          <View style={styles.originRow}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.originText} numberOfLines={1}>{trip.originLabel}</Text>
          </View>
          <View style={styles.destRow}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.destinationText} numberOfLines={1}>{trip.destination}</Text>
          </View>
        </View>
      </View>

      {/* Note / Vibe */}
      {trip.shortNote ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteQuote}>“</Text>
          <Text style={styles.noteText} numberOfLines={2}>{trip.shortNote}</Text>
        </View>
      ) : null}

      {/* Footer Info & Price */}
      <View style={styles.cardFooter}>
        <View style={styles.seatsInfo}>
          <Text style={styles.seatsIcon}>👥</Text>
          <Text style={styles.seatsText}>{trip.seatsTotal} total seats</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceCurrency}>₹</Text>
          <Text style={styles.priceAmount}>{trip.pricePerSeat}</Text>
          <Text style={styles.priceUnit}>/ seat</Text>
        </View>
      </View>
    </Card>
  );
}

export function TripFeedScreen() {
  const { session } = useAuthSession();
  const { profile } = useUserProfile();
  const [destinationFilter, setDestinationFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "women">("all");

  const { trips, loading, error, refresh } = useTrips({
    destination: destinationFilter || undefined,
    womenOnlyOnly: activeFilter === "women" ? true : undefined,
  });

  return (
    <Screen showNavBar>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Convoy</Text>
          <Text style={styles.brandSubtitle}>Shared Roadtrips & Expeditions</Text>
        </View>
        <Pressable
          onPress={() => router.push("/account")}
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}
        >
          {profile?.photoUrl ? (
            <View style={styles.avatarEmojiWrap}>
              <Text style={styles.avatarEmojiHeader}>{profile.photoUrl}</Text>
            </View>
          ) : (
            <Avatar email={session?.user.email} size={42} isVerified={profile?.kycStatus === "verified"} />
          )}
        </Pressable>
      </View>

      {/* Search Input */}
      <TextField
        placeholder="Search destination (e.g., Manali, Kasol, Goa...)"
        value={destinationFilter}
        onChangeText={setDestinationFilter}
        leftIcon={<Text style={styles.searchIcon}>🔍</Text>}
        containerStyle={styles.searchContainer}
      />

      {/* Quick Filter Pill Chips */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveFilter("all")}
          style={[styles.filterChip, activeFilter === "all" && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, activeFilter === "all" && styles.filterChipTextActive]}>
            🧭 All Trips
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter(activeFilter === "women" ? "all" : "women")}
          style={[styles.filterChip, activeFilter === "women" && styles.filterChipActive]}
        >
          <Text style={[styles.filterChipText, activeFilter === "women" && styles.filterChipTextActive]}>
            🛡️ Women-Only
          </Text>
        </Pressable>
      </View>

      {/* Plan a Trip Floating / Hero CTA */}
      <View style={styles.ctaWrap}>
        <Button
          label="+ Plan a New Trip"
          onPress={() => router.push("/trips/create")}
          size="lg"
          variant="primary"
          style={styles.planBtn}
        />
      </View>

      <TripFeedAdSlot />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TripCard trip={item} />}
        refreshing={loading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🚗"
              title="No matching trips found"
              description="Be the first road-trip host to plan a journey to this destination!"
              actionLabel="Plan this trip"
              onAction={() => router.push("/trips/create")}
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  brandTitle: {
    ...typography.hero,
    color: colors.ink,
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  avatarBtn: {
    borderRadius: 24,
    ...shadows.sm,
  },
  avatarBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  avatarEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmojiHeader: {
    fontSize: 22,
  },
  searchContainer: {
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.inkSubtle,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    ...typography.captionBold,
    color: colors.inkMuted,
  },
  filterChipTextActive: {
    color: colors.inkLight,
  },
  ctaWrap: {
    marginBottom: spacing.lg,
  },
  planBtn: {
    ...shadows.glow,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  dateIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  dateText: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 11.5,
  },
  badgesGroup: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  badgeIcon: {
    fontSize: 11,
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  routeVisual: {
    alignItems: "center",
    marginRight: spacing.md,
    paddingVertical: 4,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.trust,
    borderWidth: 2,
    borderColor: colors.paper,
    ...shadows.sm,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.line,
    marginVertical: 2,
  },
  destPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  destPinText: {
    fontSize: 14,
    lineHeight: 16,
  },
  routeTextCol: {
    flex: 1,
    justifyContent: "space-between",
    height: 48,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeLabel: {
    ...typography.overline,
    color: colors.inkSubtle,
    width: 38,
  },
  originText: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
  },
  destinationText: {
    ...typography.h2,
    color: colors.ink,
    flex: 1,
  },
  noteBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noteQuote: {
    ...typography.h2,
    color: colors.accent,
    lineHeight: 18,
    marginRight: 4,
  },
  noteText: {
    ...typography.caption,
    color: colors.inkMuted,
    flex: 1,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  seatsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatsIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  seatsText: {
    ...typography.captionBold,
    color: colors.inkSoft,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceCurrency: {
    ...typography.bodyMedium,
    color: colors.accent,
    fontWeight: "700",
  },
  priceAmount: {
    ...typography.h1,
    color: colors.accent,
    fontWeight: "800",
  },
  priceUnit: {
    ...typography.caption,
    color: colors.inkSoft,
    marginLeft: 3,
  },
  error: {
    ...typography.caption,
    color: colors.statusFlagged,
    marginVertical: spacing.sm,
    textAlign: "center",
  },
});
