import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Map, Camera, Marker } from "@maplibre/maplibre-react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { useGeocodeSearch } from "../hooks/useGeocodeSearch";
import { reverseGeocode } from "../services/geocodeService";
import type { GeocodeResult } from "../types";

// OpenFreeMap — free, no key, no rate limits, production-ready vector tiles
// for MapLibre (openfreemap.org). Chosen over Google Maps for the same
// reason as the sibling EV-charging project: no billing card, ever.
//
// Native module — this can't run inside plain Expo Go, needs a dev client
// build (`eas build --profile development`), same caveat as AdMob and the
// date/time picker.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/bright";
const DEFAULT_CENTER: [number, number] = [76.7794, 30.7333]; // Chandigarh — blueprint's home region

interface MapPickerProps {
  value: GeocodeResult | null;
  onChange: (point: GeocodeResult) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
  const [query, setQuery] = useState("");
  const { results, search } = useGeocodeSearch();
  const [resolvingTap, setResolvingTap] = useState(false);

  function handleQueryChange(text: string) {
    setQuery(text);
    search(text);
  }

  function handleSelectResult(result: GeocodeResult) {
    onChange(result);
    setQuery(result.label);
  }

  async function handleMapPress(lng: number, lat: number) {
    setResolvingTap(true);
    try {
      const label = await reverseGeocode(lat, lng);
      onChange({ lat, lng, label });
      setQuery(label);
    } finally {
      setResolvingTap(false);
    }
  }

  const center: [number, number] = value ? [value.lng, value.lat] : DEFAULT_CENTER;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search a place, or tap the map"
        placeholderTextColor={colors.inkSoft}
        value={query}
        onChangeText={handleQueryChange}
      />
      {results.length > 0 && (
        <FlatList
          style={styles.results}
          data={results}
          keyExtractor={(item, i) => `${item.lat}-${item.lng}-${i}`}
          renderItem={({ item }) => (
            <Pressable style={styles.resultRow} onPress={() => handleSelectResult(item)}>
              <Text style={styles.resultText} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      )}

      <View style={styles.mapWrap}>
        <Map
          mapStyle={MAP_STYLE}
          style={styles.map}
          onPress={(e) => {
            const [lng, lat] = e.nativeEvent.lngLat;
            handleMapPress(lng, lat);
          }}
        >
          <Camera initialViewState={{ center, zoom: 13 }} />
          {value && (
            <Marker lngLat={[value.lng, value.lat]}>
              <View style={styles.markerDot} />
            </Marker>
          )}
        </Map>
        {resolvingTap && (
          <View style={styles.resolvingOverlay}>
            <Text style={styles.resolvingText}>Locating…</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  search: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.ink,
    backgroundColor: colors.paperRaised,
    marginBottom: spacing.xs,
  },
  results: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  resultRow: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  resultText: { ...typography.caption, color: colors.ink },
  mapWrap: { height: 220, borderRadius: radius.lg, overflow: "hidden" },
  map: { flex: 1 },
  resolvingOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resolvingText: { ...typography.caption, color: colors.ink },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.ink,
  },
});
