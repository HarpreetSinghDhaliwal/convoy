import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";
import { VerifiedBadge } from "@/modules/kyc";
import { usePublicProfile } from "../hooks/usePublicProfile";

export function ProfileSummary({ userId }: { userId: string }) {
  const { profile, loading } = usePublicProfile(userId);

  if (loading) {
    return <Text style={styles.loading}>Loading profile…</Text>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push({ pathname: "/profile/[id]", params: { id: userId } })}
    >
      <Avatar name={profile?.name || "Traveler"} uri={profile?.photoUrl} size="md" />
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile?.name || "Convoy Traveler"}</Text>
          {profile && <VerifiedBadge status={profile.kycStatus} />}
        </View>
        <Text style={styles.subText}>Tap to view profile & travel history ›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowPressed: {
    backgroundColor: colors.paperRaised,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  name: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 14,
  },
  subText: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  loading: {
    ...typography.caption,
    color: colors.inkSubtle,
  },
});
