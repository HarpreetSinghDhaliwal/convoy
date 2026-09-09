# follows

Follow, earned by traveling together — gated behind a shared *completed*
trip (`via_trip_id` enforces this at the data layer, not just the UI).
Deliberately not an open follow-anyone graph: on a platform doing
women-only trips and stranger meetups, that would be a real
harassment/stalking vector.

**Blueprint refs:** §01, §03 (why the restriction is a safety choice), §06 `follows` table, §10 Phase 03.
**Depends on:** trips (`trip_members` — proof of shared completed trip).

**Planned exports:** `FollowButton`, `useFollowing()`, `follow(userId, tripId)`.
