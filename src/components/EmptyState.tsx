import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = "🚗",
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <Button label={actionLabel} onPress={onAction} size="md" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.lineLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 22,
  },
  actionWrap: {
    marginTop: spacing.xl,
    minWidth: 180,
  },
});
