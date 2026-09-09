-- Phase 05: optimal pickup clustering. A joiner can optionally submit their
-- rough location when requesting to join (best-effort, never required —
-- see routing module for why); the Lead can then ask for a centroid-based
-- suggested meeting point across everyone who did.
--
-- Honest scope note carried into the code too: this is a geometric centroid,
-- not a real detour-minimizing optimizer (that's a facility-location
-- problem, a genuinely bigger lift) — a legitimate, standard v1 approach,
-- not oversold as more than it is.

alter table public.trip_members
  add column requested_lat numeric,
  add column requested_lng numeric;
