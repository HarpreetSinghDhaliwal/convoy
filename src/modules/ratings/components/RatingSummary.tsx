import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { useUserRatings } from "../hooks/useUserRatings";

export function RatingSummary({ userId }: { userId: string }) {
  const { loading, aggregate } = useUserRatings(userId);

  if (loading) return null;
  if (aggregate.count === 0) {
    return <Text style={styles.empty}>No ratings yet</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.score}>★ {aggregate.average.toFixed(1)}</Text>
      <Text style={styles.count}>({aggregate.count} trip{aggregate.count === 1 ? "" : "s"})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "baseline", gap: spacing.xs },
  score: { ...typography.bodyMedium, color: colors.accentInk },
  count: { ...typography.caption, color: colors.inkSoft },
  empty: { ...typography.caption, color: colors.inkSoft },
});
