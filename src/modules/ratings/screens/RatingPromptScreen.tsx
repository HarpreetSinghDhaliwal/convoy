import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, Button, Card, EmptyState } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { FollowButton } from "@/modules/follows";
import { ProfileSummary } from "@/modules/profile";
import { usePendingRatings } from "../hooks/usePendingRatings";

const SCORES = [1, 2, 3, 4, 5];

export function RatingPromptScreen() {
  const { pending, loading, rate } = usePendingRatings();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  function keyFor(tripId: string, rateeId: string) {
    return `${tripId}:${rateeId}`;
  }

  async function handleSubmit(tripId: string, rateeId: string) {
    const key = keyFor(tripId, rateeId);
    const score = scores[key];
    if (!score) return;
    setSubmittingKey(key);
    try {
      await rate(tripId, rateeId, score, reviews[key]?.trim() || undefined);
    } finally {
      setSubmittingKey(null);
    }
  }

  if (loading) return null;

  return (
    <Screen showBack title="Trip Ratings" showNavBar>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Rate Past Journeys</Text>
          <Text style={styles.subtitle}>
            Your ratings help maintain trust and safety for everyone in the Convoy roadtrip community.
          </Text>
        </View>

        {pending.length === 0 && (
          <EmptyState
            icon="⭐"
            title="All caught up!"
            description="You have no pending trip ratings. Ratings for completed journeys will show up here."
          />
        )}

        {pending.map(({ tripId, rateeId }) => {
          const key = keyFor(tripId, rateeId);
          return (
            <Card key={key} style={styles.card}>
              <View style={styles.rateeRow}>
                <ProfileSummary userId={rateeId} />
              </View>

              <Text style={styles.rateLabel}>How was your journey together?</Text>
              <View style={styles.scoreRow}>
                {SCORES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setScores((prev) => ({ ...prev, [key]: s }))}
                    style={styles.starTouch}
                  >
                    <Text style={[styles.star, (scores[key] || 0) >= s && styles.starSelected]}>★</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder="Share a comment about this traveler (optional)"
                placeholderTextColor={colors.inkSubtle}
                value={reviews[key] ?? ""}
                onChangeText={(text) => setReviews((prev) => ({ ...prev, [key]: text }))}
                multiline
              />

              <Button
                label="Submit Rating"
                onPress={() => handleSubmit(tripId, rateeId)}
                loading={submittingKey === key}
                disabled={!scores[key]}
                size="lg"
                style={styles.submitBtn}
              />

              <View style={styles.followWrap}>
                <FollowButton userId={rateeId} viaTripId={tripId} />
              </View>
            </Card>
          );
        })}
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
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.lineLight,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  rateeRow: {
    marginBottom: spacing.md,
  },
  rateLabel: {
    ...typography.captionBold,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  scoreRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  starTouch: {
    padding: 2,
  },
  star: {
    fontSize: 32,
    color: colors.line,
  },
  starSelected: {
    color: colors.gold,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    minHeight: 64,
    color: colors.ink,
    marginBottom: spacing.md,
    ...typography.body,
  },
  submitBtn: {
    marginBottom: spacing.sm,
  },
  followWrap: {
    marginTop: spacing.xs,
  },
});

