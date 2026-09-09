import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Button, Card, Badge, Avatar, Stepper } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useKycStatus } from "@/modules/kyc";
import { usePendingRatings } from "@/modules/ratings";
import { ReportDialog } from "@/modules/safety";
import { PickupPointManager, PickupPointSelector } from "@/modules/pickup-points";
import { ContactPhoneReveal } from "@/modules/profile";
import { OverlappingTripsList, TripRouteMap } from "@/modules/routing";
import { useTripDetail } from "../hooks/useTripDetail";
import { useMyMemberships } from "../hooks/useMyMemberships";
import { useCheckpoints } from "../hooks/useCheckpoints";
import {
  cancelTripWithReason,
  leaveTripWithReason,
  requestToJoin,
  withdrawRequest,
} from "../services/tripService";
import { TripCancellationModal } from "../components/TripCancellationModal";
import { ProfileSummary } from "@/modules/profile";
import { supabase } from "@/lib/supabase/client";

export function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuthSession();
  const { isVerified } = useKycStatus();
  const { hasPending: hasPendingRatings } = usePendingRatings();
  const { trip, seatsLeft, loading, error, refresh } = useTripDetail(id);
  const { memberships, refresh: refreshMemberships } = useMyMemberships();
  const { checkpoints } = useCheckpoints(trip?.id);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | undefined>();
  const [requested, setRequested] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);

  // Host's approved passengers for direct 1-on-1 chats
  const [approvedPassengers, setApprovedPassengers] = useState<
    Array<{ id: string; name: string; photoUrl?: string; seats: number }>
  >([]);

  const isLead = useMemo(
    () => !!(trip && session && trip.leadId === session.user.id),
    [trip, session],
  );

  const myMembership = useMemo(
    () => memberships.find((m) => m.tripId === trip?.id),
    [memberships, trip?.id],
  );

  const isApproved = myMembership?.status === "approved";
  const isPending = myMembership?.status === "requested" || requested;
  const isDeclined = myMembership?.status === "declined";

  const hasChatAccess = isLead || isApproved;

  // Load approved passengers when Host views the trip
  useMemo(() => {
    async function loadApprovedPassengers() {
      if (!trip?.id || !isLead) return;
      const { data: memberRows } = await supabase
        .from("trip_members")
        .select("user_id, seats_requested")
        .eq("trip_id", trip.id)
        .eq("status", "approved");

      if (!memberRows || memberRows.length === 0) {
        setApprovedPassengers([]);
        return;
      }

      const userIds = memberRows.map((r) => r.user_id as string);
      const { data: users } = await supabase
        .from("users")
        .select("id, name, photo_url")
        .in("id", userIds);

      const usersMap = new Map((users || []).map((u) => [u.id, u]));
      const list = memberRows.map((r) => {
        const u = usersMap.get(r.user_id);
        return {
          id: r.user_id,
          name: u?.name || "Passenger",
          photoUrl: u?.photo_url,
          seats: Number(r.seats_requested) || 1,
        };
      });
      setApprovedPassengers(list);
    }
    loadApprovedPassengers();
  }, [trip?.id, isLead]);

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
        seatsRequested,
        requestedLat,
        requestedLng,
      });
      setRequested(true);
      refreshMemberships();
      refresh();
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Couldn't send the request — try again");
    } finally {
      setRequesting(false);
    }
  }

  async function handleWithdraw() {
    if (!myMembership?.id) return;
    try {
      await withdrawRequest(myMembership.id);
      setRequested(false);
      refreshMemberships();
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleConfirmCancellation(category: string, note: string) {
    if (!trip || !session?.user.id) return;
    if (isLead) {
      await cancelTripWithReason(trip.id, session.user.id, category, note);
    } else if (myMembership?.id) {
      await leaveTripWithReason(myMembership.id, session.user.id, trip.id, category, note);
    }
    setRequested(false);
    refreshMemberships();
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

        {/* Host Profile Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>👑 Trip Host & Driver</Text>
          <ProfileSummary userId={trip.leadId} />
        </Card>

        {/* Route Details Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Journey Route</Text>

          {/* Unified Route Map with Start, Checkpoints, Destination & Driving Path */}
          <View style={styles.detailMapWrap}>
            <TripRouteMap
              origin={{
                lat: trip.originLat,
                lng: trip.originLng,
                label: trip.originLabel,
              }}
              destination={{
                lat: trip.destinationLat,
                lng: trip.destinationLng,
                label: trip.destination,
              }}
              checkpoints={checkpoints.map((c) => ({
                lat: c.lat,
                lng: c.lng,
                label: c.label,
              }))}
              height={260}
              interactive={false}
            />
          </View>

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
          {isLead ? (
            <View style={styles.leadControls}>
              <View style={styles.leadHeaderBanner}>
                <Text style={styles.leadBadgeEmoji}>👑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.leadBadgeTitle}>You are the Trip Host</Text>
                  <Text style={styles.leadBadgeSub}>Review member requests, coordinate pickup points, and manage your journey.</Text>
                </View>
              </View>
              <Button
                label="📢 Open Trip Group Channel"
                onPress={() =>
                  router.push({
                    pathname: "/trips/[id]/chat",
                    params: { id: trip.id, isGroup: "true" },
                  })
                }
                variant="secondary"
                size="md"
                style={styles.actionBtn}
              />

              {/* Individual 1-on-1 Chats with Each Passenger */}
              <View style={styles.hostPassengersSection}>
                <Text style={styles.hostSectionSubTitle}>
                  💬 1-on-1 Private Chats ({approvedPassengers.length} {approvedPassengers.length === 1 ? "Passenger" : "Passengers"})
                </Text>
                {approvedPassengers.length > 0 ? (
                  approvedPassengers.map((p) => (
                    <View key={p.id} style={styles.passengerChatRow}>
                      <Avatar name={p.name} uri={p.photoUrl} size="sm" />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text style={styles.passengerChatName}>{p.name}</Text>
                        <Text style={styles.passengerChatSeats}>
                          {p.seats} {p.seats === 1 ? "seat" : "seats"} confirmed
                        </Text>
                      </View>
                      <Button
                        label="💬 1-on-1 Chat"
                        onPress={() =>
                          router.push({
                            pathname: "/trips/[id]/chat",
                            params: { id: trip.id, partnerId: p.id },
                          })
                        }
                        variant="primary"
                        size="sm"
                      />
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyPassengersBox}>
                    <Text style={styles.emptyPassengersText}>
                      No approved passengers yet. Once you approve join requests, direct 1-on-1 chats with each passenger will appear here.
                    </Text>
                  </View>
                )}
              </View>

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
                  onPress={() => setCancelModalOpen(true)}
                  variant="danger"
                  size="md"
                  style={styles.actionBtn}
                />
              )}
            </View>
          ) : isApproved ? (
            <View style={styles.confirmedBox}>
              <View style={styles.confirmedHeaderRow}>
                <Text style={styles.confirmedEmoji}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <View style={styles.confirmedBadgeWrap}>
                    <Badge label="Confirmed Traveler" variant="verified" />
                  </View>
                  <Text style={styles.confirmedTitle}>You&rsquo;re Confirmed on this Journey!</Text>
                  <Text style={styles.confirmedSubtitle}>
                    Host approved your booking of {myMembership?.seatsRequested || 1} {((myMembership?.seatsRequested || 1) === 1) ? "seat" : "seats"} (₹{((myMembership?.seatsRequested || 1) * trip.pricePerSeat)} total fuel split).
                  </Text>
                </View>
              </View>

              <View style={styles.confirmedActions}>
                <Button
                  label="💬 Message Host Privately (1-on-1)"
                  onPress={() =>
                    router.push({
                      pathname: "/trips/[id]/chat",
                      params: { id: trip.id, partnerId: trip.leadId },
                    })
                  }
                  variant="primary"
                  size="lg"
                  style={styles.actionBtn}
                />
                <Button
                  label="📢 View Trip Announcements & Updates"
                  onPress={() =>
                    router.push({
                      pathname: "/trips/[id]/chat",
                      params: { id: trip.id, isGroup: "true" },
                    })
                  }
                  variant="secondary"
                  size="md"
                  style={styles.actionBtn}
                />
                <ContactPhoneReveal tripId={trip.id} targetUserId={trip.leadId} />
                <Button
                  label="Cancel & Leave Trip"
                  onPress={() => setCancelModalOpen(true)}
                  variant="danger"
                  size="sm"
                  style={{ marginTop: spacing.md }}
                />
              </View>
            </View>
          ) : isPending ? (
            <View style={styles.pendingBox}>
              <View style={styles.pendingHeaderRow}>
                <Text style={styles.pendingIcon}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>Join Request Sent (Pending Approval)</Text>
                  <Text style={styles.pendingDesc}>
                    You requested {myMembership?.seatsRequested || seatsRequested} {((myMembership?.seatsRequested || seatsRequested) === 1) ? "seat" : "seats"} (₹{((myMembership?.seatsRequested || seatsRequested) * trip.pricePerSeat)} total). The host has been notified and will review your request.
                  </Text>
                </View>
              </View>
              <Button
                label="Withdraw Join Request"
                onPress={handleWithdraw}
                variant="secondary"
                size="md"
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : isDeclined ? (
            <View style={styles.declinedBox}>
              <Text style={styles.declinedIcon}>ℹ️</Text>
              <Text style={styles.declinedTitle}>Request Not Accepted</Text>
              <Text style={styles.declinedDesc}>The host was unable to accept this request. Explore other trips going to {trip.destination}.</Text>
            </View>
          ) : (
            <View style={styles.joinControls}>
              {/* Multi-seat selection stepper */}
              <View style={styles.seatPickerCard}>
                <View style={styles.seatPickerHeader}>
                  <Text style={styles.seatPickerTitle}>💺 Number of Seats</Text>
                  <Text style={styles.seatPickerSub}>Select how many passengers are travelling with you</Text>
                </View>
                <View style={styles.seatStepperRow}>
                  <Stepper
                    value={seatsRequested}
                    min={1}
                    max={Math.max(1, seatsLeft)}
                    onChange={setSeatsRequested}
                  />
                  <View style={styles.seatCostBreakdown}>
                    <Text style={styles.seatCostTotal}>₹{seatsRequested * trip.pricePerSeat}</Text>
                    <Text style={styles.seatCostNote}>({seatsRequested} {seatsRequested === 1 ? "seat" : "seats"} × ₹{trip.pricePerSeat})</Text>
                  </View>
                </View>
              </View>

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
                label={
                  seatsLeft > 0
                    ? `Request to Join (${seatsRequested} ${seatsRequested === 1 ? "Seat" : "Seats"} · ₹${seatsRequested * trip.pricePerSeat})`
                    : "Trip Full (0 Seats Left)"
                }
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
                onPress={() => setReportOpen(true)}
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

      <TripCancellationModal
        visible={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleConfirmCancellation}
        isLead={isLead}
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
  detailMapWrap: {
    marginBottom: spacing.lg,
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
  leadHeaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xs,
  },
  leadBadgeEmoji: {
    fontSize: 28,
  },
  leadBadgeTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 15,
  },
  leadBadgeSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    marginTop: 2,
    lineHeight: 16,
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
  confirmedBox: {
    padding: spacing.lg,
    backgroundColor: colors.statusVerifiedLight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(21, 128, 61, 0.3)",
    ...shadows.sm,
  },
  confirmedHeaderRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  confirmedEmoji: {
    fontSize: 32,
    lineHeight: 36,
  },
  confirmedBadgeWrap: {
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  confirmedTitle: {
    ...typography.h3,
    color: colors.statusVerified,
    marginBottom: 4,
  },
  confirmedSubtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  confirmedActions: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(21, 128, 61, 0.15)",
    paddingTop: spacing.md,
  },
  pendingBox: {
    padding: spacing.lg,
    backgroundColor: colors.statusPendingLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.25)",
  },
  pendingHeaderRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  pendingIcon: {
    fontSize: 28,
  },
  pendingTitle: {
    ...typography.h3,
    color: colors.statusPending,
    marginBottom: 4,
  },
  pendingDesc: {
    ...typography.caption,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  declinedBox: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  declinedIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  declinedTitle: {
    ...typography.h3,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  declinedDesc: {
    ...typography.caption,
    color: colors.inkSubtle,
    textAlign: "center",
  },
  seatPickerCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  seatPickerHeader: {
    marginBottom: spacing.sm,
  },
  seatPickerTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 14,
  },
  seatPickerSub: {
    ...typography.caption,
    color: colors.inkSubtle,
    marginTop: 2,
  },
  seatStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  seatCostBreakdown: {
    alignItems: "flex-end",
  },
  seatCostTotal: {
    ...typography.h2,
    color: colors.accent,
  },
  seatCostNote: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginTop: 2,
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
  hostPassengersSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  hostSectionSubTitle: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 13,
  },
  passengerChatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  passengerChatName: {
    ...typography.captionBold,
    color: colors.ink,
    fontSize: 13,
  },
  passengerChatSeats: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 11,
  },
  emptyPassengersBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  emptyPassengersText: {
    ...typography.caption,
    color: colors.inkSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
});
