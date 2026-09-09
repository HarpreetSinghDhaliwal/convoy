import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, TextField } from "@/components";
import { colors, radius, spacing, typography } from "@/theme";
import { MapPicker, suggestMeetingPoint, reverseGeocode } from "@/modules/routing";
import type { GeocodeResult } from "@/modules/routing";
import { getRequesterLocations } from "@/modules/trips";
import { usePickupPoints } from "../hooks/usePickupPoints";

export function PickupPointManager({ tripId }: { tripId: string }) {
  const { points, loading, add, remove } = usePickupPoints(tripId);
  const [label, setLabel] = useState("");
  const [picked, setPicked] = useState<GeocodeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | undefined>();

  async function handleAdd() {
    if (!label.trim() || !picked) return;
    setSubmitting(true);
    try {
      await add(label.trim(), picked.lat, picked.lng);
      setLabel("");
      setPicked(null);
    } finally {
      setSubmitting(false);
    }
  }

  // Phase 05: centroid-based suggestion (not a true detour optimizer — see
  // routing/services/clusteringService.ts) from whoever submitted a rough
  // location when requesting to join.
  async function handleSuggest() {
    setSuggesting(true);
    setSuggestError(undefined);
    try {
      const locations = await getRequesterLocations(tripId);
      const centroid = suggestMeetingPoint(locations);
      if (!centroid) {
        setSuggestError("No requester locations submitted yet — nothing to suggest from.");
        return;
      }
      const placeLabel = await reverseGeocode(centroid.lat, centroid.lng);
      setPicked({ ...centroid, label: placeLabel });
      setLabel(placeLabel);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Couldn't suggest a point");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <View>
      <Text style={styles.title}>Pickup points</Text>
      {!loading &&
        points.map((point) => (
          <View key={point.id} style={styles.row}>
            <Text style={styles.label}>{point.label}</Text>
            <Text style={styles.remove} onPress={() => remove(point.id)}>
              Remove
            </Text>
          </View>
        ))}

      <Button
        label="Suggest a meeting point from requesters"
        onPress={handleSuggest}
        variant="secondary"
        loading={suggesting}
      />
      {suggestError && <Text style={styles.error}>{suggestError}</Text>}

      <TextField label="Landmark name" placeholder="ISBT Sector 43" value={label} onChangeText={setLabel} />
      <MapPicker value={picked} onChange={setPicked} />
      <Button label="Add pickup point" onPress={handleAdd} loading={submitting} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.ink, marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  label: { ...typography.body, color: colors.ink },
  remove: { ...typography.caption, color: colors.statusFlagged },
  error: { ...typography.caption, color: colors.statusFlagged, marginBottom: spacing.sm },
});
