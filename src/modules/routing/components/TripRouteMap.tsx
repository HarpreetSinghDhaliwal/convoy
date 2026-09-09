import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import type { GeocodeResult } from "../types";

export interface RouteMapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface TripRouteMapProps {
  origin?: RouteMapPoint | null;
  destination?: RouteMapPoint | null;
  checkpoints?: RouteMapPoint[];
  routeGeometry?: { type: string; coordinates: [number, number][] } | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  height?: number;
  interactive?: boolean;
  activePinMode?: "origin" | "destination";
  onActivePinModeChange?: (mode: "origin" | "destination") => void;
  onPointChange?: (mode: "origin" | "destination", point: GeocodeResult) => void;
}

export function TripRouteMap({
  origin,
  destination,
  checkpoints = [],
  distanceKm,
  durationMin,
  height = 240,
}: TripRouteMapProps) {
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Journey Route</Text>
        {distanceKm ? (
          <Text style={styles.stats}>
            ~{Math.round(distanceKm)} km {durationMin ? `· ${(durationMin / 60).toFixed(1)} hrs` : ""}
          </Text>
        ) : null}
      </View>

      <View style={styles.routeTimeline}>
        <View style={styles.pointRow}>
          <Text style={styles.icon}>📍</Text>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Origin</Text>
            <Text style={styles.value} numberOfLines={1}>
              {origin?.label || (origin ? `${origin.lat.toFixed(3)}, ${origin.lng.toFixed(3)}` : "Not set")}
            </Text>
          </View>
        </View>

        {checkpoints.map((cp, idx) => (
          <View key={idx} style={styles.pointRow}>
            <Text style={styles.icon}>🟡</Text>
            <View style={styles.textWrap}>
              <Text style={styles.label}>Stop {idx + 1}</Text>
              <Text style={styles.value} numberOfLines={1}>
                {cp.label || `${cp.lat.toFixed(3)}, ${cp.lng.toFixed(3)}`}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.pointRow}>
          <Text style={styles.icon}>🎯</Text>
          <View style={styles.textWrap}>
            <Text style={styles.label}>Destination</Text>
            <Text style={styles.value} numberOfLines={1}>
              {destination?.label ||
                (destination ? `${destination.lat.toFixed(3)}, ${destination.lng.toFixed(3)}` : "Not set")}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.captionBold,
    color: colors.ink,
  },
  stats: {
    ...typography.captionBold,
    color: colors.accent,
  },
  routeTimeline: {
    gap: spacing.xs,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    ...typography.overline,
    color: colors.inkSubtle,
    fontSize: 9.5,
  },
  value: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 12,
  },
});
