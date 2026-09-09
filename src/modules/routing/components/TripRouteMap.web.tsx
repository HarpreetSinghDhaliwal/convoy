import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import L from "leaflet";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { getRoute } from "../services/osrmService";
import type { GeocodeResult } from "../types";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_CENTER: [number, number] = [30.7333, 76.7794]; // Chandigarh default

export interface RouteMapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface TripRouteMapProps {
  origin?: RouteMapPoint | null;
  destination?: RouteMapPoint | null;
  checkpoints?: RouteMapPoint[];
  routeGeometry?: { type: string; coordinates: [number, number][] } | null;
  distanceKm?: number | null;
  durationMin?: number | null;
  height?: number;
  interactive?: boolean;
  activePinMode?: "origin" | "destination";
  onActivePinModeChange?: (mode: "origin" | "destination") => void;
  onPointChange?: (mode: "origin" | "destination", point: GeocodeResult) => void;
}

export function TripRouteMap({
  origin,
  destination,
  checkpoints = [],
  routeGeometry,
  distanceKm,
  durationMin,
  height = 280,
  interactive = false,
  activePinMode = "origin",
  onActivePinModeChange,
  onPointChange,
}: TripRouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Auto-fetched geometry when routeGeometry prop isn't passed directly
  const [internalGeometry, setInternalGeometry] = useState<{
    type: string;
    coordinates: [number, number][];
  } | null>(null);
  const [internalDistance, setInternalDistance] = useState<number | null>(null);
  const [internalDuration, setInternalDuration] = useState<number | null>(null);

  // Markers and route layer refs
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const checkpointMarkersRef = useRef<L.Marker[]>([]);
  const casingPolylineRef = useRef<L.Polyline | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const activeModeRef = useRef(activePinMode);
  const onPointChangeRef = useRef(onPointChange);

  useEffect(() => {
    activeModeRef.current = activePinMode;
  }, [activePinMode]);

  useEffect(() => {
    onPointChangeRef.current = onPointChange;
  }, [onPointChange]);

  // Inject Leaflet CSS
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

  // Fetch exact road geometry if not provided
  useEffect(() => {
    if (routeGeometry) {
      setInternalGeometry(null);
      return;
    }

    if (!origin || !destination || origin.lat == null || destination.lat == null) {
      setInternalGeometry(null);
      setInternalDistance(null);
      setInternalDuration(null);
      return;
    }

    let isMounted = true;
    async function fetchRoads() {
      try {
        const result = await getRoute(
          { lat: origin!.lat, lng: origin!.lng },
          { lat: destination!.lat, lng: destination!.lng },
          checkpoints.map((c) => ({ lat: c.lat, lng: c.lng })),
        );
        if (isMounted && result) {
          setInternalGeometry(result.geometry);
          setInternalDistance(result.distanceKm);
          setInternalDuration(result.durationMin);
        }
      } catch (err) {
        console.warn("TripRouteMap: failed to fetch road geometry:", err);
      }
    }
    fetchRoads();

    return () => {
      isMounted = false;
    };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, checkpoints.length, routeGeometry]);

  // Initialize single Leaflet Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = origin
      ? [origin.lat, origin.lng]
      : destination
      ? [destination.lat, destination.lng]
      : DEFAULT_CENTER;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 11,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    if (interactive) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const currentMode = activeModeRef.current;
        if (onPointChangeRef.current && currentMode) {
          onPointChangeRef.current(currentMode, {
            lat,
            lng,
            label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
        }
      });
    }

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(containerRef.current);

    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 500);

    mapRef.current = map;

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  // Synchronize Markers, Road Polyline & Fit Bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const boundsPoints: L.LatLngExpression[] = [];

    // 1. Origin Marker (Green/Trust)
    if (origin && origin.lat && origin.lng) {
      const latLng: [number, number] = [origin.lat, origin.lng];
      boundsPoints.push(latLng);

      const originIcon = L.divIcon({
        className: "custom-route-pin origin-pin",
        html: `<div style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; background-color:#1E5F74; border:3px solid #ffffff; border-radius:50%; box-shadow:0 3px 8px rgba(0,0,0,0.35); color:#ffffff; font-size:13px; font-weight:bold;">📍</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!originMarkerRef.current) {
        originMarkerRef.current = L.marker(latLng, { icon: originIcon }).addTo(map);
      } else {
        originMarkerRef.current.setLatLng(latLng);
      }
      if (origin.label) {
        originMarkerRef.current.bindTooltip(`<b>Pickup:</b> ${origin.label.split(",")[0]}`, {
          direction: "top",
          offset: [0, -14],
        });
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // 2. Destination Marker (Red/Accent)
    if (destination && destination.lat && destination.lng) {
      const latLng: [number, number] = [destination.lat, destination.lng];
      boundsPoints.push(latLng);

      const destIcon = L.divIcon({
        className: "custom-route-pin dest-pin",
        html: `<div style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; background-color:#C8452D; border:3px solid #ffffff; border-radius:50%; box-shadow:0 3px 8px rgba(0,0,0,0.35); color:#ffffff; font-size:13px; font-weight:bold;">🎯</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(latLng, { icon: destIcon }).addTo(map);
      } else {
        destMarkerRef.current.setLatLng(latLng);
      }
      if (destination.label) {
        destMarkerRef.current.bindTooltip(`<b>Destination:</b> ${destination.label.split(",")[0]}`, {
          direction: "top",
          offset: [0, -14],
        });
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // 3. Intermediate Checkpoint Markers
    checkpointMarkersRef.current.forEach((m) => m.remove());
    checkpointMarkersRef.current = [];

    checkpoints.forEach((cp, index) => {
      if (cp.lat && cp.lng) {
        const latLng: [number, number] = [cp.lat, cp.lng];
        boundsPoints.push(latLng);

        const cpIcon = L.divIcon({
          className: "custom-route-pin checkpoint-pin",
          html: `<div style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; background-color:#D97706; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.3); color:#ffffff; font-size:10px; font-weight:bold;">${
            index + 1
          }</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(latLng, { icon: cpIcon }).addTo(map);
        if (cp.label) {
          marker.bindTooltip(`<b>Stop ${index + 1}:</b> ${cp.label.split(",")[0]}`, {
            direction: "top",
            offset: [0, -12],
          });
        }
        checkpointMarkersRef.current.push(marker);
      }
    });

    // 4. Highlighted Driving Road Polyline
    if (casingPolylineRef.current) {
      casingPolylineRef.current.remove();
      casingPolylineRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    const activeGeometry = routeGeometry || internalGeometry;

    if (activeGeometry?.coordinates && activeGeometry.coordinates.length > 0) {
      // GeoJSON is [lng, lat] -> Leaflet requires [lat, lng]
      const latLngs: [number, number][] = activeGeometry.coordinates.map(([lng, lat]) => [lat, lng]);
      latLngs.forEach((pt) => boundsPoints.push(pt));

      // Dual-layer Highway road style (casing + core)
      const casing = L.polyline(latLngs, {
        color: "#1E5F74",
        weight: 7,
        opacity: 0.6,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      casingPolylineRef.current = casing;

      const polyline = L.polyline(latLngs, {
        color: "#C8452D",
        weight: 4.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      routePolylineRef.current = polyline;
    } else if (origin && destination) {
      const simpleLatLngs: [number, number][] = [
        [origin.lat, origin.lng],
        ...checkpoints.map((c): [number, number] => [c.lat, c.lng]),
        [destination.lat, destination.lng],
      ];
      const polyline = L.polyline(simpleLatLngs, {
        color: colors.accent,
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.7,
      }).addTo(map);

      routePolylineRef.current = polyline;
    }

    // 5. Fit Bounds smoothly so all pins & the complete route are visible
    if (boundsPoints.length > 1) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 15,
        animate: true,
      });
    } else if (boundsPoints.length === 1) {
      map.setView(boundsPoints[0], 13, { animate: true });
    }
  }, [origin, destination, checkpoints, routeGeometry, internalGeometry]);

  const displayDistance = distanceKm || internalDistance;
  const displayDuration = durationMin || internalDuration;

  return (
    <View style={[styles.wrapper, { height }]}>
      {/* Interactive Mode Picker Switch */}
      {interactive && onActivePinModeChange && (
        <View style={styles.pinModeSwitch}>
          <Pressable
            onPress={() => onActivePinModeChange("origin")}
            style={[styles.pinModeBtn, activePinMode === "origin" && styles.pinModeBtnOriginActive]}
          >
            <Text
              style={[
                styles.pinModeText,
                activePinMode === "origin" && styles.pinModeTextOriginActive,
              ]}
            >
              📍 Set Pickup ({origin ? "Placed" : "Tap Map"})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onActivePinModeChange("destination")}
            style={[styles.pinModeBtn, activePinMode === "destination" && styles.pinModeBtnDestActive]}
          >
            <Text
              style={[
                styles.pinModeText,
                activePinMode === "destination" && styles.pinModeTextDestActive,
              ]}
            >
              🎯 Set Destination ({destination ? "Placed" : "Tap Map"})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Floating Route Distance & Driving Duration Badge */}
      {(displayDistance || displayDuration) && (
        <View style={styles.routeStatsBadge}>
          <Text style={styles.routeStatsEmoji}>🛣️</Text>
          <Text style={styles.routeStatsText}>
            {displayDistance ? `~${Math.round(displayDistance)} km` : ""}
            {displayDistance && displayDuration ? " · " : ""}
            {displayDuration ? `${(displayDuration / 60).toFixed(1)} hr drive` : ""}
          </Text>
        </View>
      )}

      {/* Single Leaflet Map Container */}
      <View style={styles.mapContainer}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.lineLight,
    position: "relative",
    ...shadows.sm,
  },
  mapContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  pinModeSwitch: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 1000,
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineLight,
    ...shadows.md,
  },
  pinModeBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSubtle,
  },
  pinModeBtnOriginActive: {
    backgroundColor: colors.trust,
  },
  pinModeBtnDestActive: {
    backgroundColor: colors.accent,
  },
  pinModeText: {
    ...typography.captionBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  pinModeTextOriginActive: {
    color: "#FFFFFF",
  },
  pinModeTextDestActive: {
    color: "#FFFFFF",
  },
  routeStatsBadge: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 20, 0.88)",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    ...shadows.md,
  },
  routeStatsEmoji: {
    fontSize: 11,
    marginRight: 4,
  },
  routeStatsText: {
    ...typography.captionBold,
    color: "#FFFFFF",
    fontSize: 11.5,
  },
});
