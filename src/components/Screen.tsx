import React from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors, spacing, typography } from "@/theme";
import { NavBar } from "./NavBar";

export interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showNavBar?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({
  children,
  title,
  showBack,
  onBack,
  rightAction,
  showNavBar = false,
  style,
  contentStyle,
}: ScreenProps) {
  const handleBack = onBack || (() => router.back());

  return (
    <SafeAreaView style={[styles.safe, style]} edges={["top", "bottom"]}>
      <View style={[styles.container, showNavBar && styles.containerWithNav, contentStyle]}>
        {title || showBack || rightAction ? (
          <View style={styles.topBar}>
            <View style={styles.topBarLeft}>
              {showBack ? (
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
                  hitSlop={8}
                >
                  <Text style={styles.backArrow}>←</Text>
                </Pressable>
              ) : null}
              {title ? <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text> : null}
            </View>
            {rightAction ? <View style={styles.topBarRight}>{rightAction}</View> : null}
          </View>
        ) : null}
        {children}
      </View>
      {showNavBar && <NavBar />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
    position: "relative",
  },
  container: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  containerWithNav: {
    paddingBottom: 72,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  backBtnPressed: {
    backgroundColor: colors.lineLight,
    transform: [{ scale: 0.95 }],
  },
  backArrow: {
    fontSize: 20,
    color: colors.ink,
    fontWeight: "700",
    lineHeight: 22,
  },
  topBarTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
});
