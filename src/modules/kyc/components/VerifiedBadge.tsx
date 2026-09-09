import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { KycStatus } from "../types";

const LABELS: Record<KycStatus, string> = {
  unverified: "Not verified",
  pending: "Verification pending",
  verified: "Verified",
  rejected: "Verification failed",
};

const COLORS: Record<KycStatus, string> = {
  unverified: colors.statusOff,
  pending: colors.statusPending,
  verified: colors.statusVerified,
  rejected: colors.statusFlagged,
};

export function VerifiedBadge({ status }: { status: KycStatus }) {
  const tint = COLORS[status];
  return (
    <View style={[styles.badge, { borderColor: tint }]}>
      <View style={[styles.dot, { backgroundColor: tint }]} />
      <Text style={[styles.label, { color: tint }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...typography.caption },
});
