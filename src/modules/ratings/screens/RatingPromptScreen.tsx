import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, Button, Card, EmptyState, Avatar } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { FollowButton } from "@/modules/follows";
import { ProfileSummary } from "@/modules/profile";
import { usePendingRatings } from "../hooks/usePendingRatings";
import { useUserRatings } from "../hooks/useUserRatings";
import { getRatingsGivenByUser } from "../services/ratingService";
import type { Rating } from "../types";

const SCORES = [1, 2, 3, 4, 5];

export function RatingPromptScreen() {
  const { session } = useAuthSession();
  const { pending, loading: pendingLoading, rate } = usePendingRatings();
  const { ratings: receivedRatings, aggregate, loading: receivedLoading } = useUserRatings(
    session?.user.id,
    session?.user.id,
  );
  const [givenRatings, setGivenRatings] = useState<Rating[]>([]);
  const [loadingGiven, setLoadingGiven] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "received" | "given">("pending");

  const [scores, setScores] = useState<Record<string, number>>({});
  const [reviews, setReviews] = useState<Record<string, string>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  useEffect(() => {
    async function loadGiven() {
      if (!session?.user.id) return;
      setLoadingGiven(true);
      try {
        const data = await getRatingsGivenByUser(session.user.id);
        setGivenRatings(data);
      } catch {
        setGivenRatings([]);
      } finally {
        setLoadingGiven(false);
      }
    }
    loadGiven();
  }, [session?.user.id]);

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

  return (
    <Screen showBack title="Trip Ratings & Reviews" showNavBar>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Top Tab Bar */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab("pending")}
            style={[styles.tabBtn, activeTab === "pending" && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === "pending" && styles.tabLabelActive]}>
              Pending ({pending.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("received")}
            style={[styles.tabBtn, activeTab === "received" && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === "received" && styles.tabLabelActive]}>
              Received ({receivedRatings.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("given")}
            style={[styles.tabBtn, activeTab === "given" && styles.tabBtnActive]}
          >
            <Text style={[styles.tabLabel, activeTab === "given" && styles.tabLabelActive]}>
              Given ({givenRatings.length})
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Pending Ratings */}
        {activeTab === "pending" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Rate Past Journeys</Text>
              <Text style={styles.subtitle}>
                Under our double-blind review policy, your rating will publish publicly once both travelers rate each other.
              </Text>
            </View>

            {pending.length === 0 ? (
              <EmptyState
                icon="⭐"
                title="All caught up!"
                description="You have no pending ratings. Complete a roadtrip to review your co-travelers."
              />
            ) : (
              pending.map(({ tripId, rateeId }) => {
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
                          <Text
                            style={[
                              styles.star,
                              (scores[key] || 0) >= s && styles.starSelected,
                            ]}
                          >
                            ★
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <TextInput
                      style={styles.reviewInput}
                      placeholder="Share a comment about this traveler (optional)"
                      placeholderTextColor={colors.inkSubtle}
                      value={reviews[key] ?? ""}
                      onChangeText={(text) =>
                        setReviews((prev) => ({ ...prev, [key]: text }))
                      }
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
              })
            )}
          </>
        )}

        {/* Tab 2: Reviews Received */}
        {activeTab === "received" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Reviews About You</Text>
              <Text style={styles.subtitle}>
                {aggregate.count > 0
                  ? `Overall Average: ★ ${aggregate.average.toFixed(1)} based on ${aggregate.count} exchanged reviews.`
                  : "All feedback received from your completed roadtrips."}
              </Text>
            </View>

            {receivedRatings.length === 0 ? (
              <EmptyState
                icon="🌟"
                title="No reviews received yet"
                description="When co-travelers submit feedback on your journeys, it will appear here."
              />
            ) : (
              <View style={styles.reviewsList}>
                {receivedRatings.map((item) => (
                  <Card key={item.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Avatar name={item.raterName || "Traveler"} uri={item.raterPhotoUrl} size="md" />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.raterName}>{item.raterName || "Co-Traveler"}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                      <View style={styles.starsRow}>
                        {Array.from({ length: item.score }).map((_, i) => (
                          <Text key={i} style={styles.starSmall}>★</Text>
                        ))}
                      </View>
                    </View>

                    {item.review ? (
                      <Text style={styles.reviewBody}>{item.review}</Text>
                    ) : (
                      <Text style={styles.reviewNoComment}>No written comment left</Text>
                    )}

                    <View style={styles.exchangeBadgeRow}>
                      {item.isExchanged ? (
                        <View style={styles.exchangedBadge}>
                          <Text style={styles.exchangedBadgeText}>✓ Public Exchanged Review</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingExchangeBadge}>
                          <Text style={styles.pendingExchangeText}>
                            ⏳ Awaiting your review on co-traveler to publish publicly
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}

        {/* Tab 3: Reviews Given */}
        {activeTab === "given" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Reviews You Submitted</Text>
              <Text style={styles.subtitle}>
                Feedback and star ratings you provided for fellow drivers and passengers.
              </Text>
            </View>

            {givenRatings.length === 0 ? (
              <EmptyState
                icon="✍️"
                title="No ratings submitted yet"
                description="Ratings you submit for other travelers will appear here."
              />
            ) : (
              <View style={styles.reviewsList}>
                {givenRatings.map((item) => (
                  <Card key={item.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Avatar name={item.raterName || "Traveler"} uri={item.raterPhotoUrl} size="md" />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.raterName}>To: {item.raterName || "Co-Traveler"}</Text>
                        <Text style={styles.reviewDate}>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </View>
                      <View style={styles.starsRow}>
                        {Array.from({ length: item.score }).map((_, i) => (
                          <Text key={i} style={styles.starSmall}>★</Text>
                        ))}
                      </View>
                    </View>

                    {item.review ? (
                      <Text style={styles.reviewBody}>{item.review}</Text>
                    ) : (
                      <Text style={styles.reviewNoComment}>No written comment</Text>
                    )}
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingBottom: spacing.xxxl * 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  tabBtnActive: {
    backgroundColor: colors.paper,
    ...shadows.sm,
  },
  tabLabel: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 12.5,
  },
  tabLabelActive: {
    color: colors.ink,
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
  reviewsList: {
    gap: spacing.md,
  },
  reviewCard: {
    padding: spacing.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  raterName: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 14,
  },
  reviewDate: {
    ...typography.overline,
    color: colors.inkSubtle,
    fontSize: 10,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  starSmall: {
    fontSize: 14,
    color: "#f59e0b",
  },
  reviewBody: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 20,
    fontSize: 13.5,
  },
  reviewNoComment: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontStyle: "italic",
  },
  exchangeBadgeRow: {
    marginTop: spacing.sm,
  },
  exchangedBadge: {
    backgroundColor: colors.statusVerifiedLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  exchangedBadgeText: {
    ...typography.captionBold,
    color: colors.statusVerified,
    fontSize: 11,
  },
  pendingExchangeBadge: {
    backgroundColor: colors.statusPendingLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  pendingExchangeText: {
    ...typography.caption,
    color: colors.statusPending,
    fontSize: 11,
  },
});
