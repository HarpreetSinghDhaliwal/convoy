import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, Button, Card, Badge, Avatar, EmptyState } from "@/components";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { TripFeedAdSlot } from "@/modules/ads";
import { useAuthSession } from "@/modules/auth";
import { useUserProfile } from "@/modules/profile";
import { MapPicker, useGeocodeSearch } from "@/modules/routing";
import type { GeocodeResult } from "@/modules/routing/types";
import { useTrips } from "../hooks/useTrips";
import type { Trip, TripFilters } from "../types";

type DateFilterType = "all" | "today" | "tomorrow" | "weekend" | "week";
type SeatsFilterType = 0 | 1 | 2 | 3 | 4;

function TripCard({ trip }: { trip: Trip }) {
  const departDate = new Date(trip.departAt);
  const formattedDate = departDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = departDate.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const seatsLeft = trip.seatsAvailable !== undefined ? trip.seatsAvailable : trip.seatsTotal;
  const isFull = seatsLeft <= 0;
  const isUrgent = seatsLeft === 1;

  return (
    <Card
      onPress={() => router.push({ pathname: "/trips/[id]", params: { id: trip.id } })}
      style={styles.card}
    >
      {/* Top Meta Bar */}
      <View style={styles.cardTopRow}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>
            {formattedDate} · {formattedTime}
          </Text>
        </View>

        <View style={styles.badgesGroup}>
          {trip.womenOnly && (
            <Badge label="Women-only" variant="trust" icon={<Text style={styles.badgeIcon}>🛡️</Text>} />
          )}
          {trip.isRoundTrip && (
            <Badge label="Round trip" variant="neutral" icon={<Text style={styles.badgeIcon}>🔄</Text>} />
          )}
        </View>
      </View>

      {/* Route Journey Visualizer */}
      <View style={styles.routeContainer}>
        <View style={styles.routeVisual}>
          <View style={styles.originDot} />
          <View style={styles.routeLine} />
          <View style={styles.destPin}>
            <Text style={styles.destPinText}>📍</Text>
          </View>
        </View>
        <View style={styles.routeTextCol}>
          <View style={styles.originRow}>
            <Text style={styles.routeLabel}>From</Text>
            <Text style={styles.originText} numberOfLines={1}>
              {trip.originLabel}
            </Text>
          </View>
          <View style={styles.destRow}>
            <Text style={styles.routeLabel}>To</Text>
            <Text style={styles.destinationText} numberOfLines={1}>
              {trip.destination}
            </Text>
          </View>
        </View>
      </View>

      {/* Route Checkpoints Pill */}
      {trip.checkpointCount && trip.checkpointCount > 0 ? (
        <View style={styles.checkpointTag}>
          <Text style={styles.checkpointTagText}>
            🛣️ {trip.checkpointCount} boarding {trip.checkpointCount === 1 ? "stop" : "stops"} on route
          </Text>
        </View>
      ) : null}

      {/* Note / Vibe */}
      {trip.shortNote ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteQuote}>“</Text>
          <Text style={styles.noteText} numberOfLines={2}>
            {trip.shortNote}
          </Text>
        </View>
      ) : null}

      {/* Footer Info & Price */}
      <View style={styles.cardFooter}>
        <View style={styles.seatsInfo}>
          {isFull ? (
            <View style={[styles.seatPill, styles.seatPillFull]}>
              <Text style={styles.seatPillFullText}>❌ Fully Booked</Text>
            </View>
          ) : isUrgent ? (
            <View style={[styles.seatPill, styles.seatPillUrgent]}>
              <Text style={styles.seatPillUrgentText}>🔥 Only 1 seat left!</Text>
            </View>
          ) : (
            <View style={[styles.seatPill, styles.seatPillAvailable]}>
              <Text style={styles.seatPillAvailableText}>
                ⚡ {seatsLeft} of {trip.seatsTotal} seats left
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceCurrency}>₹</Text>
          <Text style={styles.priceAmount}>{trip.pricePerSeat}</Text>
          <Text style={styles.priceUnit}>/ seat</Text>
        </View>
      </View>
    </Card>
  );
}

export function TripFeedScreen() {
  const { session } = useAuthSession();
  const { profile } = useUserProfile();

  // Search input state (Dual From / To)
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");

  // Map pin dropper state
  const [originPin, setOriginPin] = useState<GeocodeResult | null>(null);
  const [destPin, setDestPin] = useState<GeocodeResult | null>(null);
  const [mapPickerTarget, setMapPickerTarget] = useState<"origin" | "dest" | null>(null);
  const [tempPickedPoint, setTempPickedPoint] = useState<GeocodeResult | null>(null);

  // Map geocoding search hooks for live map suggestions while typing
  const originGeocode = useGeocodeSearch();
  const destGeocode = useGeocodeSearch();
  const [focusedInput, setFocusedInput] = useState<"origin" | "dest" | null>(null);

  // Filter criteria
  const [seatsNeeded, setSeatsNeeded] = useState<SeatsFilterType>(0);
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [womenOnly, setWomenOnly] = useState(false);
  const [roundTripOnly, setRoundTripOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Compute cutoff date from dateFilter
  const afterDate = useMemo(() => {
    const now = new Date();
    if (dateFilter === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return todayStart.toISOString();
    }
    if (dateFilter === "tomorrow") {
      const tomStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return tomStart.toISOString();
    }
    if (dateFilter === "weekend") {
      const day = now.getDay();
      const diff = day <= 5 ? 5 - day : 0; // Days until upcoming Friday
      const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
      return friday.toISOString();
    }
    return undefined;
  }, [dateFilter]);

  // Construct filters for useTrips
  const filters: TripFilters = useMemo(() => {
    const f: TripFilters = {};

    if (originPin) {
      f.originLat = originPin.lat;
      f.originLng = originPin.lng;
    } else if (originText.trim()) {
      f.origin = originText.trim();
    }

    if (destPin) {
      f.destinationLat = destPin.lat;
      f.destinationLng = destPin.lng;
    } else if (destText.trim()) {
      f.destination = destText.trim();
    }

    if (seatsNeeded > 0) {
      f.seatsNeeded = seatsNeeded;
    }

    if (afterDate) {
      f.afterDate = afterDate;
    }

    if (womenOnly) {
      f.womenOnlyOnly = true;
    }

    if (roundTripOnly) {
      f.roundTripOnly = true;
    }

    return f;
  }, [originPin, originText, destPin, destText, seatsNeeded, afterDate, womenOnly, roundTripOnly]);

  const { trips, loading, error, refresh } = useTrips(filters);

  // Count active filters
  const activeFilterCount =
    (originPin || originText ? 1 : 0) +
    (destPin || destText ? 1 : 0) +
    (seatsNeeded > 0 ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (womenOnly ? 1 : 0) +
    (roundTripOnly ? 1 : 0);

  const resetAllFilters = () => {
    setOriginText("");
    setDestText("");
    setOriginPin(null);
    setDestPin(null);
    setSeatsNeeded(0);
    setDateFilter("all");
    setWomenOnly(false);
    setRoundTripOnly(false);
    setFocusedInput(null);
  };

  const swapOriginAndDest = () => {
    const tempOText = originText;
    const tempOPin = originPin;
    setOriginText(destText);
    setOriginPin(destPin);
    setDestText(tempOText);
    setDestPin(tempOPin);
    setFocusedInput(null);
  };

  const openMapPicker = (target: "origin" | "dest") => {
    setFocusedInput(null);
    setTempPickedPoint(target === "origin" ? originPin : destPin);
    setMapPickerTarget(target);
  };

  const confirmMapPin = () => {
    if (mapPickerTarget === "origin") {
      setOriginPin(tempPickedPoint);
      if (tempPickedPoint?.label) setOriginText(tempPickedPoint.label);
    } else if (mapPickerTarget === "dest") {
      setDestPin(tempPickedPoint);
      if (tempPickedPoint?.label) setDestText(tempPickedPoint.label);
    }
    setMapPickerTarget(null);
    setTempPickedPoint(null);
  };

  const selectOriginSuggestion = (item: GeocodeResult) => {
    setOriginPin(item);
    setOriginText(item.label);
    setFocusedInput(null);
  };

  const selectDestSuggestion = (item: GeocodeResult) => {
    setDestPin(item);
    setDestText(item.label);
    setFocusedInput(null);
  };

  return (
    <Screen showNavBar>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>Convoy</Text>
          <Text style={styles.brandSubtitle}>Shared Roadtrips & Expeditions</Text>
        </View>
        <Pressable
          onPress={() => router.push("/account")}
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}
        >
          {profile?.photoUrl ? (
            <View style={styles.avatarEmojiWrap}>
              <Text style={styles.avatarEmojiHeader}>{profile.photoUrl}</Text>
            </View>
          ) : (
            <Avatar email={session?.user.email} size={42} isVerified={profile?.kycStatus === "verified"} />
          )}
        </Pressable>
      </View>

      {/* Dual Search Box Panel (From 📍 -> To 🎯) */}
      <View style={styles.searchCard}>
        <View style={styles.searchFieldsWrap}>
          {/* Visual Track */}
          <View style={styles.searchVisualTrack}>
            <View style={styles.searchOriginDot} />
            <View style={styles.searchTrackLine} />
            <View style={styles.searchDestDot} />
          </View>

          <View style={styles.searchInputsCol}>
            {/* Origin / Pickup Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Pickup City, Area or Highway Stop..."
                placeholderTextColor={colors.inkSubtle}
                value={originPin ? originPin.label : originText}
                onFocus={() => {
                  setFocusedInput("origin");
                  if (originText.trim()) originGeocode.search(originText);
                }}
                onChangeText={(t) => {
                  setOriginText(t);
                  if (originPin) setOriginPin(null);
                  setFocusedInput("origin");
                  originGeocode.search(t);
                }}
              />
              {originPin || originText ? (
                <Pressable
                  onPress={() => {
                    setOriginPin(null);
                    setOriginText("");
                    setFocusedInput(null);
                  }}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => openMapPicker("origin")}
                style={[styles.pinBtn, originPin && styles.pinBtnActive]}
              >
                <Text style={styles.pinBtnIcon}>📍</Text>
                <Text style={[styles.pinBtnText, originPin && styles.pinBtnTextActive]}>
                  {originPin ? "Pin Set" : "Pin"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputDivider} />

            {/* Destination Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Destination (e.g., Manali, Kasol, Goa)..."
                placeholderTextColor={colors.inkSubtle}
                value={destPin ? destPin.label : destText}
                onFocus={() => {
                  setFocusedInput("dest");
                  if (destText.trim()) destGeocode.search(destText);
                }}
                onChangeText={(t) => {
                  setDestText(t);
                  if (destPin) setDestPin(null);
                  setFocusedInput("dest");
                  destGeocode.search(t);
                }}
              />
              {destPin || destText ? (
                <Pressable
                  onPress={() => {
                    setDestPin(null);
                    setDestText("");
                    setFocusedInput(null);
                  }}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => openMapPicker("dest")}
                style={[styles.pinBtn, destPin && styles.pinBtnActive]}
              >
                <Text style={styles.pinBtnIcon}>🎯</Text>
                <Text style={[styles.pinBtnText, destPin && styles.pinBtnTextActive]}>
                  {destPin ? "Pin Set" : "Pin"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Swap Button */}
          <Pressable onPress={swapOriginAndDest} style={styles.swapBtn}>
            <Text style={styles.swapBtnText}>⇅</Text>
          </Pressable>
        </View>

        {/* Live Map Autocomplete Suggestions Dropdown */}
        {focusedInput === "origin" && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsHeaderTitle}>
                {originGeocode.searching
                  ? "🔍 Searching Maps..."
                  : originGeocode.results.length > 0
                  ? "📍 Map Suggestions (Sets Exact Pin)"
                  : "📍 Popular Pickup Hubs"}
              </Text>
              <Pressable onPress={() => setFocusedInput(null)}>
                <Text style={styles.suggestionsCloseText}>Close</Text>
              </Pressable>
            </View>

            {originGeocode.results.length > 0 ? (
              originGeocode.results.map((item: GeocodeResult, idx: number) => (
                <Pressable
                  key={`${item.lat}-${item.lng}-${idx}`}
                  style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionItemPressed]}
                  onPress={() => selectOriginSuggestion(item)}
                >
                  <Text style={styles.suggestionItemIcon}>📍</Text>
                  <View style={styles.suggestionItemContent}>
                    <Text style={styles.suggestionItemTitle} numberOfLines={1}>
                      {item.label.split(",")[0]}
                    </Text>
                    <Text style={styles.suggestionItemSubtitle} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.setPinBadge}>
                    <Text style={styles.setPinBadgeText}>Set Pin</Text>
                  </View>
                </Pressable>
              ))
            ) : !originGeocode.searching ? (
              <View style={styles.quickChipsWrap}>
                {[
                  { label: "Chandigarh, India", lat: 30.7333, lng: 76.7794 },
                  { label: "Mohali (SAS Nagar), Punjab", lat: 30.7046, lng: 76.7179 },
                  { label: "Panchkula, Haryana", lat: 30.6942, lng: 76.8606 },
                  { label: "Delhi / NCR, India", lat: 28.6139, lng: 77.2090 },
                  { label: "Gurgaon (Gurugram), Haryana", lat: 28.4595, lng: 77.0266 },
                  { label: "Noida, Uttar Pradesh", lat: 28.5355, lng: 77.3910 },
                ].map((hub) => (
                  <Pressable
                    key={hub.label}
                    style={styles.quickChip}
                    onPress={() => selectOriginSuggestion(hub)}
                  >
                    <Text style={styles.quickChipText}>📍 {hub.label.split(",")[0]}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {focusedInput === "dest" && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsHeaderTitle}>
                {destGeocode.searching
                  ? "🔍 Searching Maps..."
                  : destGeocode.results.length > 0
                  ? "🎯 Map Suggestions (Sets Exact Pin)"
                  : "🎯 Popular Roadtrip Destinations"}
              </Text>
              <Pressable onPress={() => setFocusedInput(null)}>
                <Text style={styles.suggestionsCloseText}>Close</Text>
              </Pressable>
            </View>

            {destGeocode.results.length > 0 ? (
              destGeocode.results.map((item: GeocodeResult, idx: number) => (
                <Pressable
                  key={`${item.lat}-${item.lng}-${idx}`}
                  style={({ pressed }) => [styles.suggestionItem, pressed && styles.suggestionItemPressed]}
                  onPress={() => selectDestSuggestion(item)}
                >
                  <Text style={styles.suggestionItemIcon}>🎯</Text>
                  <View style={styles.suggestionItemContent}>
                    <Text style={styles.suggestionItemTitle} numberOfLines={1}>
                      {item.label.split(",")[0]}
                    </Text>
                    <Text style={styles.suggestionItemSubtitle} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.setPinBadge}>
                    <Text style={styles.setPinBadgeText}>Set Pin</Text>
                  </View>
                </Pressable>
              ))
            ) : !destGeocode.searching ? (
              <View style={styles.quickChipsWrap}>
                {[
                  { label: "Manali, Himachal Pradesh, India", lat: 32.2432, lng: 77.1892 },
                  { label: "Kasol, Parvati Valley, Himachal Pradesh", lat: 32.0100, lng: 77.3150 },
                  { label: "Shimla, Himachal Pradesh, India", lat: 31.1048, lng: 77.1734 },
                  { label: "Dharamshala, Himachal Pradesh, India", lat: 32.2190, lng: 76.3234 },
                  { label: "Rishikesh, Uttarakhand, India", lat: 30.0869, lng: 78.2676 },
                  { label: "Goa (North / Calangute / Anjuna), India", lat: 15.5439, lng: 73.7553 },
                  { label: "Jaipur, Rajasthan, India", lat: 26.9124, lng: 75.7873 },
                  { label: "Spiti Valley (Kaza), Himachal Pradesh", lat: 32.2276, lng: 78.0710 },
                ].map((hub) => (
                  <Pressable
                    key={hub.label}
                    style={styles.quickChip}
                    onPress={() => selectDestSuggestion(hub)}
                  >
                    <Text style={styles.quickChipText}>🎯 {hub.label.split(",")[0]}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        )}

        {/* Pin Location Badges */}
        {(originPin || destPin) && (
          <View style={styles.pinBadgesRow}>
            {originPin && (
              <View style={styles.activePinPill}>
                <Text style={styles.activePinPillText} numberOfLines={1}>
                  📍 Pickup: {originPin.label} (35km buffer)
                </Text>
                <Pressable onPress={() => setOriginPin(null)}>
                  <Text style={styles.activePinPillClose}>✕</Text>
                </Pressable>
              </View>
            )}
            {destPin && (
              <View style={styles.activePinPill}>
                <Text style={styles.activePinPillText} numberOfLines={1}>
                  🎯 Dest: {destPin.label} (45km buffer)
                </Text>
                <Pressable onPress={() => setDestPin(null)}>
                  <Text style={styles.activePinPillClose}>✕</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Quick Filter Pill Chips Row */}
        <View style={styles.quickFiltersContainer}>
          {/* Seats Availability Selector */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Seats Needed:</Text>
            <View style={styles.filterPillsScroll}>
              {[0, 1, 2, 3, 4].map((cnt) => (
                <Pressable
                  key={cnt}
                  onPress={() => setSeatsNeeded(cnt as SeatsFilterType)}
                  style={[
                    styles.seatFilterChip,
                    seatsNeeded === cnt && styles.seatFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.seatFilterChipText,
                      seatsNeeded === cnt && styles.seatFilterChipTextActive,
                    ]}
                  >
                    {cnt === 0 ? "Any" : `${cnt}+ 💺`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date & Additional Options Toggle */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionLabel}>Departure Time:</Text>
            <View style={styles.filterPillsScroll}>
              {[
                { id: "all", label: "Anytime" },
                { id: "today", label: "Today" },
                { id: "tomorrow", label: "Tomorrow" },
                { id: "weekend", label: "This Weekend" },
              ].map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setDateFilter(d.id as DateFilterType)}
                  style={[
                    styles.dateFilterChip,
                    dateFilter === d.id && styles.dateFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateFilterChipText,
                      dateFilter === d.id && styles.dateFilterChipTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Toggle Shields */}
          <View style={styles.togglesRow}>
            <Pressable
              onPress={() => setWomenOnly(!womenOnly)}
              style={[styles.toggleChip, womenOnly && styles.toggleChipActive]}
            >
              <Text style={[styles.toggleChipText, womenOnly && styles.toggleChipTextActive]}>
                🛡️ Women-Only Only
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setRoundTripOnly(!roundTripOnly)}
              style={[styles.toggleChip, roundTripOnly && styles.toggleChipActive]}
            >
              <Text style={[styles.toggleChipText, roundTripOnly && styles.toggleChipTextActive]}>
                🔄 Round Trips
              </Text>
            </Pressable>

            {activeFilterCount > 0 && (
              <Pressable onPress={resetAllFilters} style={styles.resetFiltersBtn}>
                <Text style={styles.resetFiltersBtnText}>Reset ({activeFilterCount})</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Plan a Trip CTA */}
      <View style={styles.ctaWrap}>
        <Button
          label="+ Plan a Roadtrip"
          onPress={() => router.push("/trips/create")}
          size="lg"
          variant="primary"
          style={styles.planBtn}
        />
      </View>

      <TripFeedAdSlot />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Trips Feed FlatList */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TripCard trip={item} />}
        refreshing={loading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="🚗"
              title={activeFilterCount > 0 ? "No rides match your criteria" : "No upcoming trips yet"}
              description={
                activeFilterCount > 0
                  ? "Try expanding your search radius, adjusting seats needed, or choosing another date."
                  : "Be the first road-trip lead to publish an upcoming journey!"
              }
              actionLabel={activeFilterCount > 0 ? "Reset Search Filters" : "Plan a Roadtrip"}
              onAction={activeFilterCount > 0 ? resetAllFilters : () => router.push("/trips/create")}
            />
          ) : null
        }
      />

      {/* Interactive Map Pin Dropper Modal */}
      <Modal
        visible={mapPickerTarget !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMapPickerTarget(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {mapPickerTarget === "origin" ? "📍 Drop Pickup Pin" : "🎯 Drop Destination Pin"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Tap anywhere on the map or search an exact address
              </Text>
            </View>
            <Pressable onPress={() => setMapPickerTarget(null)} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.modalMapWrap}>
            <MapPicker
              value={tempPickedPoint}
              onChange={(point) => setTempPickedPoint(point)}
            />
          </View>

          <View style={styles.modalFooter}>
            <View style={styles.selectedAddressBox}>
              <Text style={styles.selectedAddressLabel}>Selected Location:</Text>
              <Text style={styles.selectedAddressText} numberOfLines={2}>
                {tempPickedPoint?.label || "Tap on the map above to place your pin..."}
              </Text>
            </View>
            <Button
              label={`Confirm ${mapPickerTarget === "origin" ? "Pickup" : "Destination"} Location`}
              onPress={confirmMapPin}
              disabled={!tempPickedPoint}
              size="lg"
              variant="primary"
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  brandTitle: {
    ...typography.hero,
    color: colors.ink,
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  avatarBtn: {
    borderRadius: 24,
    ...shadows.sm,
  },
  avatarBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  avatarEmojiWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmojiHeader: {
    fontSize: 22,
  },

  // Dual Search Card
  searchCard: {
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  searchFieldsWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchVisualTrack: {
    alignItems: "center",
    marginRight: spacing.sm,
    paddingVertical: 12,
  },
  searchOriginDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.trust,
  },
  searchTrackLine: {
    width: 1.5,
    height: 32,
    backgroundColor: colors.line,
    marginVertical: 4,
  },
  searchDestDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  searchInputsCol: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.ink,
    paddingVertical: 4,
  },
  inputDivider: {
    height: 1,
    backgroundColor: colors.lineLight,
    marginVertical: 2,
  },
  clearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 13,
    color: colors.inkSubtle,
  },
  pinBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  pinBtnActive: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  pinBtnIcon: {
    fontSize: 12,
    marginRight: 3,
  },
  pinBtnText: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 11,
  },
  pinBtnTextActive: {
    color: colors.accent,
  },
  swapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  swapBtnText: {
    fontSize: 16,
    color: colors.inkMuted,
    fontWeight: "700",
  },

  // Map Autocomplete Suggestions
  suggestionsContainer: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineLight,
    padding: spacing.xs,
    overflow: "hidden",
  },
  suggestionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  suggestionsHeaderTitle: {
    ...typography.overline,
    color: colors.inkSoft,
    fontSize: 10.5,
  },
  suggestionsCloseText: {
    ...typography.captionBold,
    color: colors.inkSubtle,
    fontSize: 11,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  suggestionItemPressed: {
    backgroundColor: colors.canvasSubtle,
  },
  suggestionItemIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  suggestionItemContent: {
    flex: 1,
  },
  suggestionItemTitle: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "600",
    fontSize: 13,
  },
  suggestionItemSubtitle: {
    ...typography.caption,
    color: colors.inkSoft,
    fontSize: 11,
    marginTop: 1,
  },
  setPinBadge: {
    backgroundColor: colors.trustLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.trust,
    marginLeft: spacing.xs,
  },
  setPinBadgeText: {
    ...typography.captionBold,
    color: colors.trust,
    fontSize: 10,
  },

  quickChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: 2,
  },
  quickChip: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  quickChipText: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 11.5,
  },

  pinBadgesRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
    gap: spacing.xs,
  },
  activePinPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  activePinPillText: {
    ...typography.captionBold,
    color: colors.inkSoft,
    fontSize: 11.5,
    flex: 1,
    marginRight: spacing.xs,
  },
  activePinPillClose: {
    fontSize: 12,
    color: colors.inkSubtle,
    fontWeight: "700",
    paddingHorizontal: 4,
  },

  // Filters
  quickFiltersContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs + 2,
  },
  filterSectionLabel: {
    ...typography.overline,
    color: colors.inkSubtle,
    width: 96,
  },
  filterPillsScroll: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  seatFilterChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  seatFilterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  seatFilterChipText: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  seatFilterChipTextActive: {
    color: colors.inkLight,
  },
  dateFilterChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  dateFilterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dateFilterChipText: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  dateFilterChipTextActive: {
    color: colors.inkLight,
  },
  togglesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  toggleChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  toggleChipActive: {
    backgroundColor: colors.trustLight,
    borderColor: colors.trust,
  },
  toggleChipText: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.inkMuted,
  },
  toggleChipTextActive: {
    color: colors.trust,
  },
  resetFiltersBtn: {
    marginLeft: "auto",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  resetFiltersBtnText: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.statusFlagged,
  },

  ctaWrap: {
    marginBottom: spacing.md,
  },
  planBtn: {
    ...shadows.glow,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.lineLight,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  dateIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  dateText: {
    ...typography.captionBold,
    color: colors.inkMuted,
    fontSize: 11.5,
  },
  badgesGroup: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  badgeIcon: {
    fontSize: 11,
  },
  routeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xs,
  },
  routeVisual: {
    alignItems: "center",
    marginRight: spacing.md,
    paddingVertical: 4,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.trust,
    borderWidth: 2,
    borderColor: colors.paper,
    ...shadows.sm,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.line,
    marginVertical: 2,
  },
  destPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  destPinText: {
    fontSize: 14,
    lineHeight: 16,
  },
  routeTextCol: {
    flex: 1,
    justifyContent: "space-between",
    height: 48,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeLabel: {
    ...typography.overline,
    color: colors.inkSubtle,
    width: 38,
  },
  originText: {
    ...typography.caption,
    color: colors.inkSoft,
    flex: 1,
  },
  destinationText: {
    ...typography.h2,
    color: colors.ink,
    flex: 1,
  },
  checkpointTag: {
    backgroundColor: colors.surfaceSubtle,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  checkpointTagText: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  noteBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noteQuote: {
    ...typography.h2,
    color: colors.accent,
    lineHeight: 18,
    marginRight: 4,
  },
  noteText: {
    ...typography.caption,
    color: colors.inkMuted,
    flex: 1,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
  },
  seatsInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  seatPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  seatPillAvailable: {
    backgroundColor: colors.trustLight,
  },
  seatPillAvailableText: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.trust,
  },
  seatPillUrgent: {
    backgroundColor: colors.accentLight,
  },
  seatPillUrgentText: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.accent,
  },
  seatPillFull: {
    backgroundColor: colors.surfaceSubtle,
  },
  seatPillFullText: {
    ...typography.captionBold,
    fontSize: 11.5,
    color: colors.inkSubtle,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceCurrency: {
    ...typography.bodyMedium,
    color: colors.accent,
    fontWeight: "700",
  },
  priceAmount: {
    ...typography.h1,
    color: colors.accent,
    fontWeight: "800",
  },
  priceUnit: {
    ...typography.caption,
    color: colors.inkSoft,
    marginLeft: 3,
  },
  error: {
    ...typography.caption,
    color: colors.statusFlagged,
    marginVertical: spacing.sm,
    textAlign: "center",
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineLight,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: {
    fontSize: 16,
    color: colors.inkMuted,
    fontWeight: "700",
  },
  modalMapWrap: {
    flex: 1,
    padding: spacing.md,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lineLight,
    backgroundColor: colors.paper,
  },
  selectedAddressBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
  },
  selectedAddressLabel: {
    ...typography.overline,
    color: colors.inkSubtle,
    marginBottom: 2,
  },
  selectedAddressText: {
    ...typography.bodyMedium,
    color: colors.ink,
    fontWeight: "600",
  },
});

