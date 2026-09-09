import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { usePickupPoints } from "../hooks/usePickupPoints";

interface PickupPointSelectorProps {
  tripId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PickupPointSelector({ tripId, selectedId, onSelect }: PickupPointSelectorProps) {
  const { points, loading } = usePickupPoints(tripId);

  if (loading || points.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your pickup point</Text>
      {points.map((point) => (
        <Pressable
          key={point.id}
          style={[styles.option, selectedId === point.id && styles.optionSelected]}
          onPress={() => onSelect(point.id)}
        >
          <Text style={styles.label}>{point.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  title: { ...typography.caption, color: colors.inkSoft, marginBottom: spacing.sm },
  option: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionSelected: { borderColor: colors.accent, backgroundColor: colors.paperRaised },
  label: { ...typography.body, color: colors.ink },
});
