import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radius, spacing, typography } from "@/theme";
import { useOverlappingTrips } from "../hooks/useOverlappingTrips";

// Phase 05's actual differentiator (blueprint §01): only possible because
// route geometry, not just a destination name, is on record for both trips.
export function OverlappingTripsList({ tripId }: { tripId: string }) {
  const { trips, loading } = useOverlappingTrips(tripId);

  if (loading || trips.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Overlapping routes</Text>
      {trips.map((trip) => (
        <Text
          key={trip.tripId}
          style={styles.link}
          onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.tripId } })}
        >
          {trip.destination} · {new Date(trip.departAt).toLocaleDateString()} · ~
          {trip.distanceKm.toFixed(0)}km route
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.trust,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  title: { ...typography.caption, color: colors.trustInk, marginBottom: spacing.sm },
  link: { ...typography.body, color: colors.trust, marginBottom: spacing.xs, textDecorationLine: "underline" },
});
