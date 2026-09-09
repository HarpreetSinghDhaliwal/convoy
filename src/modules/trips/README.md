# trips

The core mechanic (blueprint §01): create a trip (destination, date, seats,
price), optional rich listing (inclusions, notes, description, photos,
links), browse/search, request-to-join, Lead approve/decline.

**Blueprint refs:** §01 mechanic, §06 `trips`/`trip_members`/`trip_media` tables, §10 Phase 01.
**Depends on:** kyc (gate), pickup-points, routing (ETA/distance on listings).
**Feeds:** chat (opens on approval), ratings (post-trip), follows (via_trip_id).

**Planned exports:** `CreateTripScreen`, `TripFeedScreen`, `TripDetailScreen`,
`useTrips()`, `requestToJoin()`, `approveRequest()`.
