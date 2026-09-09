import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Screen, Button, Card, Badge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { MapPicker } from "@/modules/routing";
import type { GeocodeResult } from "@/modules/routing";
import { useFavoriteLocations } from "../hooks/useFavoriteLocations";
import { TOP_DESTINATIONS } from "../data/topDestinations";

export function FavoriteLocationsScreen() {
  const { favorites, loading, isFavorited, add, remove } = useFavoriteLocations();
  const [customPoint, setCustomPoint] = useState<GeocodeResult | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);
  const [togglingLabel, setTogglingLabel] = useState<string | null>(null);

  async function toggleQuickPick(label: string, lat: number, lng: number) {
    setTogglingLabel(label);
    try {
      if (isFavorited(label)) {
        const existing = favorites.find((f) => f.label === label);
        if (existing) await remove(existing.id);
      } else {
        await add(label, lat, lng);
      }
    } finally {
      setTogglingLabel(null);
    }
  }

  async function handleAddCustom() {
    if (!customPoint) return;
    setAddingCustom(true);
    try {
      await add(customPoint.label, customPoint.lat, customPoint.lng);
      setCustomPoint(null);
    } finally {
      setAddingCustom(false);
    }
  }

  return (
    <Screen showBack title="Saved Destinations" showNavBar>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorite Destinations</Text>
          <Text style={styles.subtitle}>
            Get notified immediately when verified hosts post roadtrips within 50km of your favorite spots.
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>POPULAR ROADTRIP GETAWAYS</Text>
          <View style={styles.chipRow}>
            {TOP_DESTINATIONS.map((dest) => {
              const active = isFavorited(dest.label);
              return (
                <Pressable
                  key={dest.label}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleQuickPick(dest.label, dest.lat, dest.lng)}
                  disabled={togglingLabel === dest.label}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {active ? "★ " : "+ "}
                    {dest.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionHeader}>PIN CUSTOM LOCATION</Text>
          <MapPicker value={customPoint} onChange={setCustomPoint} />
          <Button
            label="Save Pin to Favorites"
            onPress={handleAddCustom}
            loading={addingCustom}
            disabled={!customPoint}
            variant="secondary"
            style={styles.addBtn}
          />
        </Card>

        {!loading && favorites.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.sectionHeader}>YOUR ACTIVE DESTINATIONS ({favorites.length})</Text>
            {favorites.map((fav) => (
              <View key={fav.id} style={styles.favoriteRow}>
                <View style={styles.favLeft}>
                  <Text style={styles.favIcon}>📍</Text>
                  <Text style={styles.favoriteLabel}>{fav.label}</Text>
                </View>
                <Pressable onPress={() => remove(fav.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  card: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeader: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginBottom: spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSubtle,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  chipText: {
    ...typography.captionBold,
    color: colors.inkMuted,
  },
  chipTextActive: {
    color: colors.accentInk,
  },
  addBtn: {
    marginTop: spacing.md,
  },
  favoriteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  favLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  favIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  favoriteLabel: {
    ...typography.bodyMedium,
    color: colors.ink,
    flex: 1,
  },
  removeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  removeText: {
    ...typography.captionBold,
    color: colors.statusFlagged,
  },
});

