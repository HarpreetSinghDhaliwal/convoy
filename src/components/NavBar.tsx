import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, router } from "expo-router";
import { colors, radius, shadows, spacing, typography } from "@/theme";

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  isAction?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: "explore", label: "Explore", icon: "🧭", route: "/" },
  { key: "saved", label: "Saved", icon: "📍", route: "/favorites" },
  { key: "plan", label: "Plan", icon: "➕", route: "/trips/create", isAction: true },
  { key: "following", label: "Following", icon: "👥", route: "/following" },
  { key: "account", label: "Account", icon: "👤", route: "/account" },
];

export function NavBar() {
  const pathname = usePathname();

  function isActive(route: string) {
    if (route === "/") {
      return pathname === "/" || pathname === "/(app)" || pathname === "/(app)/";
    }
    const cleanPath = pathname.replace("/(app)", "");
    return cleanPath === route || cleanPath.startsWith(`${route}/`) || pathname === route || pathname.startsWith(`${route}/`);
  }

  function handleNavigate(route: string) {
    router.push(route as any);
  }

  return (
    <View style={styles.navContainer}>
      <View style={styles.dock}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.route);

          if (item.isAction) {
            return (
              <Pressable
                key={item.key}
                onPress={() => handleNavigate(item.route)}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <Text style={styles.actionIcon}>{item.icon}</Text>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavigate(item.route)}
              style={({ pressed }) => [
                styles.navTab,
                active && styles.navTabActive,
                pressed && styles.navTabPressed,
              ]}
            >
              <Text style={[styles.navIcon, active && styles.navIconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: "transparent",
    zIndex: 100,
  },
  dock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: "100%",
    maxWidth: 500,
    ...shadows.lg,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    position: "relative",
  },
  navTabActive: {
    backgroundColor: colors.surfaceSubtle,
  },
  navTabPressed: {
    transform: [{ scale: 0.94 }],
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.75,
  },
  navIconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  navLabel: {
    ...typography.caption,
    fontSize: 10.5,
    color: colors.inkSoft,
    fontWeight: "500",
  },
  navLabelActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  activeDot: {
    position: "absolute",
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  actionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xs,
    ...shadows.glow,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.93 }],
    backgroundColor: colors.accentHover,
  },
  actionIcon: {
    color: colors.paper,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },
  actionLabel: {
    color: colors.paper,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
