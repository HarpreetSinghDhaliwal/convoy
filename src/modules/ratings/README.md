# ratings

Mandatory two-sided post-trip ratings and reviews — blocks new trip
creation/joining until pending ratings are submitted. Permanent, never
subject to the chat retention window; this is the reputation ledger.

**Blueprint refs:** §03 "Reputation," §06 `ratings` table, §10 Phase 03.
**Depends on:** trips (trip completion trigger).
**Feeds:** profile (aggregate rating display), follows (gates on completed trip, same source data).

**Planned exports:** `RatingPromptScreen`, `useRatings(userId)`, `submitRating()`.
