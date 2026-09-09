# chat

Trip-scoped realtime chat (Supabase Realtime, not a paid chat SDK). Opens
automatically when a join request is approved. Contact-info detection blocks
phone/email/handle sharing pre-confirmation (the BlaBlaCar-derived anti-scam
control). Two-stage retention: soft-delete from the UI 2 weeks post-trip,
hard-delete from a restricted legal-hold store after 90 days.

**Blueprint refs:** §03 "Chat safety," §04 data lifecycle, §06 `messages` table.
**Depends on:** trips (trip_id, membership), safety (report/block plumbing).

**Planned exports:** `ChatScreen`, `useTripChat(tripId)`, `sendMessage()`.
