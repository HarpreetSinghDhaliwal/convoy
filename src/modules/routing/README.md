# routing

Open-source maps/routing — deliberately not Google, after hitting real
billing friction on the sibling EV project. MapLibre for map rendering,
Nominatim for geocoding, OSRM for route geometry/distance/duration.

Phase 01: map-based origin/destination, ETA, cost-per-seat helper.
Phase 05: PostGIS-backed route-overlap trip matching and optimal-pickup
clustering — genuinely harder, kept separate rather than pretending it's
the same size of task as Phase 01's version.

**Blueprint refs:** §07 "Maps & routing," §06 `trip_routes` table, §10 Phase 01 & Phase 05.
**Feeds:** trips (ETA/distance), pickup-points (map picker).

**Planned exports:** `MapPicker` component, `useRoute(origin, destination)`,
`geocode()`, `findOverlappingTrips()` (Phase 05).
