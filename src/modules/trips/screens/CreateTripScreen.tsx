import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Card, Badge, Stepper, TextField, DateTimePicker } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { useAuthSession } from "@/modules/auth";
import { useKycStatus } from "@/modules/kyc";
import { usePendingRatings } from "@/modules/ratings";
import { TripRouteMap, useRoute, useGeocodeSearch, saveTripRoute } from "@/modules/routing";
import type { GeocodeResult } from "@/modules/routing";
import { looksLikeContactOrPaymentInfo } from "@/lib/contentSafety/contactInfoDetector";
import { createTrip } from "../services/tripService";
import { InclusionsEditor } from "../components/InclusionsEditor";
import { CheckpointsEditor, type DraftCheckpoint } from "../components/CheckpointsEditor";
import type { TripInclusions } from "../types";

export function CreateTripScreen() {
  const { session } = useAuthSession();
  const { isVerified, loading: kycLoading } = useKycStatus();
  const { hasPending, loading: ratingsLoading } = usePendingRatings();
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState<GeocodeResult | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<GeocodeResult | null>(null);
  const [activePinMode, setActivePinMode] = useState<"origin" | "destination">("origin");

  // Geocoding autocompletions for pickup & destination
  const originGeocode = useGeocodeSearch();
  const destGeocode = useGeocodeSearch();
  const [focusedInput, setFocusedInput] = useState<"origin" | "dest" | null>(null);
  const [originInputText, setOriginInputText] = useState("");
  const [destInputText, setDestInputText] = useState("");

  const { route, loading: routeLoading, error: routeError } = useRoute(origin, destinationPoint);
  const [departAt, setDepartAt] = useState(new Date());
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDepartAt, setReturnDepartAt] = useState<Date | null>(null);
  const [checkpoints, setCheckpoints] = useState<DraftCheckpoint[]>([]);
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState("");
  const [womenOnly, setWomenOnly] = useState(false);
  const [inclusions, setInclusions] = useState<TripInclusions>({});
  const [shortNote, setShortNote] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function validate(): string | undefined {
    if (!destination.trim()) return "Destination name is required";
    if (!origin) return "Pick a pickup point on the map or search for one";
    if (!destinationPoint) return "Pick a destination on the map or search for one";
    if (seats < 1) return "Seats must be at least 1";
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 0) return "Enter a valid cost per seat";
    if (isRoundTrip && !returnDepartAt) return "Pick a return date for the round trip";
    if (isRoundTrip && returnDepartAt && returnDepartAt <= departAt) {
      return "Return time must be after the departure time";
    }
    if (looksLikeContactOrPaymentInfo(shortNote) || looksLikeContactOrPaymentInfo(description)) {
      return "Remove phone numbers, emails, or links from the note/description — coordinate those in private chat once approved";
    }
    return undefined;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!session?.user.id || !origin || !destinationPoint) return;

    setError(undefined);
    setSubmitting(true);
    try {
      const trip = await createTrip(session.user.id, {
        destination: destination.trim(),
        originLabel: origin.label,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: destinationPoint.lat,
        destinationLng: destinationPoint.lng,
        departAt: departAt.toISOString(),
        isRoundTrip,
        returnDepartAt: isRoundTrip && returnDepartAt ? returnDepartAt.toISOString() : undefined,
        seatsTotal: seats,
        pricePerSeat: parseFloat(price),
        womenOnly,
        shortNote: shortNote.trim() || undefined,
        description: description.trim() || undefined,
        inclusions: inclusions.included?.length || inclusions.excluded?.length ? inclusions : undefined,
        checkpoints: checkpoints.length ? checkpoints : undefined,
      });

      if (route) {
        try {
          await saveTripRoute(trip.id, route);
        } catch {
          // best-effort
        }
      }

      router.replace({ pathname: "/trips/[id]", params: { id: trip.id } });
    } catch (err: any) {
      console.error("CreateTripScreen error:", err);
      const msg = err?.message || err?.error_description || (typeof err === "string" ? err : "Couldn't publish this trip — try again");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ratingsLoading && hasPending) {
    return (
      <Screen showBack title="Plan a Trip">
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Outstanding Rating</Text>
          <Text style={styles.errorBannerText}>
            You have an outstanding rating from a past trip — please submit feedback before planning a new journey.
          </Text>
          <Button label="Rate Past Trip Now" onPress={() => router.push("/ratings")} size="lg" />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen showBack title="Plan a New Roadtrip">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Host Identity Nudge Banner */}
        {!kycLoading && !isVerified && (
          <View style={styles.nudgeBanner}>
            <Text style={styles.nudgeIcon}>💡</Text>
            <Text style={styles.nudgeText}>
              Host verification builds trust and gets your trip booked 3x faster. You can still publish now.
            </Text>
          </View>
        )}

        {/* 1. Route & Map Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.stepNum}>1</Text>
            <Text style={styles.sectionTitle}>Route & Locations</Text>
          </View>

          <TextField
            label="Destination Name"
            placeholder="e.g. Manali, Kasol, Spiti Valley"
            value={destination}
            onChangeText={(t) => {
              setDestination(t);
              if (!destInputText) setDestInputText(t);
            }}
            leftIcon={<Text style={styles.inputEmoji}>📍</Text>}
          />

          {/* Location Autocomplete Inputs */}
          <View style={styles.locationsSearchBox}>
            {/* Pickup Input */}
            <View style={styles.locationInputRow}>
              <Text style={styles.locationInputDotOrigin}>📍</Text>
              <TextInput
                style={styles.locationTextInput}
                placeholder="Search pickup area, sector or city..."
                placeholderTextColor={colors.inkSubtle}
                value={origin ? origin.label : originInputText}
                onFocus={() => {
                  setFocusedInput("origin");
                  if (originInputText.trim()) originGeocode.search(originInputText);
                }}
                onChangeText={(t) => {
                  setOriginInputText(t);
                  if (origin) setOrigin(null);
                  setFocusedInput("origin");
                  originGeocode.search(t);
                }}
              />
              {origin || originInputText ? (
                <Pressable
                  onPress={() => {
                    setOrigin(null);
                    setOriginInputText("");
                    setFocusedInput(null);
                  }}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Suggestions for Pickup */}
            {focusedInput === "origin" && (originGeocode.searching || originGeocode.results.length > 0) && (
              <View style={styles.createSuggestionsBox}>
                {originGeocode.results.map((item, idx) => (
                  <Pressable
                    key={`${item.lat}-${item.lng}-${idx}`}
                    style={styles.createSuggestionItem}
                    onPress={() => {
                      setOrigin(item);
                      setOriginInputText(item.label);
                      setFocusedInput(null);
                    }}
                  >
                    <Text style={styles.createSuggestionIcon}>📍</Text>
                    <Text style={styles.createSuggestionText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.locationDivider} />

            {/* Destination Point Input */}
            <View style={styles.locationInputRow}>
              <Text style={styles.locationInputDotDest}>🎯</Text>
              <TextInput
                style={styles.locationTextInput}
                placeholder="Search destination pinpoint (e.g. Old Manali, Kasol)..."
                placeholderTextColor={colors.inkSubtle}
                value={destinationPoint ? destinationPoint.label : destInputText}
                onFocus={() => {
                  setFocusedInput("dest");
                  if (destInputText.trim()) destGeocode.search(destInputText);
                }}
                onChangeText={(t) => {
                  setDestInputText(t);
                  if (destinationPoint) setDestinationPoint(null);
                  setFocusedInput("dest");
                  destGeocode.search(t);
                }}
              />
              {destinationPoint || destInputText ? (
                <Pressable
                  onPress={() => {
                    setDestinationPoint(null);
                    setDestInputText("");
                    setFocusedInput(null);
                  }}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Suggestions for Destination */}
            {focusedInput === "dest" && (destGeocode.searching || destGeocode.results.length > 0) && (
              <View style={styles.createSuggestionsBox}>
                {destGeocode.results.map((item, idx) => (
                  <Pressable
                    key={`${item.lat}-${item.lng}-${idx}`}
                    style={styles.createSuggestionItem}
                    onPress={() => {
                      setDestinationPoint(item);
                      setDestInputText(item.label);
                      setFocusedInput(null);
                    }}
                  >
                    <Text style={styles.createSuggestionIcon}>🎯</Text>
                    <Text style={styles.createSuggestionText} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Single Consolidated Route Map */}
          <View style={styles.singleMapContainer}>
            <Text style={styles.mapInstruction}>
              🗺️ Single Journey Map · Tap on map to set or move your pins
            </Text>
            <TripRouteMap
              origin={origin}
              destination={destinationPoint}
              checkpoints={checkpoints.map((c) => ({ lat: c.lat, lng: c.lng, label: c.label }))}
              routeGeometry={route?.geometry}
              distanceKm={route?.distanceKm}
              durationMin={route?.durationMin}
              height={320}
              interactive={true}
              activePinMode={activePinMode}
              onActivePinModeChange={setActivePinMode}
              onPointChange={(mode, point) => {
                if (mode === "origin") {
                  setOrigin(point);
                  setOriginInputText(point.label);
                } else {
                  setDestinationPoint(point);
                  setDestInputText(point.label);
                }
              }}
            />
          </View>

          {routeLoading && (
            <View style={styles.calculatingBox}>
              <Text style={styles.calculatingText}>⏳ Calculating driving path and duration…</Text>
            </View>
          )}

          {routeError && <Text style={styles.routeErrorText}>{routeError}</Text>}

          {route && (
            <View style={styles.routeBox}>
              <View style={styles.routeStatsRow}>
                <Text style={styles.routeStatBold}>~{route.distanceKm.toFixed(0)} km</Text>
                <Text style={styles.routeStatDot}>•</Text>
                <Text style={styles.routeStatBold}>{(route.durationMin / 60).toFixed(1)} hr drive</Text>
              </View>
              <Text style={styles.routeSubText}>
                Estimated fuel cost share: ~₹{Math.round((route.distanceKm * 8) / Math.max(1, seats))}/seat at ₹8/km
              </Text>
            </View>
          )}

          <View style={styles.divider} />
          <CheckpointsEditor value={checkpoints} onChange={setCheckpoints} />
        </Card>

        {/* 2. Schedule & Departure Section */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.sectionTitle}>Departure & Schedule</Text>
          </View>

          <DateTimePicker
            label="Departure Date & Time"
            value={departAt}
            onChange={setDepartAt}
            minDate={new Date()}
          />

          <View style={styles.switchCard}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Round Trip Journey</Text>
              <Text style={styles.switchSubtitle}>Share fuel for both outbound and return leg</Text>
            </View>
            <Switch
              value={isRoundTrip}
              onValueChange={(next) => {
                setIsRoundTrip(next);
                if (!next) setReturnDepartAt(null);
                else if (!returnDepartAt) {
                  const ret = new Date(departAt);
                  ret.setDate(ret.getDate() + 2);
                  setReturnDepartAt(ret);
                }
              }}
              trackColor={{ false: colors.line, true: colors.accent }}
            />
          </View>

          {isRoundTrip && (
            <View style={styles.returnDateBlock}>
              <DateTimePicker
                label="Return Departure Date & Time"
                value={returnDepartAt ?? new Date(departAt.getTime() + 4 * 3600 * 1000)}
                onChange={setReturnDepartAt}
                minDate={departAt}
              />
            </View>
          )}
        </Card>

        {/* 3. Seats & Cost Contribution */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.sectionTitle}>Seats & Cost Share</Text>
          </View>

          <View style={styles.stepperContainer}>
            <Text style={styles.fieldLabel}>Available Passenger Seats</Text>
            <Stepper
              value={seats}
              min={1}
              max={7}
              onChange={setSeats}
            />
          </View>

          <TextField
            label="Cost Contribution per Seat (₹)"
            placeholder="e.g. 850 (fuel + tolls)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            leftIcon={<Text style={styles.inputEmoji}>₹</Text>}
            hint="Strictly a fair fuel/toll cost split, not a commercial fare."
          />

          <View style={styles.switchCard}>
            <View style={styles.switchTextCol}>
              <Text style={styles.switchTitle}>Women-Only Roadtrip</Text>
              <Text style={styles.switchSubtitle}>Only verified women travelers can request to join</Text>
            </View>
            <Switch
              value={womenOnly}
              onValueChange={setWomenOnly}
              trackColor={{ false: colors.line, true: colors.trust }}
            />
          </View>

          <View style={styles.divider} />
          <InclusionsEditor value={inclusions} onChange={setInclusions} />
        </Card>

        {/* 4. Notes & Description */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.stepNum}>4</Text>
            <Text style={styles.sectionTitle}>Trip Notes & Details</Text>
          </View>

          <TextField
            label="Quick Note / Highlight"
            placeholder="e.g., Leaving 5 AM sharp, spacious boot for bags"
            value={shortNote}
            onChangeText={setShortNote}
          />

          <TextField
            label="Full Description (Optional)"
            placeholder="Describe the plan, playlist vibe, planned dhaba stops..."
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ minHeight: 90, textAlignVertical: "top" }}
          />
        </Card>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <View style={styles.submitWrap}>
          <Button
            label="Publish Roadtrip"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            variant="primary"
            style={styles.publishBtn}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  nudgeBanner: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  nudgeIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  nudgeText: {
    ...typography.caption,
    color: colors.inkMuted,
    flex: 1,
  },
  card: {
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    color: colors.accent,
    textAlign: "center",
    ...typography.captionBold,
    lineHeight: 24,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  inputEmoji: {
    fontSize: 16,
  },
  mapLabel: {
    ...typography.captionBold,
    color: colors.inkMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.captionBold,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  locationsSearchBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  locationInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  locationInputDotOrigin: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  locationInputDotDest: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  locationTextInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.ink,
    paddingVertical: 6,
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.lineLight,
    marginVertical: spacing.xs,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: colors.inkSubtle,
  },
  createSuggestionsBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
    padding: 4,
    ...shadows.sm,
  },
  createSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  createSuggestionIcon: {
    fontSize: 13,
    marginRight: spacing.xs,
  },
  createSuggestionText: {
    ...typography.captionBold,
    color: colors.ink,
    flex: 1,
    fontSize: 12,
  },
  singleMapContainer: {
    marginVertical: spacing.sm,
  },
  mapInstruction: {
    ...typography.captionBold,
    color: colors.inkSoft,
    fontSize: 11.5,
    marginBottom: spacing.xs,
  },
  calculatingBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  calculatingText: {
    ...typography.captionBold,
    color: colors.trust,
  },
  routeErrorText: {
    ...typography.caption,
    color: colors.statusFlagged,
    marginVertical: spacing.sm,
  },
  routeBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.statusVerified,
  },
  routeStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeStatBold: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "700",
  },
  routeStatDot: {
    marginHorizontal: spacing.sm,
    color: colors.inkSubtle,
  },
  routeSubText: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineLight,
    marginVertical: spacing.lg,
  },
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  switchTextCol: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    ...typography.bodyMedium,
    color: colors.ink,
  },
  switchSubtitle: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  returnDateBlock: {
    marginTop: spacing.md,
  },
  stepperContainer: {
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: colors.statusFlaggedLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.25)",
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.captionBold,
    color: colors.statusFlagged,
    textAlign: "center",
  },
  errorBannerText: {
    ...typography.body,
    color: colors.statusFlagged,
    marginBottom: spacing.lg,
  },
  submitWrap: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxxl,
  },
  publishBtn: {
    ...shadows.glow,
  },
});
