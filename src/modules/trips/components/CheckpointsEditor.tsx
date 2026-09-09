import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { MapPicker } from "@/modules/routing";
import type { GeocodeResult } from "@/modules/routing";

export interface DraftCheckpoint {
  label: string;
  lat: number;
  lng: number;
}

interface CheckpointsEditorProps {
  value: DraftCheckpoint[];
  onChange: (next: DraftCheckpoint[]) => void;
}

// Route stops between origin and destination — e.g. Delhi -> Chandigarh
// (stop) -> Manali. Same for every rider on the trip, set once here at
// creation time; not the same thing as a pickup point (a rider's own
// boarding location, added later in PickupPointManager).
export function CheckpointsEditor({ value, onChange }: CheckpointsEditorProps) {
  const [picked, setPicked] = useState<GeocodeResult | null>(null);
  const [adding, setAdding] = useState(false);

  function handleAdd() {
    if (!picked) return;
    onChange([...value, { label: picked.label, lat: picked.lat, lng: picked.lng }]);
    setPicked(null);
    setAdding(false);
  }

  function handleRemove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stops along the way (optional)</Text>

      {value.map((cp, i) => (
        <View key={`${cp.label}-${i}`} style={styles.row}>
          <Text style={styles.stopIndex}>{i + 1}</Text>
          <Text style={styles.stopLabel} numberOfLines={1}>
            {cp.label}
          </Text>
          <Pressable onPress={() => handleRemove(i)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {adding ? (
        <View style={styles.addPanel}>
          <MapPicker value={picked} onChange={setPicked} />
          <View style={styles.addPanelButtons}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setAdding(false);
                setPicked(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.confirmButton, !picked && styles.confirmButtonDisabled]} onPress={handleAdd} disabled={!picked}>
              <Text style={styles.confirmButtonText}>Add this stop</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addButton} onPress={() => setAdding(true)}>
          <Text style={styles.addButtonText}>+ Add a stop</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  title: { ...typography.bodyMedium, color: colors.ink, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  stopIndex: { ...typography.caption, color: colors.accentInk, fontWeight: "700" },
  stopLabel: { ...typography.caption, color: colors.ink, flex: 1 },
  remove: { ...typography.caption, color: colors.statusFlagged },
  addButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.paperRaised,
  },
  addButtonText: { ...typography.caption, color: colors.inkSoft },
  addPanel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  addPanelButtons: { flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" },
  cancelButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelButtonText: { ...typography.caption, color: colors.inkSoft },
  confirmButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  confirmButtonDisabled: { opacity: 0.5 },
  confirmButtonText: { ...typography.caption, color: colors.paperRaised },
});
