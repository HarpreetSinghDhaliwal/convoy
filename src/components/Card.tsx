import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "@/theme";

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: "elevated" | "flat" | "glass" | "accent";
}

export function Card({ children, style, onPress, variant = "elevated" }: CardProps) {
  const isElevated = variant === "elevated";
  const isFlat = variant === "flat";
  const isGlass = variant === "glass";
  const isAccent = variant === "accent";

  const cardStyle = [
    styles.base,
    isElevated && [styles.elevated, shadows.sm],
    isFlat && styles.flat,
    isGlass && styles.glass,
    isAccent && styles.accent,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  elevated: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  flat: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
  },
  glass: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  accent: {
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accentGlow,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
