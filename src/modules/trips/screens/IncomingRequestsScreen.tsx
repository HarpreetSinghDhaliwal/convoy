import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen, Button } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";
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
      <Text style={styles.title}>Join requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <ProfileSummary userId={item.userId} />
            <ContactPhoneReveal tripId={id} targetUserId={item.userId} />
            <View style={styles.actions}>
              <Button
                label="Approve"
                onPress={() => handleApprove(item.id)}
                loading={actingOn === item.id}
              />
              <Button
                label="Decline"
                onPress={() => handleDecline(item.id)}
                variant="secondary"
                loading={actingOn === item.id}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No pending requests.</Text> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.ink, marginBottom: spacing.lg },
  row: {
    backgroundColor: colors.paperRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  empty: { ...typography.body, color: colors.inkSoft, textAlign: "center", marginTop: spacing.xxl },
});
