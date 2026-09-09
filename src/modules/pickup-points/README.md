# pickup-points

Multiple named pickup points per trip (landmark + map pin) — a Lead adds a
few, a joiner picks the nearest one when requesting to join. Deliberately
simple (no clustering algorithm); the harder auto-suggested optimal meeting
point lives in the `routing` module's Phase 05 work instead.

**Blueprint refs:** §01, §06 `trip_pickup_points` table, §10 Phase 01 vs. Phase 05 split.
**Depends on:** routing (map picker component), trips (trip_id).

**Planned exports:** `PickupPointPicker` component, `usePickupPoints(tripId)`.
