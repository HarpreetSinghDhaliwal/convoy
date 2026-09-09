# notifications

Email notifications — the third ad-hoc module added beyond the original 11
plus `legal`, same growth pattern (ARCHITECTURE.md). Two pieces:

1. **Favorite locations** (client-facing, this module): a user favorites a
   destination — from a curated top-destinations list or a custom map
   pick — and gets emailed when a trip publishes within `radius_km`
   (default 50) of it. Not gated like person-follows (0008) — favoriting a
   *place* isn't a safety-relevant action the way following a *person* is.
2. **The actual send pipeline** (server-side, not client code): a trigger
   on `trips` matches against `favorite_locations` via PostGIS, queues a
   row in `notification_queue`, a second trigger fires `pg_net` to an Edge
   Function (`supabase/functions/send-notification-email`), which sends via
   Brevo's API. See migration 0013 and that function's own comments for the
   full pipeline and what still needs a real Brevo account to go live.

**Blueprint refs:** none directly — this was requested after the blueprint was drafted, added the same way `legal` was.
**Depends on:** auth (session), routing (`MapPicker` for custom locations).

**Planned exports:** `FavoriteLocationsScreen`, `useFavoriteLocations()`.
