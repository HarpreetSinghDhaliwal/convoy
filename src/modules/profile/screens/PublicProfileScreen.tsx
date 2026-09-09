import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components";
import { colors, spacing, typography } from "@/theme";
import { VerifiedBadge } from "@/modules/kyc";
import { RatingSummary } from "@/modules/ratings";
import { usePublicProfile } from "../hooks/usePublicProfile";

export function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, loading } = usePublicProfile(id);

  if (loading) return null;
  if (!profile) {
    return (
      <Screen>
        <Text style={styles.error}>Profile not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.name}>{profile.name || "Unnamed traveler"}</Text>
      <VerifiedBadge status={profile.kycStatus} />
      <RatingSummary userId={profile.id} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { ...typography.display, color: colors.ink, marginBottom: spacing.md },
  error: { ...typography.body, color: colors.inkSoft },
});
