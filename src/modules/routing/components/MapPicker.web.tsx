import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import L from "leaflet";
import { colors, radius, spacing, typography } from "@/theme";
import { useGeocodeSearch } from "../hooks/useGeocodeSearch";
import { reverseGeocode } from "../services/geocodeService";
import type { GeocodeResult } from "../types";

// Leaflet on web provides 100% reliable rendering without requiring WebGL2 hardware support.
// Using CartoDB Voyager / OpenStreetMap tiles provides high-contrast road hierarchies,
// building footprints, and clear street labels.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_CENTER: [number, number] = [30.7333, 76.7794]; // Chandigarh [lat, lng] for Leaflet

interface MapPickerProps {
  value: GeocodeResult | null;
  onChange: (point: GeocodeResult) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const { results, search } = useGeocodeSearch();
  const [resolvingTap, setResolvingTap] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Ensure Leaflet CSS is injected in document head on web
  useEffect(() => {
    if (typeof document !== "undefined") {
      let link = document.getElementById("leaflet-css") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.onload = () => {
          mapRef.current?.invalidateSize();
        };
        document.head.appendChild(link);
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = value
      ? [value.lat, value.lng]
      : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 14,
      maxZoom: 19,
      zoomControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setResolvingTap(true);
      try {
        const label = await reverseGeocode(lat, lng);
        onChangeRef.current({ lat, lng, label });
        setQuery(label);
      } finally {
        setResolvingTap(false);
      }
    });

    // Resize observer to ensure smooth sizing inside React Native Web layout
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(containerRef.current);
    
    // Multiple fallback ticks for layout stabilization
    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 500);
    setTimeout(() => map.invalidateSize(), 1000);

    mapRef.current = map;

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize pin and view when value changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const latLng: [number, number] = [value.lat, value.lng];

    if (!markerRef.current) {
      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="width: 20px; height: 20px; background-color: ${colors.accent}; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      markerRef.current = L.marker(latLng, { icon: customIcon }).addTo(map);
    } else {
      markerRef.current.setLatLng(latLng);
    }

    map.setView(latLng, Math.max(map.getZoom(), 14), { animate: true });
  }, [value]);

  function handleQueryChange(text: string) {
    setQuery(text);
    search(text);
  }

  function handleSelectResult(result: GeocodeResult) {
    onChange(result);
    setQuery(result.label);
  }

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
        <div ref={containerRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />
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
  mapWrap: { height: 280, borderRadius: radius.lg, overflow: "hidden", position: "relative" },
  resolvingOverlay: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.paperRaised,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    zIndex: 1000,
  },
  resolvingText: { ...typography.caption, color: colors.ink },
});
