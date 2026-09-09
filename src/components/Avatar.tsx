import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, typography } from "@/theme";

export interface AvatarProps {
  name?: string;
  email?: string;
  size?: number;
  isVerified?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ name, email, size = 44, isVerified = false, style }: AvatarProps) {
  const identifier = name || email || "User";
  const initials = identifier
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const fontSize = Math.round(size * 0.38);

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
      {isVerified ? (
        <View style={[styles.badge, { width: Math.round(size * 0.36), height: Math.round(size * 0.36), borderRadius: size / 2 }]}>
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
