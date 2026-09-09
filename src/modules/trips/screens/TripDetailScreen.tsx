import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Button, Card, Badge, Avatar } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useKycStatus } from "@/modules/kyc";
import { usePendingRatings } from "@/modules/ratings";
import { ReportDialog } from "@/modules/safety";
import { PickupPointManager, PickupPointSelector } from "@/modules/pickup-points";
import { ContactPhoneReveal } from "@/modules/profile";
import { OverlappingTripsList } from "@/modules/routing";
import { useTripDetail } from "../hooks/useTripDetail";
import { useMyMemberships } from "../hooks/useMyMemberships";
import { useCheckpoints } from "../hooks/useCheckpoints";
import { cancelTrip, requestToJoin } from "../services/tripService";

export function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthSession();
  const { isVerified } = useKycStatus();
  const { hasPending: hasPendingRatings } = usePendingRatings();
  const { trip, seatsLeft, loading, error, refresh } = useTripDetail(id);
  const { memberships } = useMyMemberships();
  const { checkpoints } = useCheckpoints(trip?.id);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | undefined>();
  const [requested, setRequested] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);

  const isLead = useMemo(
    () => !!(trip && session && trip.leadId === session.user.id),
    [trip, session],
  );

  const hasChatAccess =
    isLead || memberships.some((m) => m.tripId === trip?.id && m.status === "approved");

  async function handleRequestToJoin() {
    if (!trip || !session?.user.id) return;
    if (hasPendingRatings) {
      setRequestError("You have a rating outstanding from a past trip — rate it before joining a new one.");
      return;
    }
    setRequesting(true);
    setRequestError(undefined);
    try {
      let requestedLat: number | undefined;
      let requestedLng: number | undefined;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status === "granted") {
          const position = await Location.getCurrentPositionAsync({});
          requestedLat = position.coords.latitude;
          requestedLng = position.coords.longitude;
        }
      } catch {
        // proceed without location
      }

      await requestToJoin(trip.id, session.user.id, {
        pickupPointId: selectedPickupId ?? undefined,
        requestedLat,
        requestedLng,
      });
      setRequested(true);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Couldn't send the request — try again");
    } finally {
      setRequesting(false);
    }
  }

  async function handleCancel() {
    if (!trip) return;
    await cancelTrip(trip.id);
    refresh();
  }

  if (loading) return null;
  if (error || !trip) {
    return (
      <Screen showBack title="Trip Details">
        <Text style={styles.errorText}>{error ?? "Trip not found"}</Text>
      </Screen>
    );
  }

  const departDate = new Date(trip.departAt);
  const formattedDepart = departDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = departDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Screen showBack title="Trip Overview">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Destination Card */}
        <Card style={styles.heroCard}>
          <View style={styles.heroBadgesRow}>
            {trip.womenOnly && <Badge label="Women-Only" variant="trust" icon={<Text>🛡️</Text>} />}
            {trip.isRoundTrip && <Badge label="Round Trip" variant="gold" icon={<Text>🔄</Text>} />}
            <Badge
              label={`${seatsLeft} of ${trip.seatsTotal} seats left`}
              variant={seatsLeft > 0 ? "verified" : "flagged"}
            />
          </View>

          <Text style={styles.heroDestination}>{trip.destination}</Text>

          <View style={styles.heroTimeRow}>
            <Text style={styles.timeIcon}>🕒</Text>
            <Text style={styles.heroTimeText}>
              Departure: {formattedDepart} at {formattedTime}
            </Text>
          </View>

          {trip.isRoundTrip && trip.returnDepartAt ? (
            <View style={styles.heroTimeRow}>
              <Text style={styles.timeIcon}>↩️</Text>
              <Text style={styles.heroTimeText}>
                Return: {new Date(trip.returnDepartAt).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          ) : null}

          <View style={styles.heroPriceRow}>
            <View>
              <Text style={styles.priceMicro}>COST CONTRIBUTION</Text>
              <View style={styles.priceFlex}>
                <Text style={styles.priceSymbol}>₹</Text>
                <Text style={styles.priceBig}>{trip.pricePerSeat}</Text>
                <Text style={styles.priceSeat}>/ seat</Text>
              </View>
            </View>
            <Text style={styles.fuelShareText}>Shared fuel & toll split</Text>
          </View>
        </Card>

        {/* Route Details Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Journey Route</Text>

          <View style={styles.timelineRow}>
            <View style={styles.timelineIndicator}>
              <View style={styles.timelineOriginDot} />
              <View style={styles.timelineLine} />
              {checkpoints.map((_, i) => (
                <View key={i} style={styles.timelineWaypointWrap}>
                  <View style={styles.timelineWaypointDot} />
                  <View style={styles.timelineLine} />
                </View>
              ))}
              <View style={styles.timelineDestPin}>
                <Text style={styles.destPinEmoji}>📍</Text>
              </View>
            </View>

            <View style={styles.timelineLabelsCol}>
              <View style={styles.timelineStop}>
                <Text style={styles.stopType}>PICKUP ORIGIN</Text>
                <Text style={styles.stopName}>{trip.originLabel}</Text>
              </View>

              {checkpoints.map((cp, idx) => (
                <View key={idx} style={styles.timelineStop}>
                  <Text style={styles.stopType}>CHECKPOINT {idx + 1}</Text>
                  <Text style={styles.stopName}>{cp.label}</Text>
                </View>
              ))}

              <View style={styles.timelineStop}>
                <Text style={styles.stopType}>DESTINATION</Text>
                <Text style={styles.stopNameDestination}>{trip.destination}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Notes & Description Card */}
        {(trip.shortNote || trip.description) && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Host Notes & Plan</Text>
            {trip.shortNote ? (
              <View style={styles.noteCallout}>
                <Text style={styles.noteCalloutQuote}>“</Text>
                <Text style={styles.noteCalloutText}>{trip.shortNote}</Text>
              </View>
            ) : null}
            {trip.description ? (
              <Text style={styles.descriptionBody}>{trip.description}</Text>
            ) : null}
          </Card>
        )}

        {/* Inclusions & Amenities Card */}
        {trip.inclusions && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Trip Inclusions</Text>
            {trip.inclusions.included && trip.inclusions.included.length > 0 && (
              <View style={styles.inclusionsSection}>
                <Text style={styles.inclusionsHeading}>✅ Included</Text>
                <View style={styles.chipsRow}>
                  {trip.inclusions.included.map((item, i) => (
                    <View key={i} style={styles.includedChip}>
                      <Text style={styles.includedChipText}>✓ {item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {trip.inclusions.excluded && trip.inclusions.excluded.length > 0 && (
              <View style={styles.inclusionsSection}>
                <Text style={styles.inclusionsHeading}>❌ Not Included</Text>
                <View style={styles.chipsRow}>
                  {trip.inclusions.excluded.map((item, i) => (
                    <View key={i} style={styles.excludedChip}>
                      <Text style={styles.excludedChipText}>✕ {item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Overlapping Trips Discovery */}
        <OverlappingTripsList tripId={trip.id} />

        {requestError ? <Text style={styles.errorText}>{requestError}</Text> : null}

        {/* Action Controls & Chat Access */}
        <Card style={styles.actionCard}>
          {hasChatAccess && (
            <View style={styles.chatSection}>
              {!isLead && <ContactPhoneReveal tripId={trip.id} targetUserId={trip.leadId} />}
              <Button
                label="💬 Open Group Chat"
                onPress={() => router.push({ pathname: "/trips/[id]/chat", params: { id: trip.id } })}
                variant="primary"
                size="lg"
                style={styles.actionBtn}
              />
            </View>
          )}

          {isLead ? (
            <View style={styles.leadControls}>
              <PickupPointManager tripId={trip.id} />
              <Button
                label="👥 Manage Join Requests"
                onPress={() => router.push({ pathname: "/trips/[id]/requests", params: { id: trip.id } })}
                variant="secondary"
                size="lg"
                style={styles.actionBtn}
              />
              {!trip.cancelledAt && (
                <Button
                  label="Cancel Trip"
                  onPress={handleCancel}
                  variant="danger"
                  size="md"
                  style={styles.actionBtn}
                />
              )}
            </View>
          ) : requested ? (
            <View style={styles.pendingBox}>
              <Text style={styles.pendingIcon}>⏳</Text>
              <Text style={styles.pendingTitle}>Request Sent</Text>
              <Text style={styles.pendingDesc}>Waiting for the trip host to review and approve your join request.</Text>
            </View>
          ) : (
            <View style={styles.joinControls}>
              <PickupPointSelector
                tripId={trip.id}
                selectedId={selectedPickupId}
                onSelect={setSelectedPickupId}
              />
              {!isVerified && (
                <View style={styles.nudgeBox}>
                  <Text style={styles.nudgeIcon}>💡</Text>
                  <Text style={styles.nudgeText}>
                    Verified travelers get approved much faster. You can still request without verification.
                  </Text>
                </View>
              )}
              <Button
                label={seatsLeft > 0 ? "Request to Join Trip" : "Trip Full (0 Seats Left)"}
                onPress={handleRequestToJoin}
                loading={requesting}
                disabled={seatsLeft <= 0}
                variant="primary"
                size="lg"
                style={styles.joinBtn}
              />
            </View>
          )}

          {!isLead && (
            <View style={styles.reportWrap}>
              <Button
                label="🚩 Report this trip"
                onPress={() => setReportOpen(false || true)}
                variant="ghost"
                size="sm"
              />
            </View>
          )}
        </Card>
      </ScrollView>

      <ReportDialog
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedId={trip.leadId}
        tripId={trip.id}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  heroBadgesRow: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  heroDestination: {
    ...typography.hero,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  heroTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
  },
  timeIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  heroTimeText: {
    ...typography.bodyMedium,
    color: colors.inkMuted,
  },
  heroPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  priceMicro: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginBottom: 2,
  },
  priceFlex: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceSymbol: {
    ...typography.h2,
    color: colors.accent,
    fontWeight: "800",
  },
  priceBig: {
    ...typography.hero,
    color: colors.accent,
    fontWeight: "900",
  },
  priceSeat: {
    ...typography.body,
    color: colors.inkSoft,
    marginLeft: 4,
  },
  fuelShareText: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  sectionCard: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  timelineRow: {
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  timelineIndicator: {
    alignItems: "center",
    marginRight: spacing.lg,
    paddingTop: 4,
  },
  timelineOriginDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.trust,
    borderWidth: 2,
    borderColor: colors.paper,
    ...shadows.sm,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.line,
    marginVertical: 2,
  },
  timelineWaypointWrap: {
    alignItems: "center",
  },
  timelineWaypointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.inkSoft,
  },
  timelineDestPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  destPinEmoji: {
    fontSize: 16,
    lineHeight: 18,
  },
  timelineLabelsCol: {
    flex: 1,
    justifyContent: "space-between",
  },
  timelineStop: {
    marginBottom: spacing.md,
  },
  stopType: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginBottom: 2,
  },
  stopName: {
    ...typography.body,
    color: colors.inkMuted,
  },
  stopNameDestination: {
    ...typography.h3,
    color: colors.ink,
  },
  noteCallout: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  noteCalloutQuote: {
    ...typography.h2,
    color: colors.accent,
    lineHeight: 18,
    marginRight: 6,
  },
  noteCalloutText: {
    ...typography.body,
    color: colors.inkMuted,
    fontStyle: "italic",
    flex: 1,
  },
  descriptionBody: {
    ...typography.bodyLarge,
    color: colors.inkMuted,
    lineHeight: 24,
  },
  inclusionsSection: {
    marginBottom: spacing.md,
  },
  inclusionsHeading: {
    ...typography.captionBold,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  includedChip: {
    backgroundColor: colors.statusVerifiedLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(21, 128, 61, 0.2)",
  },
  includedChipText: {
    ...typography.captionBold,
    color: colors.statusVerified,
  },
  excludedChip: {
    backgroundColor: colors.statusFlaggedLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.2)",
  },
  excludedChipText: {
    ...typography.captionBold,
    color: colors.statusFlagged,
  },
  actionCard: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  chatSection: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  leadControls: {
    gap: spacing.md,
  },
  joinControls: {
    gap: spacing.md,
  },
  actionBtn: {
    marginVertical: spacing.xs,
  },
  joinBtn: {
    ...shadows.glow,
  },
  pendingBox: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.statusPendingLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  pendingIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  pendingTitle: {
    ...typography.h3,
    color: colors.statusPending,
    marginBottom: 4,
  },
  pendingDesc: {
    ...typography.caption,
    color: colors.inkMuted,
    textAlign: "center",
  },
  nudgeBox: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  nudgeIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  nudgeText: {
    ...typography.caption,
    color: colors.inkMuted,
    flex: 1,
  },
  reportWrap: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  errorText: {
    ...typography.caption,
    color: colors.statusFlagged,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
