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

const AVATAR_PALETTES = [
  { bg: "#EAF3F7", text: "#1E5F74", border: "#1E5F74" }, // Sapphire Slate
  { bg: "#FDEEEB", text: "#C8452D", border: "#C8452D" }, // Terracotta Warm
  { bg: "#DCFCE7", text: "#15803D", border: "#15803D" }, // Emerald Mint
  { bg: "#FEF3C7", text: "#92400E", border: "#D97706" }, // Amber Gold
  { bg: "#F3E8FF", text: "#6B21A8", border: "#9333EA" }, // Royal Violet
  { bg: "#E0E7FF", text: "#3730A3", border: "#4F46E5" }, // Deep Indigo
  { bg: "#FFE4E6", text: "#9F1239", border: "#E11D48" }, // Crimson Rose
  { bg: "#CCFBF1", text: "#115E59", border: "#0D9488" }, // Cool Teal
];

function getPalette(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function Avatar({
  name,
  email,
  uri,
  size = 44,
  isVerified = false,
  style,
}: AvatarProps) {
  const numericSize = typeof size === "number" ? size : SIZE_MAP[size] || 44;
  const [imgLoadError, setImgLoadError] = React.useState(false);

  const rawIdentifier = (name || email || "User").trim();
  // Find first alphanumeric character for crisp initials, falling back to first char
  const cleanCharMatch = rawIdentifier.match(/[a-zA-Z0-9]/);
  const initials = cleanCharMatch
    ? cleanCharMatch[0].toUpperCase()
    : rawIdentifier.charAt(0).toUpperCase() || "U";

  const palette = getPalette(rawIdentifier);
  const fontSize = Math.round(numericSize * 0.44);

  // Check if uri is a valid web or local image URL (not an emoji or invalid string)
  const isHttpOrDataUrl =
    typeof uri === "string" &&
    uri.trim().length > 5 &&
    (uri.startsWith("http://") ||
      uri.startsWith("https://") ||
      uri.startsWith("data:") ||
      uri.startsWith("file:") ||
      uri.startsWith("blob:"));

  const shouldRenderImage = isHttpOrDataUrl && !imgLoadError;

  return (
    <View style={[{ width: numericSize, height: numericSize }, styles.container, style]}>
      {shouldRenderImage ? (
        <Image
          source={{ uri: uri!.trim() }}
          onError={() => setImgLoadError(true)}
          style={[
            styles.image,
            { width: numericSize, height: numericSize, borderRadius: numericSize / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.circle,
            {
              width: numericSize,
              height: numericSize,
              borderRadius: numericSize / 2,
              backgroundColor: palette.bg,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize, color: palette.text }]}>{initials}</Text>
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
