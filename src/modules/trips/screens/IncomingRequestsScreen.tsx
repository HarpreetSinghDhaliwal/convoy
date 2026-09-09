import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, Button, Card, Badge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { ProfileSummary, ContactPhoneReveal } from "@/modules/profile";
import { approveRequest, declineRequest, getIncomingRequests } from "../services/tripService";
import type { TripMember } from "../types";

export function IncomingRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [requests, setRequests] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = useCallback(() => {
    async function run() {
      setLoading(true);
      try {
        setRequests(await getIncomingRequests(id));
      } finally {
        setLoading(false);
      }
    }
    return run();
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(memberId: string) {
    setActingOn(memberId);
    try {
      await approveRequest(memberId);
      await load();
    } finally {
      setActingOn(null);
    }
  }

  async function handleDecline(memberId: string) {
    setActingOn(memberId);
    try {
      await declineRequest(memberId);
      await load();
    } finally {
      setActingOn(null);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Join Requests</Text>
        <Text style={styles.subtitle}>Review travelers requesting to join your roadtrip</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const seats = item.seatsRequested || 1;
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Badge
                  label={`🎟️ ${seats} ${seats === 1 ? "Seat" : "Seats"} Requested`}
                  variant="accent"
                />
                <Text style={styles.requestTime}>
                  {new Date(item.joinedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>

              <View style={styles.profileSection}>
                <ProfileSummary userId={item.userId} />
              </View>

              <View style={styles.phoneSection}>
                <ContactPhoneReveal tripId={id} targetUserId={item.userId} />
              </View>

              <View style={styles.actions}>
                <Button
                  label="✓ Approve Request"
                  onPress={() => handleApprove(item.id)}
                  loading={actingOn === item.id}
                  variant="primary"
                  style={styles.actionBtn}
                />
                <Button
                  label="✕ Decline"
                  onPress={() => handleDecline(item.id)}
                  variant="secondary"
                  loading={actingOn === item.id}
                  style={styles.declineBtn}
                />
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>No pending join requests</Text>
              <Text style={styles.emptySub}>
                When travelers request to hop on your journey, they will appear here for your review and approval.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  requestTime: {
    ...typography.overline,
    color: colors.inkSubtle,
  },
  profileSection: {
    marginBottom: spacing.md,
  },
  phoneSection: {
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 2,
  },
  declineBtn: {
    flex: 1,
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
    maxWidth: 320,
    lineHeight: 20,
  },
});
