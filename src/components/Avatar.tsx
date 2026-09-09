import React from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, typography } from "@/theme";

export type AvatarSize = number | "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  name?: string;
  email?: string;
  uri?: string | null;
  size?: AvatarSize;
  isVerified?: boolean;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 72,
};

export function Avatar({
  name,
  email,
  uri,
  size = 44,
  isVerified = false,
  style,
}: AvatarProps) {
  const numericSize = typeof size === "number" ? size : SIZE_MAP[size] || 44;

  const identifier = name || email || "User";
  const initials = identifier
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const fontSize = Math.round(numericSize * 0.38);

  return (
    <View style={[{ width: numericSize, height: numericSize }, styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: numericSize, height: numericSize, borderRadius: numericSize / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.circle,
            { width: numericSize, height: numericSize, borderRadius: numericSize / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}

      {isVerified ? (
        <View
          style={[
            styles.badge,
            {
              width: Math.round(numericSize * 0.36),
              height: Math.round(numericSize * 0.36),
              borderRadius: numericSize / 2,
            },
          ]}
        >
          <Text style={styles.checkmark}>✓</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  circle: {
    backgroundColor: colors.trustLight,
    borderWidth: 1.5,
    borderColor: colors.trust,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    borderWidth: 1.5,
    borderColor: colors.trust,
  },
  initials: {
    ...typography.bodyMedium,
    color: colors.trust,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    backgroundColor: colors.statusVerified,
    borderWidth: 1.5,
    borderColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10,
  },
});
