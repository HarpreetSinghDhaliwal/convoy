import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Button, Card, Avatar, Badge } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { VerifiedBadge } from "@/modules/kyc";
import { useUserRatings } from "@/modules/ratings";
import { useFollowStatus } from "@/modules/follows";
import { supabase } from "@/lib/supabase/client";
import { usePublicProfile } from "../hooks/usePublicProfile";
import type { Trip } from "@/modules/trips/types";

export function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthSession();
  const { profile, loading: profileLoading } = usePublicProfile(id);
  const { stats, submitting: followSubmitting, toggleFollow } = useFollowStatus(id);
  const { ratings, aggregate } = useUserRatings(id, session?.user.id);
  const [hostedTrips, setHostedTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const isOwnProfile = session?.user.id === id;

  useEffect(() => {
    async function loadTrips() {
      if (!id) return;
      setLoadingTrips(true);
      try {
        const { data } = await supabase
          .from("trips")
          .select()
          .eq("lead_id", id)
          .is("cancelled_at", null)
          .order("depart_at", { ascending: true })
          .limit(5);

        if (data) {
          setHostedTrips(
            data.map((r: any) => ({
              id: r.id,
              leadId: r.lead_id,
              originLat: Number(r.origin_lat),
              originLng: Number(r.origin_lng),
              originLabel: r.origin_label,
              destinationLat: Number(r.destination_lat),
              destinationLng: Number(r.destination_lng),
              destination: r.destination,
              departAt: r.depart_at,
              isRoundTrip: Boolean(r.is_round_trip),
              returnDepartAt: r.return_depart_at ?? null,
              seatsTotal: r.seats_total ?? r.capacity ?? 4,
              pricePerSeat: Number(r.price_per_seat),
              womenOnly: Boolean(r.women_only),
              shortNote: r.short_note ?? null,
              description: r.description ?? null,
              inclusions: r.inclusions ?? null,
              links: r.links ?? null,
              published: r.published ?? true,
              cancelledAt: r.cancelled_at ?? null,
              createdAt: r.created_at,
            })),
          );
        }
      } catch {
        // non-blocking
      } finally {
        setLoadingTrips(false);
      }
    }
    loadTrips();
  }, [id]);

  if (profileLoading) return null;

  if (!profile) {
    return (
      <Screen showBack title="Roadtripper Profile">
        <View style={styles.errorWrap}>
          <Text style={styles.errorEmoji}>🔍</Text>
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorSub}>This traveler profile does not exist or may have been deactivated.</Text>
          <Button label="Back to Explore" onPress={() => router.push("/")} variant="secondary" style={{ marginTop: spacing.lg }} />
        </View>
      </Screen>
    );
  }

  const memberYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : new Date().getFullYear();

  return (
    <Screen showBack title="Roadtripper Profile">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Hero Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Avatar name={profile.name || "Convoy Traveler"} uri={profile.photoUrl} size="xl" />
            <View style={styles.heroInfo}>
              <Text style={styles.userName}>{profile.name || "Convoy Traveler"}</Text>
              <View style={styles.badgeRow}>
                <VerifiedBadge status={profile.kycStatus} />
                <Text style={styles.memberSinceText}>• Member since {memberYear}</Text>
              </View>
            </View>
          </View>

          {/* Bio text */}
          <Text style={styles.bioText}>
            {profile.bio || "Passionate roadtripper sharing epic scenic drives across India. Music enthusiast, safety-first carpooler."}
          </Text>

          {/* Social Stats & Follow Action */}
          <View style={styles.socialStatsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{aggregate.count > 0 ? `★ ${aggregate.average.toFixed(1)}` : "★ New"}</Text>
              <Text style={styles.statLabel}>{aggregate.count} Reviews</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.followActionWrap}>
              <Button
                label={stats.isFollowing ? "✓ Following" : "+ Follow Traveler"}
                onPress={toggleFollow}
                loading={followSubmitting}
                variant={stats.isFollowing ? "secondary" : "primary"}
                size="md"
                style={styles.followBtn}
              />
            </View>
          )}
        </Card>

        {/* Travel Vibe & Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>✨ Travel Persona & Preferences</Text>
          <View style={styles.chipsRow}>
            <View style={styles.vibeChip}>
              <Text style={styles.vibeChipText}>🚭 Non-Smoking Car</Text>
            </View>
            <View style={styles.vibeChip}>
              <Text style={styles.vibeChipText}>🎵 Roadtrip Beats / Aux</Text>
            </View>
            <View style={styles.vibeChip}>
              <Text style={styles.vibeChipText}>☕ Highway Dhaba Stops</Text>
            </View>
            <View style={styles.vibeChip}>
              <Text style={styles.vibeChipText}>🛡️ KYC ID Verified</Text>
            </View>
          </View>
        </Card>

        {/* Exchanged Reviews & Ratings */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>⭐ Exchanged Ratings & Reviews</Text>
              <Text style={styles.sectionSub}>Double-blind verified ratings from co-travelers</Text>
            </View>
            {aggregate.count > 0 && (
              <View style={styles.ratingScoreTag}>
                <Text style={styles.ratingScoreText}>★ {aggregate.average.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {ratings.length === 0 ? (
            <View style={styles.emptyReviewsBox}>
              <Text style={styles.emptyReviewsEmoji}>🌟</Text>
              <Text style={styles.emptyReviewsTitle}>No exchanged reviews yet</Text>
              <Text style={styles.emptyReviewsSub}>
                Reviews are revealed publicly once both travelers rate each other after a completed journey.
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {ratings.map((item) => (
                <View key={item.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Avatar name={item.raterName || "Traveler"} uri={item.raterPhotoUrl} size="sm" />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.raterName}>{item.raterName || "Co-Traveler"}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                    <View style={styles.starsRow}>
                      {Array.from({ length: item.score }).map((_, i) => (
                        <Text key={i} style={styles.starIcon}>★</Text>
                      ))}
                    </View>
                  </View>
                  {item.review && <Text style={styles.reviewComment}>{item.review}</Text>}
                  {item.isExchanged === false && (
                    <View style={styles.unexchangedTag}>
                      <Text style={styles.unexchangedText}>⏳ Awaiting co-traveler exchange review</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Hosted Journeys */}
        {hostedTrips.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🚗 Upcoming Journeys Hosted</Text>
            <View style={styles.tripsList}>
              {hostedTrips.map((trip) => (
                <Pressable
                  key={trip.id}
                  onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })}
                  style={({ pressed }) => [styles.tripItem, pressed && styles.tripItemPressed]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tripDest}>📍 {trip.originLabel} → {trip.destination}</Text>
                    <Text style={styles.tripDepart}>
                      📅 {new Date(trip.departAt).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.tripPrice}>₹{trip.pricePerSeat}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.md,
  },
  heroCard: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  heroInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  memberSinceText: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 12,
  },
  bioText: {
    ...typography.body,
    color: colors.inkMuted,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  socialStatsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    ...typography.h3,
    color: colors.ink,
  },
  statLabel: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.line,
  },
  followActionWrap: {
    marginTop: spacing.xs,
  },
  followBtn: {
    ...shadows.sm,
  },
  sectionCard: {
    padding: spacing.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  ratingScoreTag: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ratingScoreText: {
    ...typography.captionBold,
    color: colors.accent,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  vibeChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  vibeChipText: {
    ...typography.caption,
    color: colors.ink,
    fontWeight: "500",
  },
  emptyReviewsBox: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyReviewsEmoji: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  emptyReviewsTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 14,
  },
  emptyReviewsSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  reviewsList: {
    gap: spacing.md,
  },
  reviewItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  raterName: {
    ...typography.captionBold,
    color: colors.ink,
  },
  reviewDate: {
    ...typography.overline,
    color: colors.inkSubtle,
    fontSize: 10,
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  starIcon: {
    color: "#f59e0b",
    fontSize: 14,
  },
  reviewComment: {
    ...typography.body,
    color: colors.inkMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  unexchangedTag: {
    marginTop: 6,
    backgroundColor: colors.statusPendingLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  unexchangedText: {
    ...typography.caption,
    color: colors.statusPending,
    fontSize: 11,
  },
  tripsList: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tripItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tripItemPressed: {
    backgroundColor: colors.paperRaised,
  },
  tripDest: {
    ...typography.captionBold,
    color: colors.ink,
  },
  tripDepart: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 12,
    marginTop: 2,
  },
  tripPrice: {
    ...typography.h3,
    color: colors.accent,
  },
  errorWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  errorSub: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 280,
  },
});
