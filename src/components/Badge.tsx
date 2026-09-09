import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";

export type BadgeVariant = "accent" | "trust" | "verified" | "pending" | "flagged" | "neutral" | "gold";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Badge({ label, variant = "accent", icon, style, labelStyle }: BadgeProps) {
  const isAccent = variant === "accent";
  const isTrust = variant === "trust";
  const isVerified = variant === "verified";
  const isPending = variant === "pending";
  const isFlagged = variant === "flagged";
  const isGold = variant === "gold";

  const containerVariant = isAccent
    ? styles.accentBg
    : isTrust
    ? styles.trustBg
    : isVerified
    ? styles.verifiedBg
    : isPending
    ? styles.pendingBg
    : isFlagged
    ? styles.flaggedBg
    : isGold
    ? styles.goldBg
    : styles.neutralBg;

  const textVariant = isAccent
    ? styles.accentText
    : isTrust
    ? styles.trustText
    : isVerified
    ? styles.verifiedText
    : isPending
    ? styles.pendingText
    : isFlagged
    ? styles.flaggedText
    : isGold
    ? styles.goldText
    : styles.neutralText;

  return (
    <View style={[styles.badge, containerVariant, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, textVariant, labelStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  icon: {
    marginRight: 4,
  },
  label: {
    ...typography.captionBold,
    fontSize: 11.5,
  },
  accentBg: {
    backgroundColor: colors.accentLight,
    borderColor: "rgba(200, 69, 45, 0.2)",
  },
  accentText: {
    color: colors.accent,
  },
  trustBg: {
    backgroundColor: colors.trustLight,
    borderColor: "rgba(30, 95, 116, 0.2)",
  },
  trustText: {
    color: colors.trust,
  },
  verifiedBg: {
    backgroundColor: colors.statusVerifiedLight,
    borderColor: "rgba(21, 128, 61, 0.25)",
  },
  verifiedText: {
    color: colors.statusVerified,
  },
  pendingBg: {
    backgroundColor: colors.statusPendingLight,
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  pendingText: {
    color: colors.statusPending,
  },
  flaggedBg: {
    backgroundColor: colors.statusFlaggedLight,
    borderColor: "rgba(220, 38, 38, 0.25)",
  },
  flaggedText: {
    color: colors.statusFlagged,
  },
  goldBg: {
    backgroundColor: colors.goldLight,
    borderColor: "rgba(217, 119, 6, 0.3)",
  },
  goldText: {
    color: colors.goldInk,
  },
  neutralBg: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.line,
  },
  neutralText: {
    color: colors.inkMuted,
  },
});
