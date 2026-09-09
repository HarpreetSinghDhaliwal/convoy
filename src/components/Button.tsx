import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";
import { colors, radius, shadows, spacing, typography } from "@/theme";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";
  const isGold = variant === "gold";

  const sizeStyle = size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;
  const labelSizeStyle = size === "sm" ? styles.labelSm : size === "lg" ? styles.labelLg : styles.labelMd;

  const variantStyle = isPrimary
    ? styles.primary
    : isSecondary
    ? styles.secondary
    : isOutline
    ? styles.outline
    : isGhost
    ? styles.ghost
    : isDanger
    ? styles.danger
    : styles.gold;

  const variantLabelStyle = isPrimary
    ? styles.labelPrimary
    : isSecondary
    ? styles.labelSecondary
    : isOutline
    ? styles.labelOutline
    : isGhost
    ? styles.labelGhost
    : isDanger
    ? styles.labelDanger
    : styles.labelGold;

  const spinnerColor = isPrimary || isDanger || isGold ? colors.inkLight : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        variantStyle,
        isPrimary && shadows.glow,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <Text style={[styles.label, labelSizeStyle, variantLabelStyle, labelStyle]}>
            {label}
          </Text>
          {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    transitionProperty: "opacity, transform",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  sizeSm: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    borderRadius: radius.sm,
  },
  sizeMd: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
    borderRadius: radius.md,
  },
  sizeLg: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    minHeight: 52,
    borderRadius: radius.lg,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: colors.statusFlagged,
  },
  gold: {
    backgroundColor: colors.gold,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  label: {
    textAlign: "center",
  },
  labelSm: {
    ...typography.captionBold,
  },
  labelMd: {
    ...typography.bodyMedium,
  },
  labelLg: {
    ...typography.h3,
  },
  labelPrimary: {
    color: colors.inkLight,
    fontWeight: "700",
  },
  labelSecondary: {
    color: colors.ink,
    fontWeight: "600",
  },
  labelOutline: {
    color: colors.inkMuted,
    fontWeight: "600",
  },
  labelGhost: {
    color: colors.trust,
    fontWeight: "600",
  },
  labelDanger: {
    color: colors.inkLight,
    fontWeight: "700",
  },
  labelGold: {
    color: colors.inkLight,
    fontWeight: "700",
  },
});
