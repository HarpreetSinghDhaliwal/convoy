import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { colors, spacing, typography } from "@/theme";
import { VerifiedBadge } from "@/modules/kyc";
import { usePublicProfile } from "../hooks/usePublicProfile";

// Drop-in replacement for the raw `userId.slice(0, 8)…` placeholders that
// were in IncomingRequestsScreen and FollowingScreen before the
// public_profiles view (migration 0011) existed to read from.
export function ProfileSummary({ userId }: { userId: string }) {
  const { profile, loading } = usePublicProfile(userId);

  if (loading) {
    return <Text style={styles.loading}>Loading…</Text>;
  }

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: "/profile/[id]", params: { id: userId } })}
    >
      <Text style={styles.name}>{profile?.name || "Unnamed traveler"}</Text>
      {profile && <VerifiedBadge status={profile.kycStatus} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  name: { ...typography.bodyMedium, color: colors.ink },
  loading: { ...typography.caption, color: colors.inkSoft },
});
