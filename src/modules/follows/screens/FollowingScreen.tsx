import { FlatList, StyleSheet, Text, View } from "react-native";
import { Screen, EmptyState, Card } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { ProfileSummary } from "@/modules/profile";
import { useFollowing } from "../hooks/useFollowing";

export function FollowingScreen() {
  const { following, loading } = useFollowing();

  return (
    <Screen showBack title="Following Hosts" showNavBar>
      <View style={styles.header}>
        <Text style={styles.title}>Following Hosts</Text>
        <Text style={styles.subtitle}>
          Stay updated when your favorite roadtrip companions and verified leads create new journeys.
        </Text>
      </View>

      <FlatList
        data={following}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <ProfileSummary userId={item.followedId} />
          </Card>
        )}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="👥"
              title="No hosts followed yet"
              description="After completing journeys with verified drivers and roadtrippers, follow them to get notified of their future convoys!"
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  row: {
    padding: spacing.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
});

